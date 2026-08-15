import {
  DailyChallengeClientAction,
  DailyChallengePlayerSnapshotDto,
} from '../../../../common/dto/daily-challenge';
import { shouldReplaceDailyChallengeSnapshot } from '../../../../vscripts/api/daily-challenge-snapshot-order';
import { transformDailyChallenge } from '../../../utils/net-table-transform';
import { isSuccessfulNetworkBoolean } from '../pages/daily-challenge/daily-challenge-ui';

export interface DailyChallengeNetworkActionResult {
  action: DailyChallengeClientAction;
  requestId: string;
  success: boolean | 0 | 1;
  code: string;
  costMemberPoint?: number;
  snapshot?: Record<string, unknown>;
}

export type DailyChallengeActionResultListener = (data: DailyChallengeNetworkActionResult) => void;

export class DailyChallengeActionResultChannel {
  private readonly listeners: DailyChallengeActionResultListener[] = [];
  private latestResult: DailyChallengeNetworkActionResult | undefined;

  subscribe(listener: DailyChallengeActionResultListener): () => void {
    this.listeners.push(listener);
    if (this.latestResult) listener(this.latestResult);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }

  publish(data: DailyChallengeNetworkActionResult): void {
    this.latestResult = data;
    for (const listener of [...this.listeners]) listener(data);
  }
}

export interface DailyChallengeSnapshotClientDependencies {
  subscribe: (listener: (data: DailyChallengeNetworkActionResult) => void) => number;
  unsubscribe: (listenerId: number) => void;
  sendSnapshotRequest: (requestId: string) => void;
  createRequestId: () => string;
  scheduleTimeout: (callback: () => void) => number;
  cancelTimeout: (timeoutId: number) => void;
  onSnapshot: (snapshot: DailyChallengePlayerSnapshotDto) => void;
  onLoadError: (code: string) => void;
}

export class DailyChallengeSnapshotClient {
  private listenerId: number | undefined;
  private requestId = '';
  private timeoutId: number | undefined;
  private latestSnapshot: DailyChallengePlayerSnapshotDto | undefined;

  constructor(private readonly deps: DailyChallengeSnapshotClientDependencies) {}

  start(): void {
    if (this.listenerId !== undefined) return;
    this.listenerId = this.deps.subscribe((data) => this.handleResult(data));
    this.requestSnapshot();
  }

  requestSnapshot(): void {
    if (this.requestId) return;
    const requestId = this.deps.createRequestId();
    this.requestId = requestId;
    this.deps.onLoadError('');
    this.timeoutId = this.deps.scheduleTimeout(() => {
      if (this.requestId !== requestId) return;
      this.requestId = '';
      this.timeoutId = undefined;
      this.deps.onLoadError('request_timeout');
    });
    this.deps.sendSnapshotRequest(requestId);
  }

  dispose(): void {
    if (this.listenerId !== undefined) {
      this.deps.unsubscribe(this.listenerId);
      this.listenerId = undefined;
    }
    this.finishRequest();
    this.latestSnapshot = undefined;
  }

  private handleResult(data: DailyChallengeNetworkActionResult): void {
    if (data.snapshot) {
      const snapshot = transformDailyChallenge(data.snapshot);
      if (
        !this.latestSnapshot ||
        shouldReplaceDailyChallengeSnapshot(this.latestSnapshot, snapshot)
      ) {
        this.latestSnapshot = snapshot;
        this.deps.onSnapshot(snapshot);
      }
    }
    if (data.action !== 'snapshot' || data.requestId !== this.requestId) return;

    this.finishRequest();
    if (!isSuccessfulNetworkBoolean(data.success) || !data.snapshot) {
      this.deps.onLoadError(data.code || 'request_failed');
    }
  }

  private finishRequest(): void {
    this.requestId = '';
    if (this.timeoutId !== undefined) {
      this.deps.cancelTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}
