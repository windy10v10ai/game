/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

function read(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function readMarginLeft(styles, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `(?:^|\\n)\\.${escaped}\\s*\\{[\\s\\S]*?margin-left:\\s*(\\d+)px;`,
    'g',
  );
  const matches = [...styles.matchAll(pattern)];
  return matches.length > 0 ? Number(matches[matches.length - 1][1]) : null;
}

describe('hero selection entry layout', () => {
  it('uses separate slots and places daily challenge to the right of profile', () => {
    const profile = read('./ProfileEntryButton.tsx');
    const daily = read('./DailyChallengeEntryButton.tsx');
    const styles = read('../styles.less');

    expect(profile).toContain("button.AddClass('hud-hero-select-profile-entry-btn')");
    expect(daily).toContain("button.AddClass('hud-hero-select-daily-challenge-entry-btn')");
    expect(profile).not.toContain("button.AddClass('hud-hero-select-entry-btn')");
    expect(daily).not.toContain("button.AddClass('hud-hero-select-entry-btn')");
    expect(daily).toMatch(
      /if \(heroSelectLayer\) \{[\s\S]*AddClass\('hud-hero-select-daily-challenge-entry-btn'\);[\s\S]*\} else \{[\s\S]*button\.style\.marginLeft = '2px';/,
    );

    const profileLeft = readMarginLeft(styles, 'hud-hero-select-profile-entry-btn');
    const dailyLeft = readMarginLeft(styles, 'hud-hero-select-daily-challenge-entry-btn');
    expect(profileLeft).toBe(100);
    expect(dailyLeft).toBe(160);
    if (profileLeft === null || dailyLeft === null) {
      throw new Error('expected both entry offsets to be present');
    }
    expect(dailyLeft - profileLeft).toBeGreaterThanOrEqual(50);
    expect(dailyLeft).toBeLessThan(240);
  });
});
