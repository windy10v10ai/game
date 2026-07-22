// Jest executes JavaScript test files in CommonJS mode.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { readFileSync } = require('fs');

const localizationFiles = [
  'game/resource/addon_schinese.txt',
  'game/resource/addon_english.txt',
  'game/resource/addon_russian.txt',
];

const illuminateTooltipSpecials = [
  'total_damage',
  'max_channel_time',
  'radius',
  'range',
  'base_damage_bonus',
  'max_focus_stacks',
  'damage_pct_per_stack',
  'spell_amp_scaling_per_stack',
  'channel_reduction_per_stack',
  'range_per_stack',
  'radius_per_stack',
];

const illuminateLocalizationLines = (content) =>
  content
    .split(/\r?\n/)
    .filter((line) => line.includes('DOTA_Tooltip_ability_keeper_of_the_light_illuminate'));

describe('Keeper of the Light awakened Illuminate tooltip', () => {
  it.each(localizationFiles)('exposes all player-facing values in %s', (file) => {
    const content = readFileSync(file, 'utf8');
    for (const special of illuminateTooltipSpecials) {
      expect(content).toContain(`"DOTA_Tooltip_ability_keeper_of_the_light_illuminate_${special}"`);
    }
    expect(content).toContain('"DOTA_Tooltip_ability_keeper_of_the_light_illuminate_Note0"');
    expect(content).toContain('"DOTA_Tooltip_ability_keeper_of_the_light_illuminate_Note1"');
    expect(content).not.toContain('"DOTA_Tooltip_ability_keeper_of_the_light_illuminate_Note2"');
  });

  it.each(localizationFiles)(
    'keeps all requested damage, geometry, stack, duration, and example values in visible tooltip text in %s',
    (file) => {
      const content = readFileSync(file, 'utf8');
      const tooltipLines = illuminateLocalizationLines(content);
      const description = tooltipLines.find((line) => line.includes('_Description"')) ?? '';
      const note0 = tooltipLines.find((line) => line.includes('_Note0"')) ?? '';
      const note1 = tooltipLines.find((line) => line.includes('_Note1"')) ?? '';

      expect(description).toContain('285 / 390 / 495 / 600 / 705');
      expect(description).toContain('10/15/20/25');
      expect(description).toContain('25%');
      expect(description).toContain('10%');
      expect(description).toContain('0.35');
      expect(description).toContain('200');
      expect(description).toContain('60');
      expect(description).toContain('600%');
      for (const visibleValue of [
        '3.0',
        '1550',
        '400',
        '2.65',
        '1750',
        '460',
        '1.25',
        '2550',
        '700',
        '550%',
        '80%',
        '400%',
        '3525',
        '22912.5',
      ]) {
        expect(description).toContain(visibleValue);
      }

      expect(note0).toBeTruthy();
      expect(note1).toContain('550%');
      expect(note1).toContain('80%');
      expect(note1).toContain('400%');
      expect(note1).toContain('3525');
    },
  );

  it.each(localizationFiles)('contains readable localized Illuminate text in %s', (file) => {
    const content = readFileSync(file, 'utf8');
    expect(illuminateLocalizationLines(content).join('\n')).not.toMatch(/\?{3,}/);
  });
});
