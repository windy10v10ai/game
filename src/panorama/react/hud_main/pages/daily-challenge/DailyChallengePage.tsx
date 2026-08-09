import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DailyChallengeClientAction } from '../../../../../common/dto/daily-challenge';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { PrimaryButton, TabNavigation } from '../../../shared/components';
import { useNetTable } from '../../../shared/hooks/useNetTable';
import { useDailyChallenge } from '../../store/DailyChallengeContext';
import { useNavigation } from '../../store/NavigationContext';
import { ChallengeRefreshButton } from './ChallengeRefreshButton';
import { GlobalChallengeCard } from './GlobalChallengeCard';
import { PersonalCandidateCard, TaskStarBadge } from './PersonalCandidateCard';
import { RecentRewardsPanel } from './RecentRewardsPanel';
import { StreakPanel } from './StreakPanel';
import {
  createDailyChallengeRequestId,
  DailyChallengeRequestTimeout,
  DailyChallengeRetryableActionRequest,
  DailyChallengeViewedRequestState,
  fillChallengeTarget,
  formatAutoSyncCountdown,
  formatDailyChallengeRoundProgress,
  getDailyChallengeAcceptButtonState,
  getDailyChallengeRoundState,
  isSuccessfulNetworkBoolean,
} from './daily-challenge-ui';

type DailyChallengeTabId = 'today' | 'streak' | 'rewards' | 'rules';

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

export function DailyChallengePage() {
  const { closePage } = useNavigation();
  const steamId = GetLocalPlayerSteamAccountID();
  const { snapshot, loadError, requestSnapshot, subscribeActionResult } = useDailyChallenge();
  const player = useNetTable('player_table', steamId || null);
  const [currentTab, setCurrentTab] = useState<DailyChallengeTabId>('today');
  const [gameTime, setGameTime] = useState(() => Game.GetGameTime());
  const [pending, setPending] = useState<{
    action: DailyChallengeClientAction;
    requestId: string;
  } | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [viewRetrySequence, setViewRetrySequence] = useState(0);
  const pendingRef = useRef<{
    action: DailyChallengeClientAction;
    requestId: string;
  } | null>(null);
  const viewRequestStateRef = useRef(new DailyChallengeViewedRequestState());
  const viewRetryHandleRef = useRef<ScheduleID | null>(null);
  const actionTimeoutRef = useRef<DailyChallengeRequestTimeout<ScheduleID> | null>(null);
  const viewTimeoutRef = useRef<DailyChallengeRequestTimeout<ScheduleID> | null>(null);
  if (actionTimeoutRef.current === null) {
    actionTimeoutRef.current = new DailyChallengeRequestTimeout(
      (seconds, callback) => $.Schedule(seconds, callback),
      (handle) => $.CancelScheduled(handle),
    );
  }
  if (viewTimeoutRef.current === null) {
    viewTimeoutRef.current = new DailyChallengeRequestTimeout(
      (seconds, callback) => $.Schedule(seconds, callback),
      (handle) => $.CancelScheduled(handle),
    );
  }

  const scheduleViewRetry = useCallback(() => {
    if (viewRetryHandleRef.current !== null) return;
    viewRetryHandleRef.current = $.Schedule(2, () => {
      viewRetryHandleRef.current = null;
      setViewRetrySequence((sequence) => sequence + 1);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeActionResult((data) => {
      const success = isSuccessfulNetworkBoolean(data.success);
      if (data.action === 'view') {
        viewTimeoutRef.current?.finish(data.requestId);
        const result = viewRequestStateRef.current.finish(data.requestId, success);
        if (result.shouldRetry) scheduleViewRetry();
        return;
      }
      const resolvedRefresh =
        data.action === 'refresh' && refreshRequestState.resolve(data.requestId);
      const resolvedPending = actionTimeoutRef.current?.finish(data.requestId) ?? false;
      if (!resolvedPending && !resolvedRefresh) return;
      pendingRef.current = null;
      setPending(null);
      setActionMessage(getActionMessage(data.code, success));
    });
    return () => {
      unsubscribe();
      actionTimeoutRef.current?.dispose();
      viewTimeoutRef.current?.dispose();
      if (viewRetryHandleRef.current !== null) {
        $.CancelScheduled(viewRetryHandleRef.current);
        viewRetryHandleRef.current = null;
      }
    };
  }, [scheduleViewRetry, subscribeActionResult]);

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

  useEffect(() => {
    if (!snapshot || snapshot.unreadRewardCount <= 0) return;
    const viewedKey = `${snapshot.dayId}:${snapshot.unreadRewardCount}`;
    const requestId = createRequestId('view', snapshot.dayId);
    if (!viewRequestStateRef.current.begin(viewedKey, requestId)) return;
    viewTimeoutRef.current?.start(requestId, () => {
      const result = viewRequestStateRef.current.finish(requestId, false);
      if (result.shouldRetry) scheduleViewRetry();
    });
    GameEvents.SendCustomGameEventToServer('daily_challenge_view', { requestId });
  }, [scheduleViewRetry, snapshot, viewRetrySequence]);

  const beginAction = (action: DailyChallengeClientAction, requestId: string) => {
    const nextPending = { action, requestId };
    pendingRef.current = nextPending;
    setPending(nextPending);
    setActionMessage('');
    actionTimeoutRef.current?.start(requestId, () => {
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

  const pendingAction = pending?.action;
  const acceptButtonState = snapshot
    ? getDailyChallengeAcceptButtonState(pendingAction, snapshot.status)
    : { enabled: false, labelKey: '#daily_challenge_accept_locked' };
  const tabs: { id: DailyChallengeTabId; label: string }[] = [
    { id: 'today', label: $.Localize('#daily_challenge_tab_today') },
    { id: 'streak', label: $.Localize('#daily_challenge_tab_streak') },
    { id: 'rewards', label: $.Localize('#daily_challenge_tab_rewards') },
    { id: 'rules', label: $.Localize('#daily_challenge_tab_rules') },
  ];
  const acceptedProgress =
    snapshot?.acceptedTask &&
    snapshot.currentMatchProgress?.assignmentId === snapshot.acceptedTask.assignmentId
      ? snapshot.currentMatchProgress
      : undefined;
  const nextAutoSyncAt = acceptedProgress?.nextAutoSyncAtGameTime;
  const autoSyncCountdown =
    nextAutoSyncAt === undefined ? '--:--' : formatAutoSyncCountdown(nextAutoSyncAt, gameTime);
  const roundState = snapshot ? getDailyChallengeRoundState(snapshot) : null;
  const completedTasks = snapshot?.completedTasks ?? [];
  const completedRewardTotal = completedTasks.reduce(
    (total, task) => total + Math.max(0, task.rewardSeasonPoint),
    0,
  );
  const isPersonalComplete = roundState?.isComplete ?? false;
  const roundProgressText = roundState
    ? formatDailyChallengeRoundProgress(
        $.Localize('#daily_challenge_round_progress'),
        roundState.currentRound,
        roundState.completedRoundCount,
        roundState.totalRounds,
      )
    : '';

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
          <TabNavigation tabs={tabs} currentTab={currentTab} onTabChange={setCurrentTab} />
        </Panel>

        {!snapshot ? (
          <Panel className="daily-challenge-loading">
            {loadError ? (
              <>
                <Label className="daily-challenge-load-error" text={loadError} />
                <Button
                  className="ButtonPrimary daily-challenge-retry"
                  onactivate={requestSnapshot}
                >
                  <Label text={$.Localize('#daily_challenge_retry')} />
                </Button>
              </>
            ) : (
              <Label text={$.Localize('#daily_challenge_loading')} />
            )}
          </Panel>
        ) : (
          <Panel className="daily-challenge-content">
            {actionMessage !== '' && (
              <Label className="daily-challenge-action-message" text={actionMessage} />
            )}

            {currentTab === 'today' && (
              <Panel className="daily-challenge-tab-content daily-challenge-today-tab">
                <Panel className="daily-challenge-personal-section">
                  <Panel className="daily-challenge-personal-header">
                    <Panel className="daily-challenge-personal-heading">
                      <Label
                        className="daily-challenge-section-kicker"
                        text={
                          isPersonalComplete
                            ? $.Localize('#daily_challenge_round_complete')
                            : snapshot.acceptedTask
                              ? $.Localize('#daily_challenge_selected')
                              : $.Localize('#daily_challenge_choose_one')
                        }
                      />
                      <Label
                        className="daily-challenge-section-title"
                        text={$.Localize('#daily_challenge_personal_title')}
                      />
                      <Label className="daily-challenge-round-progress" text={roundProgressText} />
                    </Panel>
                    {!snapshot.acceptedTask && !isPersonalComplete && snapshot.needsSelection && (
                      <ChallengeRefreshButton
                        snapshot={snapshot}
                        memberPointBalance={player?.useableMemberPoint ?? 0}
                        pending={pendingAction === 'refresh'}
                        onRefresh={sendRefresh}
                      />
                    )}
                  </Panel>

                  {isPersonalComplete ? (
                    <Panel className="daily-challenge-personal-complete">
                      <Panel className="daily-challenge-personal-complete-heading">
                        <Label
                          className="daily-challenge-personal-complete-title"
                          text={$.Localize('#daily_challenge_personal_complete')}
                        />
                        <Label
                          className="daily-challenge-personal-complete-summary"
                          text={$.Localize('#daily_challenge_personal_complete_summary')
                            .replace('{count}', String(completedTasks.length))
                            .replace('{points}', String(completedRewardTotal))}
                        />
                      </Panel>
                      <Panel className="daily-challenge-completed-task-list">
                        {completedTasks.map((task, index) => (
                          <Panel
                            key={task.assignmentId}
                            className="daily-challenge-completed-task-row"
                          >
                            <Label
                              className="daily-challenge-completed-task-index"
                              text={String(index + 1)}
                            />
                            <Panel className="daily-challenge-completed-task-main">
                              <TaskStarBadge task={task} />
                              <Label
                                className="daily-challenge-completed-task-title"
                                text={fillChallengeTarget(
                                  task.title,
                                  task.target,
                                  task.unit,
                                  $.Language(),
                                )}
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
                  ) : snapshot.acceptedTask ? (
                    <Panel className="daily-challenge-accepted-hero">
                      <PersonalCandidateCard
                        task={snapshot.acceptedTask}
                        accepted={true}
                        disabled={true}
                        provisionalProgress={acceptedProgress?.provisionalProgress ?? 0}
                      />
                      <Panel className="daily-challenge-accepted-actions">
                        <Label
                          className="daily-challenge-accepted-reward"
                          text={$.Localize('#daily_challenge_reward_points').replace(
                            '{n}',
                            String(snapshot.acceptedTask.rewardSeasonPoint),
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
                          text={$.Localize('#daily_challenge_auto_sync').replace(
                            '{time}',
                            autoSyncCountdown,
                          )}
                        />
                      </Panel>
                      <Label
                        className="daily-challenge-settlement-hint"
                        text={$.Localize('#daily_challenge_settlement_hint')}
                      />
                    </Panel>
                  ) : snapshot.needsSelection && snapshot.candidates.length > 0 ? (
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
                  ) : (
                    <Label
                      className="daily-challenge-empty"
                      text={$.Localize('#daily_challenge_personal_empty')}
                    />
                  )}
                </Panel>

                <Panel className="daily-challenge-bottom-row">
                  <GlobalChallengeCard
                    task={snapshot.globalTask}
                    rewardTiers={snapshot.globalRewardTiers}
                  />
                  <StreakPanel streak={snapshot.streak} />
                </Panel>
              </Panel>
            )}

            {currentTab === 'streak' && (
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
            )}

            {currentTab === 'rewards' && (
              <Panel className="daily-challenge-tab-content">
                <RecentRewardsPanel rewards={snapshot.recentRewards} />
              </Panel>
            )}

            {currentTab === 'rules' && (
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
            )}
          </Panel>
        )}
      </Panel>
    </Panel>
  );
}
