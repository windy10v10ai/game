import {
  ChallengeMetric,
  DailyChallengeActionResultDto,
  DailyChallengeClientAction,
  DailyChallengeLastActionDto,
  DailyChallengePlayerSnapshotDto,
} from '../../../common/dto/daily-challenge';
import { ApiClient, ApiParameter, HttpMethod } from '../../api/api-client';
import { dailyChallengePlayerSnapshotStore } from '../../api/daily-challenge-snapshot';
import { Player } from '../../api/player';
import {
  DailyChallengeMatchContext,
  DailyChallengeMetricValues,
  dailyChallengeMatchContext,
} from './daily-challenge-match-context';
import { readDailyChallengeMetrics } from './daily-challenge-metric-snapshot';

type DailyChallengeIncomingEvent = {
  PlayerID: PlayerID;
  requestId: string;
  assignmentId?: string;
};

type DailyChallengeEventName =
  | 'daily_challenge_accept'
  | 'daily_challenge_refresh'
  | 'daily_challenge_request_snapshot'
  | 'daily_challenge_sync_progress'
  | 'daily_challenge_view';

type DailyChallengeEventListener = (
  userId: EntityIndex,
  event: DailyChallengeIncomingEvent,
) => void;

interface DailyChallengeActionResponse {
  code: 'accepted' | 'refreshed' | 'viewed';
  snapshot: DailyChallengePlayerSnapshotDto;
  costMemberPoint: number;
  memberPointBalance?: number;
}

interface DailyChallengeResolvedIdentity {
  playerId: PlayerID;
  steamId: number;
  steamIdString: string;
}

interface DailyChallengeErrorResponse {
  code?: string;
  message?: string;
}

export interface DailyChallengeActiveEffectGuard {
  ignoreCurrentlyActiveEffectsForMetric(playerId: PlayerID, metric: ChallengeMetric): void;
}

const noOpActiveEffectGuard: DailyChallengeActiveEffectGuard = {
  ignoreCurrentlyActiveEffectsForMetric: () => undefined,
};

export interface DailyChallengeControllerDependencies {
  register: (eventName: DailyChallengeEventName, listener: DailyChallengeEventListener) => void;
  resolvePlayerId: (userId: EntityIndex, eventPlayerId: PlayerID) => PlayerID | undefined;
  getSteamId: (playerId: PlayerID) => number;
  getSnapshot: (steamId: string) => DailyChallengePlayerSnapshotDto | undefined;
  setSnapshot: (steamId: string, snapshot: DailyChallengePlayerSnapshotDto) => boolean | void;
  setMemberPointBalance?: (steamId: number, balance: number) => void;
  sendResult: (playerId: PlayerID, result: DailyChallengeActionResultDto) => void;
  sendApi: (request: ApiParameter) => void;
  decode: (data: string) => unknown;
  getGameTime: () => number;
  readMetrics: (playerId: PlayerID) => DailyChallengeMetricValues;
  createRequestId: (action: DailyChallengeClientAction, steamId: number) => string;
  schedule: (seconds: number, callback: () => number | void) => void;
  getPlayerIds: () => PlayerID[];
}

let generatedRequestSequence = 0;

const createDefaultDependencies = (): DailyChallengeControllerDependencies => ({
  register: (eventName, listener) => {
    CustomGameEventManager.RegisterListener(eventName, (userId, event) =>
      listener(userId, event as DailyChallengeIncomingEvent),
    );
  },
  resolvePlayerId: (userId, eventPlayerId) => {
    const controller = EntIndexToHScript(userId) as CDOTAPlayerController | undefined;
    if (!controller || controller.GetPlayerID() !== eventPlayerId) {
      return undefined;
    }
    return eventPlayerId;
  },
  getSteamId: (playerId) => PlayerResource.GetSteamAccountID(playerId),
  getSnapshot: (steamId) => dailyChallengePlayerSnapshotStore.get(steamId),
  setSnapshot: (steamId, snapshot) => dailyChallengePlayerSnapshotStore.set(steamId, snapshot),
  setMemberPointBalance: (steamId, balance) =>
    Player.MergePlayerInfo({ id: steamId.toString(), useableMemberPoint: balance }),
  sendResult: (playerId, result) => {
    const player = PlayerResource.GetPlayer(playerId);
    if (player) {
      CustomGameEventManager.Send_ServerToPlayer(player, 'daily_challenge_action_result', result);
    }
  },
  sendApi: (request) => ApiClient.sendWithRetry(request),
  decode: (data) => json.decode(data),
  getGameTime: () => GameRules.GetDOTATime(false, false),
  readMetrics: (playerId) => readDailyChallengeMetrics(playerId),
  createRequestId: (action, steamId) => {
    generatedRequestSequence += 1;
    return `${GameRules.Script_GetMatchID()}-${steamId}-${action}-${generatedRequestSequence}`;
  },
  schedule: (seconds, callback) => {
    Timers.CreateTimer(seconds, callback);
  },
  getPlayerIds: () => {
    const playerIds: PlayerID[] = [];
    for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
      if (PlayerResource.IsValidPlayerID(playerId)) {
        playerIds.push(playerId);
      }
    }
    return playerIds;
  },
});

export class DailyChallengeController {
  constructor(
    private readonly deps: DailyChallengeControllerDependencies = createDefaultDependencies(),
    private readonly matchContext: DailyChallengeMatchContext = dailyChallengeMatchContext,
    private readonly activeEffectGuard: DailyChallengeActiveEffectGuard = noOpActiveEffectGuard,
  ) {
    this.deps.register('daily_challenge_accept', (userId, event) =>
      this.handleAccept(userId, event),
    );
    this.deps.register('daily_challenge_refresh', (userId, event) =>
      this.handleRefresh(userId, event),
    );
    this.deps.register('daily_challenge_request_snapshot', (userId, event) =>
      this.handleSnapshotRequest(userId, event),
    );
    this.deps.register('daily_challenge_sync_progress', (userId, event) =>
      this.handleSyncProgress(userId, event),
    );
    this.deps.register('daily_challenge_view', (userId, event) => this.handleView(userId, event));
    this.deps.schedule(1, () => this.handleAutomaticSync());
  }

  private handleAccept(userId: EntityIndex, event: DailyChallengeIncomingEvent) {
    const identity = this.resolveIdentity(userId, event.PlayerID);
    if (!identity) return;
    const current = this.deps.getSnapshot(identity.steamIdString);
    if (!current || !event.assignmentId) {
      this.publishFailure(identity, 'accept', event.requestId, 'snapshot_unavailable');
      return;
    }

    const requestId = this.normalizeRequestId('accept', identity.steamId, event.requestId);
    const acceptedAtGameTime = this.deps.getGameTime();
    const baseline = this.deps.readMetrics(identity.playerId);
    this.deps.sendApi({
      method: HttpMethod.POST,
      path: '/daily-challenge/accept',
      querys: { steamId: identity.steamIdString },
      body: {
        schemaVersion: 2,
        dayId: current.dayId,
        assignmentId: event.assignmentId,
        requestId,
      },
      successFunc: (data) => {
        const response = this.firstPayload<DailyChallengeActionResponse>(data);
        const published = this.publishSuccess(identity, 'accept', requestId, response);
        const acceptedTask = published?.snapshot.acceptedTask;
        if (
          !published?.accepted ||
          !this.isIdentityCurrent(identity) ||
          !acceptedTask ||
          acceptedTask.assignmentId !== event.assignmentId
        ) {
          return;
        }
        this.matchContext.initialize(published.snapshot.dayId, 0);
        const existingAssignmentId = this.matchContext.getAcceptedState(
          identity.steamId,
        )?.assignmentId;
        this.matchContext.recordAcceptance(
          identity.steamId,
          acceptedTask.assignmentId,
          acceptedAtGameTime,
          baseline,
        );
        if (existingAssignmentId !== acceptedTask.assignmentId) {
          this.activeEffectGuard.ignoreCurrentlyActiveEffectsForMetric(
            identity.playerId,
            acceptedTask.metric,
          );
        }
      },
      failureFunc: (data) =>
        this.publishFailure(identity, 'accept', requestId, this.parseErrorCode(data)),
    });
  }

  private handleRefresh(userId: EntityIndex, event: DailyChallengeIncomingEvent) {
    const identity = this.resolveIdentity(userId, event.PlayerID);
    if (!identity) return;
    const current = this.deps.getSnapshot(identity.steamIdString);
    if (!current) {
      this.publishFailure(identity, 'refresh', event.requestId, 'snapshot_unavailable');
      return;
    }

    const requestId = this.normalizeRequestId('refresh', identity.steamId, event.requestId);
    this.deps.sendApi({
      method: HttpMethod.POST,
      path: '/daily-challenge/refresh',
      querys: { steamId: identity.steamIdString },
      body: { schemaVersion: 2, dayId: current.dayId, requestId },
      successFunc: (data) => {
        const response = this.firstPayload<DailyChallengeActionResponse>(data);
        this.publishSuccess(identity, 'refresh', requestId, response);
      },
      failureFunc: (data) =>
        this.publishFailure(identity, 'refresh', requestId, this.parseErrorCode(data)),
    });
  }

  private handleView(userId: EntityIndex, event: DailyChallengeIncomingEvent) {
    const identity = this.resolveIdentity(userId, event.PlayerID);
    if (!identity) return;
    const current = this.deps.getSnapshot(identity.steamIdString);
    if (!current) {
      this.publishFailure(identity, 'view', event.requestId, 'snapshot_unavailable');
      return;
    }

    const requestId = this.normalizeRequestId('view', identity.steamId, event.requestId);
    this.deps.sendApi({
      method: HttpMethod.POST,
      path: '/daily-challenge/view',
      querys: { steamId: identity.steamIdString },
      body: { schemaVersion: 2, dayId: current.dayId, requestId },
      successFunc: (data) => {
        const response = this.firstPayload<DailyChallengeActionResponse>(data);
        this.publishSuccess(identity, 'view', requestId, response);
      },
      failureFunc: (data) =>
        this.publishFailure(identity, 'view', requestId, this.parseErrorCode(data)),
    });
  }

  private handleSnapshotRequest(userId: EntityIndex, event: DailyChallengeIncomingEvent) {
    const identity = this.resolveIdentity(userId, event.PlayerID);
    if (!identity) return;
    const requestId = this.normalizeRequestId('snapshot', identity.steamId, event.requestId);
    const cached = this.deps.getSnapshot(identity.steamIdString);
    if (cached) {
      this.matchContext.initialize(cached.dayId, 0);
      this.publishSnapshot(identity, 'snapshot', requestId, 'snapshot', cached);
      return;
    }

    this.deps.sendApi({
      method: HttpMethod.GET,
      path: '/daily-challenge/snapshot',
      querys: { steamId: identity.steamIdString },
      successFunc: (data) => {
        const snapshot = this.firstPayload<DailyChallengePlayerSnapshotDto>(data);
        this.matchContext.initialize(snapshot.dayId, 0);
        this.publishSnapshot(identity, 'snapshot', requestId, 'snapshot', snapshot);
      },
      failureFunc: (data) =>
        this.publishFailure(identity, 'snapshot', requestId, this.parseErrorCode(data)),
    });
  }

  private handleSyncProgress(userId: EntityIndex, event: DailyChallengeIncomingEvent) {
    const identity = this.resolveIdentity(userId, event.PlayerID);
    if (!identity) return;
    const requestId = this.normalizeRequestId('sync', identity.steamId, event.requestId);
    this.deps.sendApi({
      method: HttpMethod.GET,
      path: '/daily-challenge/snapshot',
      querys: { steamId: identity.steamIdString },
      successFunc: (data) => {
        const snapshot = this.firstPayload<DailyChallengePlayerSnapshotDto>(data);
        this.deps.setSnapshot(identity.steamIdString, snapshot);
        const acceptedSnapshot = this.deps.getSnapshot(identity.steamIdString);
        if (acceptedSnapshot) {
          this.matchContext.initialize(acceptedSnapshot.dayId, 0);
        }
        if (!acceptedSnapshot || !this.reconcileAcceptedAssignment(identity, acceptedSnapshot)) {
          this.publishFailure(identity, 'sync', requestId, 'accepted_task_unavailable');
          return;
        }
        if (!this.publishCurrentMatchProgress(identity, requestId, 'synced')) {
          this.publishFailure(identity, 'sync', requestId, 'accepted_task_unavailable');
        }
      },
      failureFunc: (data) =>
        this.publishFailure(identity, 'sync', requestId, this.parseErrorCode(data)),
    });
  }

  private reconcileAcceptedAssignment(
    identity: DailyChallengeResolvedIdentity,
    snapshot: DailyChallengePlayerSnapshotDto,
  ): boolean {
    const acceptedTask = snapshot.acceptedTask;
    const acceptedState = this.matchContext.getAcceptedState(identity.steamId);
    if (!acceptedTask || !acceptedState) {
      return false;
    }
    if (acceptedState.assignmentId === acceptedTask.assignmentId) {
      return true;
    }

    const baseline = this.deps.readMetrics(identity.playerId);
    this.matchContext.recordAcceptance(
      identity.steamId,
      acceptedTask.assignmentId,
      acceptedState.acceptedAtGameTime,
      baseline,
    );
    this.activeEffectGuard.ignoreCurrentlyActiveEffectsForMetric(
      identity.playerId,
      acceptedTask.metric,
    );
    this.deps.setSnapshot(identity.steamIdString, {
      ...snapshot,
      currentMatchProgress: undefined,
    });
    return true;
  }

  private handleAutomaticSync() {
    if (!this.matchContext.isMatchStartConfirmed()) {
      return 1;
    }

    const now = this.deps.getGameTime();
    for (const playerId of this.deps.getPlayerIds()) {
      const steamId = this.deps.getSteamId(playerId);
      if (steamId <= 0) continue;
      const identity: DailyChallengeResolvedIdentity = {
        playerId,
        steamId,
        steamIdString: steamId.toString(),
      };
      this.publishCurrentMatchProgress(
        identity,
        this.deps.createRequestId('sync', steamId),
        'auto_synced',
        now + 300,
      );
    }
    return 300;
  }

  private publishCurrentMatchProgress(
    identity: DailyChallengeResolvedIdentity,
    requestId: string,
    code: 'synced' | 'auto_synced',
    nextAutoSyncAtGameTime?: number,
  ) {
    const snapshot = this.deps.getSnapshot(identity.steamIdString);
    const acceptedTask = snapshot?.acceptedTask;
    const acceptedState = this.matchContext.getAcceptedState(identity.steamId);
    if (!snapshot || !acceptedTask || acceptedState?.assignmentId !== acceptedTask.assignmentId) {
      return false;
    }

    const currentValue = this.deps.readMetrics(identity.playerId)[acceptedTask.metric] ?? 0;
    const provisionalProgress = this.matchContext.getMetricDelta(
      identity.steamId,
      acceptedTask.metric,
      currentValue,
    );
    const currentMatchProgress = {
      assignmentId: acceptedTask.assignmentId,
      provisionalProgress,
      lastSyncedAtGameTime: this.deps.getGameTime(),
      ...(nextAutoSyncAtGameTime === undefined ? {} : { nextAutoSyncAtGameTime }),
    };
    this.publishSnapshot(identity, 'sync', requestId, code, {
      ...snapshot,
      currentMatchProgress,
    });
    return true;
  }

  private publishSuccess(
    identity: DailyChallengeResolvedIdentity,
    actionName: DailyChallengeClientAction,
    requestId: string,
    response: DailyChallengeActionResponse,
  ) {
    const published = this.publishSnapshot(
      identity,
      actionName,
      requestId,
      response.code,
      response.snapshot,
      response.costMemberPoint,
    );
    if (response.memberPointBalance !== undefined) {
      this.deps.setMemberPointBalance?.(identity.steamId, response.memberPointBalance);
    }
    return published;
  }

  private publishSnapshot(
    identity: DailyChallengeResolvedIdentity,
    actionName: DailyChallengeClientAction,
    requestId: string,
    code: string,
    snapshot: DailyChallengePlayerSnapshotDto,
    costMemberPoint?: number,
  ) {
    const action = this.createAction(actionName, requestId, true, code, costMemberPoint);
    const nextSnapshot = { ...snapshot, lastAction: action };
    const accepted = this.deps.setSnapshot(identity.steamIdString, nextSnapshot) !== false;
    const publishedSnapshot = accepted
      ? nextSnapshot
      : this.deps.getSnapshot(identity.steamIdString);
    if (!publishedSnapshot) {
      return undefined;
    }
    if (this.isIdentityCurrent(identity)) {
      this.deps.sendResult(identity.playerId, { ...action, snapshot: publishedSnapshot });
    }
    return { accepted, snapshot: publishedSnapshot };
  }

  private publishFailure(
    identity: DailyChallengeResolvedIdentity,
    actionName: DailyChallengeClientAction,
    requestId: string,
    code: string,
  ) {
    if (this.isIdentityCurrent(identity)) {
      this.deps.sendResult(
        identity.playerId,
        this.createAction(actionName, requestId, false, code),
      );
    }
  }

  private isIdentityCurrent(identity: DailyChallengeResolvedIdentity): boolean {
    return this.deps.getSteamId(identity.playerId) === identity.steamId;
  }

  private createAction(
    action: DailyChallengeClientAction,
    requestId: string,
    success: boolean,
    code: string,
    costMemberPoint?: number,
  ): DailyChallengeLastActionDto {
    const result: DailyChallengeLastActionDto = { action, requestId, success, code };
    if (costMemberPoint !== undefined) {
      result.costMemberPoint = costMemberPoint;
    }
    return result;
  }

  private resolveIdentity(userId: EntityIndex, eventPlayerId: PlayerID) {
    const playerId = this.deps.resolvePlayerId(userId, eventPlayerId);
    if (playerId === undefined) {
      return undefined;
    }
    const steamId = this.deps.getSteamId(playerId);
    if (steamId <= 0) {
      return undefined;
    }
    return { playerId, steamId, steamIdString: steamId.toString() };
  }

  private normalizeRequestId(
    action: DailyChallengeClientAction,
    steamId: number,
    requestId: string,
  ) {
    return requestId && requestId.length > 0
      ? requestId
      : this.deps.createRequestId(action, steamId);
  }

  private firstPayload<T>(data: string): T {
    const decoded = this.deps.decode(data) as T | T[];
    // Existing game APIs may return a single-item array, while Nest endpoints
    // return the action/snapshot DTO directly. Accept both response shapes.
    return (Array.isArray(decoded) ? decoded[0] : decoded) as T;
  }

  private parseErrorCode(data: string) {
    try {
      const decoded = this.deps.decode(data) as {
        0?: DailyChallengeErrorResponse;
        code?: string;
        message?: string;
      };
      const payload = decoded[0] ?? decoded;
      return payload.code ?? payload.message ?? 'request_failed';
    } catch {
      return 'request_failed';
    }
  }
}
