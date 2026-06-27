import { ActionMove } from '../../ai/action/action-move';
import { Player } from '../../api/player';
import { PlayerPropertyApi } from '../../api/player-property';
import { modifier_debug_manual_control } from '../../modifiers/debug/modifier_debug_manual_control';
import { modifier_intelect_magic_resist } from '../../modifiers/global/intelect_magic_resist';
import { GameConfig } from '../GameConfig';
import { AwakenHelper } from '../helper/awaken-helper';
import { BotAbility } from '../helper/bot-ability';
import { MemberHelper } from '../helper/member-helper';
import { ModifierHelper } from '../helper/modifier-helper';
import { PlayerHelper } from '../helper/player-helper';

function IsHeroDemoDebugHero(hero: CDOTA_BaseNPC_Hero): boolean {
  // 调试面板生成的英雄需停留在指定位置，出生点重置逻辑应跳过它（其余 bot 流程照常）。
  return hero.HasModifier(modifier_debug_manual_control.name);
}

export class EventNpcSpawned {
  // 小兵出生到己方一塔的预设旅行时间(秒)，在 Dota Tools 中校准（双方对称，仅一塔存活时生效）
  private static readonly CREEP_T1_TRAVEL_TIMES: Record<string, number> = {
    top: 32,
    mid: 29,
    bot: 32,
  };

  private roshanLevelBase = 1;
  private isFirstRoshan = true;
  private heroSpawnRetryCount = 0;
  private readonly MAX_SPAWN_RETRY = 100;
  // abiliti name list of roshan
  private roshanLevelupBaseAbilities = [
    'tidehunter_kraken_shell',
    'jack_surgery',
    'ursa_fury_swipes',
  ];

  private roshanLevelupExtraAbilities = [
    'roshan_buff',
    'generic_gold_bag_fountain',
    // "generic_season_point_bag_fountain",
  ];

  constructor() {
    ListenToGameEvent('npc_spawned', (keys) => this.OnNpcSpawned(keys), this);
  }

  // 单位出生
  public OnNpcSpawned(keys: GameEventProvidedProperties & NpcSpawnedEvent): void {
    if (GameRules.State_Get() < GameState.PRE_GAME) {
      Timers.CreateTimer(0.3, () => {
        this.OnNpcSpawned(keys);
      });
      return;
    }

    const npc = EntIndexToHScript(keys.entindex) as CDOTA_BaseNPC | undefined;
    if (!npc) {
      return;
    }

    // 英雄出生
    if (npc.IsRealHero() && keys.is_respawn === 0) {
      const hero = npc as CDOTA_BaseNPC_Hero;
      this.OnRealHeroSpawned(hero);
    }
    if (npc.IsCreep()) {
      // 小兵出生
      this.OnCreepSpawned(npc);
    }
    if (npc.IsCourier() && keys.is_respawn === 0) {
      // 信使出生
      ModifierHelper.applyGlobalModifier(npc, 'modifier_global_courier_speed');
    }
  }

  // 设置英雄出生点，DebugCreateHeroWithVariant创造的 bot出生点在地图中央，需要移动到泉水
  private SetHeroSpawnPoint(hero: CDOTA_BaseNPC_Hero): void {
    // 调试面板生成的英雄应停留在用户指定位置，不能被自动拉回基地。
    if (IsHeroDemoDebugHero(hero)) {
      return;
    }

    if (PlayerHelper.IsHumanPlayer(hero)) {
      //print(`[EventNpcSpawned] SetHeroSpawnPoint human player ${hero.GetName()}`);
      return;
    }

    // 检查重试次数
    if (this.heroSpawnRetryCount >= this.MAX_SPAWN_RETRY) {
      //print(`[EventNpcSpawned] SetHeroSpawnPoint reached max retry count for ${hero.GetName()}`);
      return;
    }

    this.heroSpawnRetryCount++;

    const posBase =
      hero.GetTeam() === DotaTeam.GOODGUYS ? ActionMove.posRadiantBase : ActionMove.posDireBase;

    // 随机附近
    const pos = posBase.__add(RandomVector(250));
    hero.SetAbsOrigin(pos);

    Timers.CreateTimer(0.1, () => {
      // DebugCreateUnit 回调可能晚于 npc_spawned，因此重试基地落点前需要再次检查调试标记。
      if (IsHeroDemoDebugHero(hero)) {
        return;
      }

      // 检验英雄是否在基地，否则重新设置
      const posBase =
        hero.GetTeam() === DotaTeam.GOODGUYS ? ActionMove.posRadiantBase : ActionMove.posDireBase;
      const isInBase = hero.IsPositionInRange(posBase, 1500);
      if (!isInBase) {
        this.SetHeroSpawnPoint(hero);
        return;
      }
      // 如果与其他英雄碰撞，则重新设置
      const units = FindUnitsInRadius(
        hero.GetTeam(),
        hero.GetAbsOrigin(),
        undefined,
        32,
        UnitTargetTeam.BOTH,
        UnitTargetType.HERO,
        UnitTargetFlags.NONE,
        FindOrder.ANY,
        false,
      );
      // 排除当前英雄，有其他英雄则重新设置
      if (units.length > 1) {
        this.SetHeroSpawnPoint(hero);
        return;
      }
    });
  }

  // 英雄出生
  private OnRealHeroSpawned(hero: CDOTA_BaseNPC_Hero): void {
    this.SetHeroSpawnPoint(hero);
    // 近战buff
    if (
      hero.GetAttackCapability() === UnitAttackCapability.MELEE_ATTACK ||
      hero.GetName() === 'npc_dota_hero_troll_warlord'
    ) {
      ModifierHelper.applyGlobalModifier(hero, 'modifier_global_melee_resistance');
    }
    // 魔抗修正
    hero.AddNewModifier(hero, undefined, modifier_intelect_magic_resist.name, {});

    if (PlayerHelper.IsHumanPlayer(hero)) {
      // 中路乱斗模式：玩家出门 3 级，节奏更快
      if (GameRules.Option.midOnlyMode) {
        while (hero.GetLevel() < 3) {
          hero.HeroLevelUp(false);
        }
      }
      // 设置会员
      MemberHelper.ApplyMemberModifier(hero);
      const steamAccountId = PlayerResource.GetSteamAccountID(hero.GetPlayerID());
      // 积分解锁的永久觉醒
      AwakenHelper.ApplyUnlockedAwaken(hero, steamAccountId);
      // 设置新手BUFF
      const playerSeasonLevel = Player.GetSeasonLevel(steamAccountId);
      if (playerSeasonLevel <= 5) {
        ModifierHelper.applyGlobalModifier(hero, 'modifier_global_newbie');
      } else if (playerSeasonLevel <= 8) {
        ModifierHelper.applyGlobalModifier(hero, 'modifier_global_newbie_2');
      }
      // 设置玩家属性
      PlayerPropertyApi.SetPlayerProperty(hero);
    }
    if (PlayerHelper.IsBotPlayer(hero)) {
      // 机器人
      // delay 1s 后启用AI
      Timers.CreateTimer(1, () => {
        // 设置bot难度 0~4
        hero.SetBotDifficulty(4);
        GameRules.AI.EnableAI(hero);
        BotAbility.AddBotAbility(hero);
      });

      // bot在家待机一会在出门，防止出门在符点送人头
      const moveTime = 30;
      hero.AddNewModifier(hero, undefined, 'modifier_rooted', {
        duration: GameConfig.PRE_GAME_TIME - moveTime,
      });
    }
  }

  // 按几何象限判断兵线，与阵营无关（top=左上、bot=右下），塔名同样是几何方位
  private static getCreepLane(creep: CDOTA_BaseNPC): 'top' | 'mid' | 'bot' | null {
    const pos = creep.GetAbsOrigin();
    const diff = Math.abs(Math.abs(pos.x) - Math.abs(pos.y));
    if (diff < 1500) {
      return 'mid';
    }
    if (pos.x > 0 && pos.y < 0) {
      return 'bot';
    }
    if (pos.x < 0 && pos.y > 0) {
      return 'top';
    }
    return null;
  }

  // 该路一塔是否存活（一塔被推后小兵已逼近前线，不再需要无敌）
  private static isTower1Alive(team: DotaTeam, lane: string): boolean {
    const prefix =
      team === DotaTeam.GOODGUYS ? 'npc_dota_goodguys_tower' : 'npc_dota_badguys_tower';
    const targetName = `${prefix}1_${lane}`;
    const towers = Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[];
    for (const tower of towers) {
      if (tower.GetUnitName() === targetName && !tower.IsNull() && tower.GetHealth() > 0) {
        return true;
      }
    }
    return false;
  }

  // 计算距离下一个30s波次的等待时间
  private static getPreloadBuffer(gameTime: number): number {
    return Math.ceil(gameTime / 30) * 30 - gameTime;
  }

  private OnCreepSpawned(creep: CDOTA_BaseNPC): void {
    const creepName = creep.GetName();

    if (creepName === 'npc_dota_roshan') {
      // kill
      if (this.isFirstRoshan) {
        creep.Kill(undefined, creep);
        this.isFirstRoshan = false;
        return;
      }
      for (const abilityName of this.roshanLevelupBaseAbilities) {
        const ability = creep.FindAbilityByName(abilityName);
        if (ability) {
          ability.SetLevel(this.roshanLevelBase);
        }
      }
      for (const abilityName of this.roshanLevelupExtraAbilities) {
        const ability = creep.FindAbilityByName(abilityName);
        const level = this.getExtraRoshanLevel();
        if (ability) {
          ability.SetLevel(level);
        }
      }

      if (this.roshanLevelBase < 5 - 1) {
        this.roshanLevelBase++;
      }
      return;
    }

    print(`[EventNpcSpawned] creep spawned: ${creepName} at ${creep.GetAbsOrigin()}`);

    // 兵线小兵：出生到己方最远塔前无敌，防止中途被拉断线
    this.applyCreepLaneInvulnerable(creep, creepName);
  }

  private applyCreepLaneInvulnerable(creep: CDOTA_BaseNPC, creepName: string): void {
    // 仅处理兵线小兵与攻城车（entity name 为 lane/siege，不含野怪、召唤物等）
    if (creepName !== 'npc_dota_creep_lane' && creepName !== 'npc_dota_creep_siege') {
      return;
    }

    print(`[CreepInvuln] creep spawned: ${creepName}`);

    const team = creep.GetTeam();
    const lane = EventNpcSpawned.getCreepLane(creep);
    if (!lane) {
      print(`[CreepInvuln]   FAIL: cannot determine lane`);
      return;
    }

    print(`[CreepInvuln]   team=${team}, lane=${lane}, pos=${creep.GetAbsOrigin()}`);

    // 仅一塔存活时才加无敌，一塔被推后小兵已逼近前线无需保护
    if (!EventNpcSpawned.isTower1Alive(team, lane)) {
      print(`[CreepInvuln]   SKIP: tower1 not alive in lane ${lane}`);
      return;
    }

    const travelTime = EventNpcSpawned.CREEP_T1_TRAVEL_TIMES[lane];
    const preloadBuffer = EventNpcSpawned.getPreloadBuffer(GameRules.GetGameTime());
    const duration = preloadBuffer + travelTime;

    print(
      `[CreepInvuln]   travelTime=${travelTime}, preloadBuffer=${preloadBuffer}, duration=${duration}`,
    );
    creep.AddNewModifier(creep, undefined, 'modifier_fountain_glyph', { duration });
  }

  private getExtraRoshanLevel(): number {
    let extra = 0;

    if (Player.GetPlayerCount() >= 2) {
      extra++;
    }
    if (Player.GetPlayerCount() >= 4) {
      extra++;
    }
    if (Player.GetPlayerCount() >= 6) {
      extra++;
    }
    if (Player.GetPlayerCount() >= 8) {
      extra++;
    }
    return this.roshanLevelBase + extra;
  }
}
