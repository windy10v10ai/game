/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

const pagePath = path.join(__dirname, 'DailyChallengePage.tsx');
const progressPath = path.join(__dirname, 'ChallengeProgress.tsx');
const candidatePath = path.join(__dirname, 'PersonalCandidateCard.tsx');
const refreshPath = path.join(__dirname, 'ChallengeRefreshButton.tsx');
const stylesPath = path.join(__dirname, 'styles.less');

const page = fs.readFileSync(pagePath, 'utf8');
const progress = fs.readFileSync(progressPath, 'utf8');
const candidate = fs.readFileSync(candidatePath, 'utf8');
const refresh = fs.readFileSync(refreshPath, 'utf8');
const styles = fs.readFileSync(stylesPath, 'utf8');

describe('daily challenge PC layout contract', () => {
  it('uses a near-fullscreen member-page frame with four primary tabs', () => {
    expect(styles).toMatch(/\.daily-challenge-modal\s*\{[\s\S]*width:\s*90%;[\s\S]*height:\s*90%;/);
    expect(page).toContain("id: 'today'");
    expect(page).toContain("id: 'streak'");
    expect(page).toContain("id: 'rewards'");
    expect(page).toContain("id: 'rules'");
    expect(page).toContain('<TabNavigation');
  });

  it('keeps task rerolls separate from free match-progress sync', () => {
    expect(page).toContain("'daily_challenge_sync_progress'");
    expect(page).toContain("action: 'sync'");
    expect(page).toContain('<ChallengeRefreshButton');
    expect(page).toContain('#daily_challenge_sync_progress');
  });

  it('shows the current three-round state and a completed-task reward overview', () => {
    expect(page).toContain('#daily_challenge_round_progress');
    expect(page).toContain('#daily_challenge_personal_complete');
    expect(page).toContain('tasks.map');
    expect(page).toContain('daily-challenge-completed-task-row');
  });

  it('renders the frozen star and reward on every selectable or accepted task card', () => {
    expect(candidate).toContain('daily-challenge-star-badge');
    expect(candidate).toContain('getDailyChallengeTaskStar');
    expect(candidate).toContain('getDailyChallengeStarVisual');
    expect(candidate).toContain('task.rewardSeasonPoint');
  });

  it('uses the whole-day free and paid refresh quota without any round-local counter', () => {
    expect(refresh).toContain('getDailyChallengeRefreshQuota');
    expect(refresh).toContain('paidRefreshesRemaining');
    expect(refresh).not.toContain('currentRound');
  });

  it('renders formal and current-match progress as separate bar layers', () => {
    expect(progress).toContain('daily-challenge-progress-fill-formal');
    expect(progress).toContain('daily-challenge-progress-fill-provisional');
    expect(progress).toContain('#daily_challenge_progress_provisional');
  });
});
