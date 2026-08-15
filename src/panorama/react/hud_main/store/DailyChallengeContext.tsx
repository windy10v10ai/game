import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DailyChallengePlayerSnapshotDto } from '../../../../common/dto/daily-challenge';
import {
  createDailyChallengeRequestId,
  normalizeDailyChallengePlayerSnapshot,
} from '../pages/daily-challenge/daily-challenge-ui';
import {
  DailyChallengeActionResultChannel,
  DailyChallengeActionResultListener,
  DailyChallengeNetworkActionResult,
  DailyChallengeSnapshotClient,
} from './daily-challenge-snapshot-client';

interface DailyChallengeContextValue {
  snapshot: DailyChallengePlayerSnapshotDto | null;
  loadError: string;
  requestSnapshot: () => void;
  subscribeActionResult: (listener: DailyChallengeActionResultListener) => () => void;
}

const DailyChallengeContext = createContext<DailyChallengeContextValue | null>(null);
let snapshotRequestSequence = 0;

function createSnapshotRequestId(): string {
  snapshotRequestSequence = (snapshotRequestSequence + 1) % 1000000;
  return createDailyChallengeRequestId(
    'snapshot',
    'current',
    Game.GetLocalPlayerID(),
    Game.GetGameTime() * 1000,
    snapshotRequestSequence,
  );
}

function getLoadErrorMessage(code: string): string {
  if (!code) return '';
  const knownKey = `#daily_challenge_action_${code}`;
  const localized = $.Localize(knownKey);
  return localized !== knownKey ? localized : $.Localize('#daily_challenge_action_failed');
}

export function DailyChallengeProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<DailyChallengePlayerSnapshotDto | null>(null);
  const [loadError, setLoadError] = useState('');
  const clientRef = useRef<DailyChallengeSnapshotClient | null>(null);
  const actionResultChannelRef = useRef(new DailyChallengeActionResultChannel());

  useEffect(() => {
    const client = new DailyChallengeSnapshotClient({
      subscribe: (listener) =>
        GameEvents.Subscribe('daily_challenge_action_result', (data) => {
          const result = data as unknown as DailyChallengeNetworkActionResult;
          listener(result);
          actionResultChannelRef.current.publish(result);
        }),
      unsubscribe: (listenerId) => GameEvents.Unsubscribe(listenerId),
      sendSnapshotRequest: (requestId) =>
        GameEvents.SendCustomGameEventToServer('daily_challenge_request_snapshot', { requestId }),
      createRequestId: createSnapshotRequestId,
      scheduleTimeout: (callback) => $.Schedule(8, callback),
      cancelTimeout: (timeoutId) => $.CancelScheduled(timeoutId),
      onSnapshot: (nextSnapshot) =>
        setSnapshot(normalizeDailyChallengePlayerSnapshot(nextSnapshot)),
      onLoadError: (code) => setLoadError(getLoadErrorMessage(code)),
    });
    clientRef.current = client;
    client.start();
    return () => {
      client.dispose();
      clientRef.current = null;
    };
  }, []);

  const requestSnapshot = useCallback(() => clientRef.current?.requestSnapshot(), []);
  const subscribeActionResult = useCallback(
    (listener: DailyChallengeActionResultListener) =>
      actionResultChannelRef.current.subscribe(listener),
    [],
  );

  return (
    <DailyChallengeContext.Provider
      value={{ snapshot, loadError, requestSnapshot, subscribeActionResult }}
    >
      {children}
    </DailyChallengeContext.Provider>
  );
}

export function useDailyChallenge(): DailyChallengeContextValue {
  const context = useContext(DailyChallengeContext);
  if (!context) {
    throw new Error('useDailyChallenge must be used inside DailyChallengeProvider');
  }
  return context;
}
