const fs = require('fs');
const path = require('path');
const vm = require('vm');

const xmlPath = path.resolve(
  __dirname,
  '../../content/panorama/layout/custom_game/end_screen_2.xml',
);
const scriptPath = path.resolve(
  __dirname,
  '../../content/panorama/scripts/custom_game/end_screen_2.js',
);

function createPanel() {
  const pointsContainer = {
    events: {},
    SetPanelEvent: jest.fn(function setPanelEvent(name, callback) {
      this.events[name] = callback;
    }),
    ClearPanelEvent: jest.fn(function clearPanelEvent(name) {
      delete this.events[name];
    }),
  };
  const children = {
    PointsLabel: pointsContainer,
    PointsValue: { text: '' },
    PointsModifier: { text: '', visible: false },
    DailyChallengePoints: { text: '', visible: false },
  };
  return {
    children,
    pointsContainer,
    FindChildTraverse: jest.fn((id) => children[id]),
  };
}

function loadEndScreen() {
  const roots = {
    EndScreenWindow: { visible: false },
    TeamsContainer: { RemoveAndDeleteChildren: jest.fn() },
    EndScreenVictory: { text: '', style: {} },
    GameTime: { text: '' },
  };
  const localized = {
    '#daily_challenge_end_screen_detail': '每日挑战 +{points}',
    '#daily_challenge_end_screen_total_points': '本局赛季积分 +{points}',
    '#daily_challenge_end_screen_match_points': '对局结算 +{points}',
    '#daily_challenge_end_screen_challenge_points': '每日挑战 +{points}',
    '#daily_challenge_end_screen_conduct_modifier': '行为分修正 {points}',
  };
  const dollar = jest.fn((selector) => roots[selector.replace(/^#/, '')]);
  dollar.CreatePanel = jest.fn();
  dollar.Localize = jest.fn((key) => localized[key] ?? key);
  dollar.DispatchEvent = jest.fn();
  dollar.GetContextPanel = jest.fn(() => ({ RemoveClass: jest.fn() }));
  dollar.Msg = jest.fn();

  const context = {
    $: dollar,
    GameUI: {
      CustomUIConfig: jest.fn(() => ({ _: {} })),
      SetDefaultUIEnabled: jest.fn(),
    },
    Game: {
      GetLocalPlayerID: jest.fn(() => 0),
      GetGameWinner: jest.fn(() => 2),
      GetPlayerIDsOnTeam: jest.fn(() => []),
      GetTeamDetails: jest.fn(() => ({ team_score: 0 })),
      GetDOTATime: jest.fn(() => 0),
    },
    CustomNetTables: {
      GetTableValue: jest.fn((table, key) => {
        if (table === 'ending_status' && key === 'ending_data') return undefined;
        return undefined;
      }),
      SubscribeNetTableListener: jest.fn(),
    },
    DotaDefaultUIElement_t: { DOTA_DEFAULT_UI_ENDGAME: 0 },
    find_hud_element: jest.fn(() => ({ visible: true })),
  };

  vm.runInNewContext(fs.readFileSync(scriptPath, 'utf8'), context);
  return context;
}

describe('end screen daily challenge season points', () => {
  it('adds a compact daily challenge detail label to the points column', () => {
    const xml = fs.readFileSync(xmlPath, 'utf8');

    expect(xml).toContain('id="DailyChallengePoints"');
    expect(xml).toContain('class="DailyChallengePoints"');
  });

  it('subscribes to delayed player_stats updates', () => {
    const context = loadEndScreen();

    expect(context.CustomNetTables.SubscribeNetTableListener).toHaveBeenCalledWith(
      'player_stats',
      context.OnPlayerStatsChanged,
    );
  });

  it('builds a combined total and localized reward breakdown', () => {
    const context = loadEndScreen();

    expect({
      ...context.BuildEndScreenPointsDisplay({
        points: 25,
        dailyChallengePoints: 100,
        totalSeasonPoints: 125,
        pointModifier: -5,
      }),
    }).toEqual({
      totalPoints: 125,
      dailyChallengeText: '每日挑战 +100',
      dailyChallengeVisible: true,
      pointModifierText: '-5',
      pointModifierVisible: true,
      tooltipText: '本局赛季积分 +125\n对局结算 +25\n每日挑战 +100\n行为分修正 -5',
    });
  });

  it('hides the challenge detail when this match did not grant a challenge reward', () => {
    const context = loadEndScreen();

    expect({ ...context.BuildEndScreenPointsDisplay({ points: 25 }) }).toEqual({
      totalPoints: 25,
      dailyChallengeText: '',
      dailyChallengeVisible: false,
      pointModifierText: '',
      pointModifierVisible: false,
      tooltipText: '本局赛季积分 +25\n对局结算 +25',
    });
  });

  it('refreshes an existing player row when the API result reaches player_stats later', () => {
    const context = loadEndScreen();
    const panel = createPanel();
    context.playerPanelsById['0'] = panel;

    context.OnPlayerStatsChanged('player_stats', '0', {
      points: 25,
      dailyChallengePoints: 100,
      totalSeasonPoints: 125,
    });

    expect(panel.children.PointsValue.text).toBe('125');
    expect(panel.children.DailyChallengePoints.text).toBe('每日挑战 +100');
    expect(panel.children.DailyChallengePoints.visible).toBe(true);
    expect(panel.pointsContainer.events.onmouseover).toEqual(expect.any(Function));

    panel.pointsContainer.events.onmouseover();
    expect(context.$.DispatchEvent).toHaveBeenCalledWith(
      'DOTAShowTextTooltip',
      panel.pointsContainer,
      '本局赛季积分 +125\n对局结算 +25\n每日挑战 +100',
    );
  });
});
