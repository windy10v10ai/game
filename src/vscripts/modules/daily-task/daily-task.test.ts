/* eslint-disable @typescript-eslint/no-explicit-any */
declare let global: any;

global.print = jest.fn();

const eventListeners: Record<string, (userId: number, event: any) => void> = {};
global.CustomGameEventManager = {
  RegisterListener: jest.fn((name: string, cb: any) => {
    eventListeners[name] = cb;
  }),
};

const netTable: Record<string, Record<string, any>> = {};
global.CustomNetTables = {
  SetTableValue: jest.fn((table: string, key: string, value: any) => {
    if (!netTable[table]) netTable[table] = {};
    netTable[table][key] = value;
  }),
  GetTableValue: jest.fn((table: string, key: string) => netTable[table]?.[key]),
};

const mockIsCheatMode = jest.fn(() => false);
// 与 game-end-point.test.ts 的 GetCustomModeMultiplier 默认档一致，倍率=1，非极端
const defaultOption = {
  radiantGoldXpMultiplier: 1.5,
  direGoldXpMultiplier: 2,
  radiantPlayerNumber: 10,
  direPlayerNumber: 10,
  towerPower: 200,
  startingGoldPlayer: 3000,
  startingGoldBot: 3000,
  respawnTimePercentage: 100,
  maxLevel: 50,
  forceRandomHero: false,
  enablePlayerAttribute: true,
  fixedAbility: 'none',
  gameDifficulty: 0,
};
global.GameRules = { IsCheatMode: () => mockIsCheatMode(), Option: { ...defaultOption } };

// 进度推送定时器只需占位防崩，回调不在单测里跑
global.Timers = { CreateTimer: jest.fn() };

const mockIsInToolsMode = jest.fn(() => false);
global.IsInToolsMode = () => mockIsInToolsMode();

const mockGetMapName = jest.fn(() => 'dota');
global.GetMapName = () => mockGetMapName();

const mockGetSelectedHeroName = jest.fn((_playerId: number) => 'npc_dota_hero_lina');
global.PlayerResource = {
  GetSelectedHeroName: (playerId: number) => mockGetSelectedHeroName(playerId),
};

const mockReadTaskMetric = jest.fn();
jest.mock('./daily-task-metric-reader', () => ({
  ReadTaskMetric: (playerId: number, metric: string) => mockReadTaskMetric(playerId, metric),
}));

import { TaskCandidateDto } from '../../../common/dto/daily-task';
import { DailyTask } from './daily-task';

const GENERAL_CANDIDATE: TaskCandidateDto = {
  taskId: 'general_kills',
  scope: 'personal_general',
  metric: 'kills',
  star: 2,
  target: 20,
  rewardSeasonPoint: 80,
};

const HERO_CANDIDATE: TaskCandidateDto = {
  taskId: 'hero_lina_1',
  scope: 'personal_hero',
  metric: 'hero_damage',
  heroName: 'npc_dota_hero_lina',
  star: 3,
  target: 900000,
  rewardSeasonPoint: 100,
};

const PLAYER_ID = 0 as PlayerID;

describe('DailyTask', () => {
  let dailyTask: DailyTask;

  beforeEach(() => {
    for (const k of Object.keys(netTable)) delete netTable[k];
    mockIsCheatMode.mockReturnValue(false);
    mockIsInToolsMode.mockReturnValue(false);
    mockGetMapName.mockReturnValue('dota');
    mockGetSelectedHeroName.mockReturnValue('npc_dota_hero_lina');
    mockReadTaskMetric.mockReset();
    global.GameRules.Option = { ...defaultOption };
    dailyTask = new DailyTask();
  });

  describe('IsDailyTaskEnabled（模式门控）', () => {
    it('作弊模式下禁用', () => {
      mockIsCheatMode.mockReturnValue(true);
      expect(dailyTask.IsDailyTaskEnabled()).toBe(false);
    });

    it('custom 图非极端配置下启用', () => {
      mockGetMapName.mockReturnValue('custom');
      expect(dailyTask.IsDailyTaskEnabled()).toBe(true);
    });

    it('custom 图秒活时禁用', () => {
      mockGetMapName.mockReturnValue('custom');
      global.GameRules.Option.respawnTimePercentage = 10;
      expect(dailyTask.IsDailyTaskEnabled()).toBe(false);
    });

    it('custom 图综合积分倍率低于1倍时禁用', () => {
      mockGetMapName.mockReturnValue('custom');
      global.GameRules.Option.radiantGoldXpMultiplier = 5;
      expect(dailyTask.IsDailyTaskEnabled()).toBe(false);
    });

    it('dota / hard 图启用', () => {
      mockGetMapName.mockReturnValue('dota');
      expect(dailyTask.IsDailyTaskEnabled()).toBe(true);
      mockGetMapName.mockReturnValue('hard');
      expect(dailyTask.IsDailyTaskEnabled()).toBe(true);
    });

    it('工具模式下忽略作弊状态，仍按地图判定', () => {
      mockIsInToolsMode.mockReturnValue(true);
      mockIsCheatMode.mockReturnValue(true);
      expect(dailyTask.IsDailyTaskEnabled()).toBe(true);
    });

    it('工具模式下 custom 图极端配置仍然禁用', () => {
      mockIsInToolsMode.mockReturnValue(true);
      mockIsCheatMode.mockReturnValue(true);
      mockGetMapName.mockReturnValue('custom');
      global.GameRules.Option.respawnTimePercentage = 0;
      expect(dailyTask.IsDailyTaskEnabled()).toBe(false);
    });
  });

  describe('game_options_change（配置变更后同步 enabled，不用等玩家选择候选才刷新）', () => {
    it('SetStartData 后配置变为极端，不选候选也应刷新 enabled', () => {
      mockGetMapName.mockReturnValue('custom');
      dailyTask.SetStartData(PLAYER_ID, {
        steamId: 111,
        dayId: '20260815',
        candidates: [GENERAL_CANDIDATE],
        completedTasks: [],
        todaySeasonPoint: 0,
        history: [],
        refreshRemaining: 1,
      });
      expect(netTable['daily_task'][PLAYER_ID.toString()].enabled).toBe(true);

      global.GameRules.Option.respawnTimePercentage = 10;
      eventListeners['game_options_change'](0, {});

      expect(netTable['daily_task'][PLAYER_ID.toString()].enabled).toBe(false);
    });
  });

  describe('SelectCandidate（候选本地状态）', () => {
    it('未知 taskId 被忽略，不崩溃、不写入选择', () => {
      dailyTask.SetStartData(PLAYER_ID, {
        steamId: 111,
        dayId: '20260815',
        candidates: [GENERAL_CANDIDATE],
        completedTasks: [],
        todaySeasonPoint: 0,
        history: [],
        refreshRemaining: 1,
      });

      expect(() => dailyTask.SelectCandidate(PLAYER_ID, 'not_exist')).not.toThrow();
      expect(netTable['daily_task'][PLAYER_ID.toString()].selectedTaskId).toBeUndefined();
    });

    it('未 SetStartData 时选择候选被忽略，不崩溃', () => {
      expect(() =>
        dailyTask.SelectCandidate(999 as PlayerID, GENERAL_CANDIDATE.taskId),
      ).not.toThrow();
    });

    it('已知 taskId 正常写入选择', () => {
      dailyTask.SetStartData(PLAYER_ID, {
        steamId: 111,
        dayId: '20260815',
        candidates: [GENERAL_CANDIDATE],
        completedTasks: [],
        todaySeasonPoint: 0,
        history: [],
        refreshRemaining: 1,
      });

      dailyTask.SelectCandidate(PLAYER_ID, GENERAL_CANDIDATE.taskId);
      expect(netTable['daily_task'][PLAYER_ID.toString()].selectedTaskId).toBe(
        GENERAL_CANDIDATE.taskId,
      );
    });
  });

  describe('GetSelectedCandidate（只读查询选中候选）', () => {
    beforeEach(() => {
      dailyTask.SetStartData(PLAYER_ID, {
        steamId: 111,
        dayId: '20260815',
        candidates: [GENERAL_CANDIDATE, HERO_CANDIDATE],
        completedTasks: [],
        todaySeasonPoint: 0,
        history: [],
        refreshRemaining: 1,
      });
    });

    it('未选择候选时返回 undefined', () => {
      expect(dailyTask.GetSelectedCandidate(PLAYER_ID)).toBeUndefined();
    });

    it('已选择候选时返回完整候选，不判定是否完成', () => {
      dailyTask.SelectCandidate(PLAYER_ID, GENERAL_CANDIDATE.taskId);
      expect(dailyTask.GetSelectedCandidate(PLAYER_ID)).toEqual(GENERAL_CANDIDATE);
    });
  });

  describe('EvaluateCompletion（达标判定）', () => {
    beforeEach(() => {
      dailyTask.SetStartData(PLAYER_ID, {
        steamId: 111,
        dayId: '20260815',
        candidates: [GENERAL_CANDIDATE, HERO_CANDIDATE],
        completedTasks: [],
        todaySeasonPoint: 0,
        history: [],
        refreshRemaining: 1,
      });
    });

    it('门控未通过时返回 undefined', () => {
      mockIsCheatMode.mockReturnValue(true);
      dailyTask.SelectCandidate(PLAYER_ID, GENERAL_CANDIDATE.taskId);
      mockReadTaskMetric.mockReturnValue(999);

      expect(dailyTask.EvaluateCompletion(PLAYER_ID)).toBeUndefined();
    });

    it('未选择候选时返回 undefined', () => {
      expect(dailyTask.EvaluateCompletion(PLAYER_ID)).toBeUndefined();
    });

    it('英雄专属任务英雄不匹配时返回 undefined', () => {
      dailyTask.SelectCandidate(PLAYER_ID, HERO_CANDIDATE.taskId);
      mockGetSelectedHeroName.mockReturnValue('npc_dota_hero_axe');
      mockReadTaskMetric.mockReturnValue(1000000);

      expect(dailyTask.EvaluateCompletion(PLAYER_ID)).toBeUndefined();
    });

    it('未达标时返回 undefined', () => {
      dailyTask.SelectCandidate(PLAYER_ID, GENERAL_CANDIDATE.taskId);
      mockReadTaskMetric.mockReturnValue(GENERAL_CANDIDATE.target - 1);

      expect(dailyTask.EvaluateCompletion(PLAYER_ID)).toBeUndefined();
    });

    it('metric 无法识别（未知候选保护）时返回 undefined', () => {
      dailyTask.SelectCandidate(PLAYER_ID, GENERAL_CANDIDATE.taskId);
      mockReadTaskMetric.mockReturnValue(undefined);

      expect(dailyTask.EvaluateCompletion(PLAYER_ID)).toBeUndefined();
    });

    it('通用任务达标时返回完成结果（含结算页展示用的完整候选）', () => {
      dailyTask.SelectCandidate(PLAYER_ID, GENERAL_CANDIDATE.taskId);
      mockReadTaskMetric.mockReturnValue(GENERAL_CANDIDATE.target);

      expect(dailyTask.EvaluateCompletion(PLAYER_ID)).toEqual({
        result: {
          taskId: GENERAL_CANDIDATE.taskId,
          star: GENERAL_CANDIDATE.star,
          seasonPoint: GENERAL_CANDIDATE.rewardSeasonPoint,
          dayId: '20260815',
        },
        candidate: GENERAL_CANDIDATE,
      });
    });

    it('英雄专属任务英雄匹配且达标时返回完成结果（含结算页展示用的完整候选）', () => {
      dailyTask.SelectCandidate(PLAYER_ID, HERO_CANDIDATE.taskId);
      mockGetSelectedHeroName.mockReturnValue(HERO_CANDIDATE.heroName!);
      mockReadTaskMetric.mockReturnValue(HERO_CANDIDATE.target);

      expect(dailyTask.EvaluateCompletion(PLAYER_ID)).toEqual({
        result: {
          taskId: HERO_CANDIDATE.taskId,
          star: HERO_CANDIDATE.star,
          seasonPoint: HERO_CANDIDATE.rewardSeasonPoint,
          dayId: '20260815',
        },
        candidate: HERO_CANDIDATE,
      });
    });
  });
});
