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
global.GameRules = { IsCheatMode: () => mockIsCheatMode() };

const mockIsInToolsMode = jest.fn(() => false);
global.IsInToolsMode = () => mockIsInToolsMode();

const mockGetMapName = jest.fn(() => 'dota');
global.GetMapName = () => mockGetMapName();

const mockGetSelectedHeroName = jest.fn((_playerId: number) => 'npc_dota_hero_lina');
global.PlayerResource = {
  GetSelectedHeroName: (playerId: number) => mockGetSelectedHeroName(playerId),
};

const mockIsLocalhost = jest.fn(() => false);
jest.mock('../../api/api-client', () => ({
  ApiClient: { IsLocalhost: () => mockIsLocalhost() },
}));

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
    mockIsLocalhost.mockReturnValue(false);
    mockIsInToolsMode.mockReturnValue(false);
    mockGetMapName.mockReturnValue('dota');
    mockGetSelectedHeroName.mockReturnValue('npc_dota_hero_lina');
    mockReadTaskMetric.mockReset();
    dailyTask = new DailyTask();
  });

  describe('IsDailyTaskEnabled（模式门控）', () => {
    it('作弊模式下禁用', () => {
      mockIsCheatMode.mockReturnValue(true);
      expect(dailyTask.IsDailyTaskEnabled()).toBe(false);
    });

    it('localhost 下禁用', () => {
      mockIsLocalhost.mockReturnValue(true);
      expect(dailyTask.IsDailyTaskEnabled()).toBe(false);
    });

    it('custom 图禁用', () => {
      mockGetMapName.mockReturnValue('custom');
      expect(dailyTask.IsDailyTaskEnabled()).toBe(false);
    });

    it('dota / hard 图启用', () => {
      mockGetMapName.mockReturnValue('dota');
      expect(dailyTask.IsDailyTaskEnabled()).toBe(true);
      mockGetMapName.mockReturnValue('hard');
      expect(dailyTask.IsDailyTaskEnabled()).toBe(true);
    });

    it('工具模式下忽略作弊/localhost，仍按地图判定', () => {
      mockIsInToolsMode.mockReturnValue(true);
      mockIsCheatMode.mockReturnValue(true);
      mockIsLocalhost.mockReturnValue(true);
      expect(dailyTask.IsDailyTaskEnabled()).toBe(true);
    });

    it('工具模式下 custom 图仍然禁用', () => {
      mockIsInToolsMode.mockReturnValue(true);
      mockIsCheatMode.mockReturnValue(true);
      mockGetMapName.mockReturnValue('custom');
      expect(dailyTask.IsDailyTaskEnabled()).toBe(false);
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
      });

      dailyTask.SelectCandidate(PLAYER_ID, GENERAL_CANDIDATE.taskId);
      expect(netTable['daily_task'][PLAYER_ID.toString()].selectedTaskId).toBe(
        GENERAL_CANDIDATE.taskId,
      );
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

    it('通用任务达标时返回完成结果', () => {
      dailyTask.SelectCandidate(PLAYER_ID, GENERAL_CANDIDATE.taskId);
      mockReadTaskMetric.mockReturnValue(GENERAL_CANDIDATE.target);

      expect(dailyTask.EvaluateCompletion(PLAYER_ID)).toEqual({
        taskId: GENERAL_CANDIDATE.taskId,
        star: GENERAL_CANDIDATE.star,
        seasonPoint: GENERAL_CANDIDATE.rewardSeasonPoint,
      });
    });

    it('英雄专属任务英雄匹配且达标时返回完成结果', () => {
      dailyTask.SelectCandidate(PLAYER_ID, HERO_CANDIDATE.taskId);
      mockGetSelectedHeroName.mockReturnValue(HERO_CANDIDATE.heroName!);
      mockReadTaskMetric.mockReturnValue(HERO_CANDIDATE.target);

      expect(dailyTask.EvaluateCompletion(PLAYER_ID)).toEqual({
        taskId: HERO_CANDIDATE.taskId,
        star: HERO_CANDIDATE.star,
        seasonPoint: HERO_CANDIDATE.rewardSeasonPoint,
      });
    });
  });
});
