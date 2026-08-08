import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DailyChallengeClientAction,
  DailyChallengePlayerSnapshotDto,
  DailyChallengeTaskSnapshotDto,
} from '../../../../../common/dto/daily-challenge';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { PrimaryButton, TabNavigation } from '../../../shared/components';
import { useNetTable } from '../../../shared/hooks/useNetTable';
import { useDailyChallenge } from '../../store/DailyChallengeContext';
import { DailyChallengeActionResultListener } from '../../store/daily-challenge-snapshot-client';
import { useNavigation } from '../../store/NavigationContext';
import { ChallengeRefreshButton } from './ChallengeRefreshButton';
import { GlobalChallengeCard } from './GlobalChallengeCard';
import { PersonalCandidateCard, TaskStarBadge } from './PersonalCandidateCard';
import { RecentRewardsPanel } from './RecentRewardsPanel';
import { StreakPanel } from './StreakPanel';
import {
  createDailyChallengeRequestId,
  DailyChallengeAcceptButtonState,
  DailyChallengeRequestTimeout,
  DailyChallengeRetryableActionRequest,
  DailyChallengeViewedRequestState,
  formatAutoSyncCountdown,
  formatDailyChallengeRoundProgress,
  getDailyChallengeAcceptButtonState,
  getDailyChallengeRoundState,
  getDailyChallengeTaskTitle,
  isSuccessfulNetworkBoolean,
} from './daily-challenge-ui';

type DailyChallengeTabId = 'today' | 'streak' | 'rewards' | 'rules';
type PendingAction = {
  action: DailyChallengeClientAction;
  requestId: string;
};

let requestSequence = 0;
const refreshRequestState = new DailyChallengeRetryableActionRequest();

function createRequestId(action: DailyChallengeClientAction, dayId: string): string {
  requestSequence = (requestSequence + 1) % 1000000;
  return createDailyChallengeRequestId(
    action,
    dayId,
    Game.GetLocalPlayerID(),
    Game.GetGameTime() * 1000,
    requestSequence,
  );
}

function getActionMessage(code: string, success: boolean): string {
  const knownKey = `#daily_challenge_action_${code}`;
  const localized = $.Localize(knownKey);
  if (localized !== knownKey) return localized;
  return success
    ? $.Localize('#daily_challenge_action_success')
    : $.Localize('#daily_challenge_action_failed');
}

function usePanoramaRequestTimeout(): React.MutableRefObject<
  DailyChallengeRequestTimeout<ScheduleID>
> {
  const timeoutRef = useRef<DailyChallengeRequestTimeout<ScheduleID> | null>(null);
  if (timeoutRef.current === null) {
    timeoutRef.current = new DailyChallengeRequestTimeout(
      (seconds, callback) => $.Schedule(seconds, callback),
      (handle) => $.CancelScheduled(handle),
    );
  }
  return timeoutRef as React.MutableRefObject<DailyChallengeRequestTimeout<ScheduleID>>;
}

function useDailyChallengeGameTime(): number {
  const [gameTime, setGameTime] = useState(() => Game.GetGameTime());
  useEffect(() => {
    let tickHandle: ScheduleID | null = null;
    let disposed = false;
    const tick = () => {
      if (disposed) return;
      setGameTime(Game.GetGameTime());
      tickHandle = $.Schedule(1, tick);
    };
    tick();
    return () => {
      disposed = true;
      if (tickHandle !== null) $.CancelScheduled(tickHandle);
    };
  }, []);
  return gameTime;
}

function useDailyChallengePageActions(
  snapshot: DailyChallengePlayerSnapshotDto | null,
  subscribeActionResult: (listener: DailyChallengeActionResultListener) => () => void,
) {
  const gameTime = useDailyChallengeGameTime();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [viewRetrySequence, setViewRetrySequence] = useState(0);
  const pendingRef = useRef<PendingAction | null>(null);
  const viewRequestStateRef = useRef(new DailyChallengeViewedRequestState());
  const viewRetryHandleRef = useRef<ScheduleID | null>(null);
  const actionTimeoutRef = usePanoramaRequestTimeout();
  const viewTimeoutRef = usePanoramaRequestTimeout();

  const scheduleViewRetry = useCallback(() => {
    if (viewRetryHandleRef.current !== null) return;
    viewRetryHandleRef.current = $.Schedule(2, () => {
      viewRetryHandleRef.current = null;
      setViewRetrySequence((sequence) => sequence + 1);
    });
  }, []);

  useEffect(() => {
    const actionTimeout = actionTimeoutRef.current;
    const viewTimeout = viewTimeoutRef.current;
    const unsubscribe = subscribeActionResult((data) => {
      const success = isSuccessfulNetworkBoolean(data.success);
      if (data.action === 'view') {
        viewTimeout.finish(data.requestId);
        const result = viewRequestStateRef.current.finish(data.requestId, success);
        if (result.shouldRetry) scheduleViewRetry();
        return;
      }
      const resolvedRefresh =
        data.action === 'refresh' && refreshRequestState.resolve(data.requestId);
      const resolvedPending = actionTimeout.finish(data.requestId);
      if (!resolvedPending && !resolvedRefresh) return;
      pendingRef.current = null;
      setPending(null);
      setActionMessage(getActionMessage(data.code, success));
    });
    return () => {
      unsubscribe();
      actionTimeout.dispose();
      viewTimeout.dispose();
      if (viewRetryHandleRef.current !== null) {
        $.CancelScheduled(viewRetryHandleRef.current);
        viewRetryHandleRef.current = null;
      }
    };
  }, [actionTimeoutRef, scheduleViewRetry, subscribeActionResult, viewTimeoutRef]);

  useEffect(() => {
    if (!snapshot || snapshot.unreadRewardCount <= 0) return;
    const viewedKey = `${snapshot.dayId}:${snapshot.unreadRewardCount}`;
    const requestId = createRequestId('view', snapshot.dayId);
    if (!viewRequestStateRef.current.begin(viewedKey, requestId)) return;
    viewTimeoutRef.current.start(requestId, () => {
      const result = viewRequestStateRef.current.finish(requestId, false);
      if (result.shouldRetry) scheduleViewRetry();
    });
    GameEvents.SendCustomGameEventToServer('daily_challenge_view', { requestId });
  }, [scheduleViewRetry, snapshot, viewRetrySequence, viewTimeoutRef]);

  const beginAction = (action: DailyChallengeClientAction, requestId: string) => {
    const nextPending = { action, requestId };
    pendingRef.current = nextPending;
    setPending(nextPending);
    setActionMessage('');
    actionTimeoutRef.current.start(requestId, () => {
      if (pendingRef.current?.requestId !== requestId) return;
      pendingRef.current = null;
      setPending(null);
      setActionMessage(getActionMessage('request_timeout', false));
    });
  };

  const sendAccept = (assignmentId: string) => {
    if (!snapshot || pendingRef.current) return;
    const requestId = createRequestId('accept', snapshot.dayId);
    beginAction('accept', requestId);
    GameEvents.SendCustomGameEventToServer('daily_challenge_accept', { assignmentId, requestId });
  };

  const sendRefresh = () => {
    if (!snapshot || pendingRef.current) return;
    const requestId = refreshRequestState.getOrCreate('refresh', snapshot.dayId, () =>
      createRequestId('refresh', snapshot.dayId),
    );
    beginAction('refresh', requestId);
    GameEvents.SendCustomGameEventToServer('daily_challenge_refresh', { requestId });
  };

  const sendSync = () => {
    if (!snapshot?.acceptedTask || pendingRef.current) return;
    const requestId = createRequestId('sync', snapshot.dayId);
    const nextPending = { action: 'sync' as const, requestId };
    beginAction(nextPending.action, requestId);
    GameEvents.SendCustomGameEventToServer('daily_challenge_sync_progress', { requestId });
  };

  return { actionMessage, gameTime, pending, sendAccept, sendRefresh, sendSync };
}

function getTabs(): { id: DailyChallengeTabId; label: string }[] {
  return [
    { id: 'today', label: $.Localize('#daily_challenge_tab_today') },
    { id: 'streak', label: $.Localize('#daily_challenge_tab_streak') },
    { id: 'rewards', label: $.Localize('#daily_challenge_tab_rewards') },
    { id: 'rules', label: $.Localize('#daily_challenge_tab_rules') },
  ];
}

function LoadingState({
  loadError,
  requestSnapshot,
}: {
  loadError: string;
  requestSnapshot: () => void;
}) {
  if (!loadError) {
    return (
      <Panel className="daily-challenge-loading">
        <Label text={$.Localize('#daily_challenge_loading')} />
      </Panel>
    );
  }
  return (
    <Panel className="daily-challenge-loading">
      <Label className="daily-challenge-load-error" text={loadError} />
      <Button className="ButtonPrimary daily-challenge-retry" onactivate={requestSnapshot}>
        <Label text={$.Localize('#daily_challenge_retry')} />
      </Button>
    </Panel>
  );
}

function CompletedTaskList({ tasks }: { tasks: DailyChallengeTaskSnapshotDto[] }) {
  const rewardTotal = tasks.reduce((total, task) => total + Math.max(0, task.rewardSeasonPoint), 0);
  return (
    <Panel className="daily-challenge-personal-complete">
      <Panel className="daily-challenge-personal-complete-heading">
        <Label
          className="daily-challenge-personal-complete-title"
          text={$.Localize('#daily_challenge_personal_complete')}
        />
        <Label
          className="daily-challenge-personal-complete-summary"
          text={$.Localize('#daily_challenge_personal_complete_summary')
            .replace('{count}', String(tasks.length))
            .replace('{points}', String(rewardTotal))}
        />
      </Panel>
      <Panel className="daily-challenge-completed-task-list">
        {tasks.map((task, index) => (
          <Panel key={task.assignmentId} className="daily-challenge-completed-task-row">
            <Label className="daily-challenge-completed-task-index" text={String(index + 1)} />
            <Panel className="daily-challenge-completed-task-main">
              <TaskStarBadge task={task} />
              <Label
                className="daily-challenge-completed-task-title"
                text={getDailyChallengeTaskTitle(task, $.Language(), (key) => $.Localize(key))}
              />
            </Panel>
            <Label
              className="daily-challenge-completed-task-reward"
              text={$.Localize('#daily_challenge_completed_task_reward')
                .replace('{star}', String(task.star ?? 2))
                .replace('{points}', String(task.rewardSeasonPoint))}
            />
          </Panel>
        ))}
      </Panel>
    </Panel>
  );
}

function AcceptedTaskPanel({
  task,
  provisionalProgress,
  autoSyncCountdown,
  acceptButtonState,
  pending,
  sendSync,
}: {
  task: DailyChallengeTaskSnapshotDto;
  provisionalProgress: number;
  autoSyncCountdown: string;
  acceptButtonState: DailyChallengeAcceptButtonState;
  pending: PendingAction | null;
  sendSync: () => void;
}) {
  const pendingAction = pending?.action;
  return (
    <Panel className="daily-challenge-accepted-hero">
      <PersonalCandidateCard
        task={task}
        accepted={true}
        buttonState={acceptButtonState}
        provisionalProgress={provisionalProgress}
      />
      <Panel className="daily-challenge-accepted-actions">
        <Label
          className="daily-challenge-accepted-reward"
          text={$.Localize('#daily_challenge_reward_points').replace(
            '{n}',
            String(task.rewardSeasonPoint),
          )}
        />
        <PrimaryButton
          className="daily-challenge-sync-button"
          label={
            pendingAction === 'sync'
              ? $.Localize('#daily_challenge_syncing')
              : $.Localize('#daily_challenge_sync_progress')
          }
          enabled={pending === null}
          onClick={sendSync}
        />
        <Label
          className="daily-challenge-auto-sync"
          text={$.Localize('#daily_challenge_auto_sync').replace('{time}', autoSyncCountdown)}
        />
      </Panel>
      <Label
        className="daily-challenge-settlement-hint"
        text={$.Localize('#daily_challenge_settlement_hint')}
      />
    </Panel>
  );
}

function PersonalTaskBody({
  snapshot,
  completed,
  acceptedProgress,
  autoSyncCountdown,
  acceptButtonState,
  pending,
  sendAccept,
  sendSync,
}: {
  snapshot: DailyChallengePlayerSnapshotDto;
  completed: boolean;
  acceptedProgress?: number;
  autoSyncCountdown: string;
  acceptButtonState: DailyChallengeAcceptButtonState;
  pending: PendingAction | null;
  sendAccept: (assignmentId: string) => void;
  sendSync: () => void;
}) {
  if (completed) return <CompletedTaskList tasks={snapshot.completedTasks ?? []} />;
  if (snapshot.acceptedTask) {
    return (
      <AcceptedTaskPanel
        task={snapshot.acceptedTask}
        provisionalProgress={acceptedProgress ?? 0}
        autoSyncCountdown={autoSyncCountdown}
        acceptButtonState={acceptButtonState}
        pending={pending}
        sendSync={sendSync}
      />
    );
  }
  if (snapshot.needsSelection && snapshot.candidates.length > 0) {
    return (
      <Panel className="daily-challenge-candidate-row">
        {snapshot.candidates.map((task) => (
          <PersonalCandidateCard
            key={task.assignmentId}
            task={task}
            accepted={false}
            buttonState={acceptButtonState}
            onAccept={sendAccept}
          />
        ))}
      </Panel>
    );
  }
  return (
    <Label className="daily-challenge-empty" text={$.Localize('#daily_challenge_personal_empty')} />
  );
}

function getPersonalKicker(snapshot: DailyChallengePlayerSnapshotDto, completed: boolean): string {
  if (completed) return $.Localize('#daily_challenge_round_complete');
  if (snapshot.acceptedTask) return $.Localize('#daily_challenge_selected');
  return $.Localize('#daily_challenge_choose_one');
}

function TodayTab({
  snapshot,
  memberPointBalance,
  gameTime,
  pending,
  sendAccept,
  sendRefresh,
  sendSync,
}: {
  snapshot: DailyChallengePlayerSnapshotDto;
  memberPointBalance: number;
  gameTime: number;
  pending: PendingAction | null;
  sendAccept: (assignmentId: string) => void;
  sendRefresh: () => void;
  sendSync: () => void;
}) {
  const pendingAction = pending?.action;
  const acceptButtonState = getDailyChallengeAcceptButtonState(pendingAction, snapshot.status);
  const acceptedProgress =
    snapshot.acceptedTask &&
    snapshot.currentMatchProgress?.assignmentId === snapshot.acceptedTask.assignmentId
      ? snapshot.currentMatchProgress
      : undefined;
  const nextAutoSyncAt = acceptedProgress?.nextAutoSyncAtGameTime;
  const autoSyncCountdown =
    nextAutoSyncAt === undefined ? '--:--' : formatAutoSyncCountdown(nextAutoSyncAt, gameTime);
  const roundState = getDailyChallengeRoundState(snapshot);
  const roundProgressText = formatDailyChallengeRoundProgress(
    $.Localize('#daily_challenge_round_progress'),
    roundState.currentRound,
    roundState.completedRoundCount,
    roundState.totalRounds,
  );

  return (
    <Panel className="daily-challenge-tab-content daily-challenge-today-tab">
      <Panel className="daily-challenge-personal-section">
        <Panel className="daily-challenge-personal-header">
          <Panel className="daily-challenge-personal-heading">
            <Label
              className="daily-challenge-section-kicker"
              text={getPersonalKicker(snapshot, roundState.isComplete)}
            />
            <Label
              className="daily-challenge-section-title"
              text={$.Localize('#daily_challenge_personal_title')}
            />
            <Label className="daily-challenge-round-progress" text={roundProgressText} />
          </Panel>
          {!snapshot.acceptedTask && !roundState.isComplete && snapshot.needsSelection && (
            <ChallengeRefreshButton
              snapshot={snapshot}
              memberPointBalance={memberPointBalance}
              pending={pendingAction === 'refresh'}
              onRefresh={sendRefresh}
            />
          )}
        </Panel>
        <PersonalTaskBody
          snapshot={snapshot}
          completed={roundState.isComplete}
          acceptedProgress={acceptedProgress?.provisionalProgress}
          autoSyncCountdown={autoSyncCountdown}
          acceptButtonState={acceptButtonState}
          pending={pending}
          sendAccept={sendAccept}
          sendSync={sendSync}
        />
      </Panel>
      <Panel className="daily-challenge-bottom-row">
        <GlobalChallengeCard task={snapshot.globalTask} rewardTiers={snapshot.globalRewardTiers} />
        <StreakPanel streak={snapshot.streak} />
      </Panel>
    </Panel>
  );
}

function CurrentTabContent({
  currentTab,
  snapshot,
  memberPointBalance,
  gameTime,
  pending,
  sendAccept,
  sendRefresh,
  sendSync,
}: {
  currentTab: DailyChallengeTabId;
  snapshot: DailyChallengePlayerSnapshotDto;
  memberPointBalance: number;
  gameTime: number;
  pending: PendingAction | null;
  sendAccept: (assignmentId: string) => void;
  sendRefresh: () => void;
  sendSync: () => void;
}) {
  switch (currentTab) {
    case 'today':
      return (
        <TodayTab
          snapshot={snapshot}
          memberPointBalance={memberPointBalance}
          gameTime={gameTime}
          pending={pending}
          sendAccept={sendAccept}
          sendRefresh={sendRefresh}
          sendSync={sendSync}
        />
      );
    case 'streak':
      return (
        <Panel className="daily-challenge-tab-content daily-challenge-streak-tab">
          <StreakPanel streak={snapshot.streak} />
          <Panel className="daily-challenge-info-card">
            <Label
              className="daily-challenge-info-title"
              text={$.Localize('#daily_challenge_streak_rule_title')}
            />
            <Label
              className="daily-challenge-info-body"
              text={$.Localize('#daily_challenge_streak_rule_body')}
            />
          </Panel>
        </Panel>
      );
    case 'rewards':
      return (
        <Panel className="daily-challenge-tab-content">
          <RecentRewardsPanel rewards={snapshot.recentRewards} />
        </Panel>
      );
    case 'rules':
      return (
        <Panel className="daily-challenge-tab-content daily-challenge-rules-tab">
          <Label
            className="daily-challenge-rules-title"
            text={$.Localize('#daily_challenge_rules_title')}
          />
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Panel key={index} className="daily-challenge-rule-row">
              <Label className="daily-challenge-rule-index" text={String(index)} />
              <Label
                className="daily-challenge-rule-text"
                text={$.Localize(`#daily_challenge_rule_${index}`)}
              />
            </Panel>
          ))}
        </Panel>
      );
  }
}

function ChallengeContent({
  snapshot,
  loadError,
  requestSnapshot,
  actionMessage,
  currentTab,
  memberPointBalance,
  gameTime,
  pending,
  sendAccept,
  sendRefresh,
  sendSync,
}: {
  snapshot: DailyChallengePlayerSnapshotDto | null;
  loadError: string;
  requestSnapshot: () => void;
  actionMessage: string;
  currentTab: DailyChallengeTabId;
  memberPointBalance: number;
  gameTime: number;
  pending: PendingAction | null;
  sendAccept: (assignmentId: string) => void;
  sendRefresh: () => void;
  sendSync: () => void;
}) {
  if (!snapshot) return <LoadingState loadError={loadError} requestSnapshot={requestSnapshot} />;
  return (
    <Panel className="daily-challenge-content">
      {actionMessage !== '' && (
        <Label className="daily-challenge-action-message" text={actionMessage} />
      )}
      <CurrentTabContent
        currentTab={currentTab}
        snapshot={snapshot}
        memberPointBalance={memberPointBalance}
        gameTime={gameTime}
        pending={pending}
        sendAccept={sendAccept}
        sendRefresh={sendRefresh}
        sendSync={sendSync}
      />
    </Panel>
  );
}

export function DailyChallengePage() {
  const { closePage } = useNavigation();
  const steamId = GetLocalPlayerSteamAccountID();
  const { snapshot, loadError, requestSnapshot, subscribeActionResult } = useDailyChallenge();
  const player = useNetTable('player_table', steamId || null);
  const [currentTab, setCurrentTab] = useState<DailyChallengeTabId>('today');
  const { actionMessage, gameTime, pending, sendAccept, sendRefresh, sendSync } =
    useDailyChallengePageActions(snapshot, subscribeActionResult);

  return (
    <Panel className="profile-overlay" onactivate={closePage}>
      <Panel className="modal-panel daily-challenge-modal" hittest={true} onactivate={() => {}}>
        <Panel className="modal-header daily-challenge-modal-header">
          <Panel className="daily-challenge-heading">
            <Label className="modal-title" text={$.Localize('#daily_challenge_title')} />
            {snapshot && (
              <Label
                className="daily-challenge-day-id"
                text={$.Localize('#daily_challenge_day').replace('{day}', snapshot.dayId)}
              />
            )}
          </Panel>
          <Panel className="daily-challenge-header-points">
            <Image
              className="daily-challenge-header-point-icon"
              src="s2r://panorama/images/custom_game/battlepass/pts_earned_png.vtex"
            />
            <Label
              className="daily-challenge-header-point-label"
              text={$.Localize('#daily_challenge_season_points')}
            />
            <Label
              className="daily-challenge-header-point-value"
              text={String(player?.useableSeasonPoint ?? 0)}
            />
          </Panel>
          <Button className="btn-close" onactivate={closePage} />
        </Panel>
        <Panel className="daily-challenge-tab-nav-wrapper">
          <TabNavigation tabs={getTabs()} currentTab={currentTab} onTabChange={setCurrentTab} />
        </Panel>
        <ChallengeContent
          snapshot={snapshot}
          loadError={loadError}
          requestSnapshot={requestSnapshot}
          actionMessage={actionMessage}
          currentTab={currentTab}
          memberPointBalance={player?.useableMemberPoint ?? 0}
          gameTime={gameTime}
          pending={pending}
          sendAccept={sendAccept}
          sendRefresh={sendRefresh}
          sendSync={sendSync}
        />
      </Panel>
    </Panel>
  );
}
