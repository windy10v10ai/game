import React from 'react';
import { NavigationProvider } from './store/NavigationContext';
import { PageRouter } from './router/PageRouter';
import { ProfileEntryButton } from './components/ProfileEntryButton';
import { MemberEntryButton } from './components/MemberEntryButton';
import { DailyChallengeEntryButton } from './components/DailyChallengeEntryButton';
import { DailyChallengeProvider } from './store/DailyChallengeContext';

function HudMain() {
  return (
    <NavigationProvider>
      <DailyChallengeProvider>
        <ProfileEntryButton />
        <MemberEntryButton />
        <DailyChallengeEntryButton />
        <PageRouter />
      </DailyChallengeProvider>
    </NavigationProvider>
  );
}

export default HudMain;
