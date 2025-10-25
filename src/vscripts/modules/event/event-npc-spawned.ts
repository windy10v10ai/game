import { ActionMove } from '../../ai/action/action-move';
import { MemberLevel, Player, PlayerProperty } from '../../api/player';
import { modifier_intelect_magic_resist } from '../../modifiers/global/intelect_magic_resist';
import { GameConfig } from '../GameConfig';
import { BotAbility } from '../helper/bot-ability';
import { ModifierHelper } from '../helper/modifier-helper';
import { PlayerHelper } from '../helper/player-helper';
import { PropertyController } from '../property/property_controller';
export class EventNpcSpawned {
  private roshanLevelBase = 0;
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

  private static supportHeroBlacklist = [
    'npc_dota_hero_crystal_maiden', // 水晶室女
    'npc_dota_hero_dazzle', // 戴泽
    'npc_dota_hero_omniknight', // 全能骑士
    'npc_dota_hero_warlock', // 术士
    'npc_dota_hero_witch_doctor', // 巫医
    'npc_dota_hero_shadow_shaman', // 暗影萨满
    'npc_dota_hero_oracle', // 神谕者
    'npc_dota_hero_jakiro', // 杰奇洛
    'npc_dota_hero_bane', // 祸乱之源
    'npc_dota_hero_lich', // 巫妖
    'npc_dota_hero_lion', // lion
  ];

  // ✅ 修改: 严格基于Bot AI实际选择列表的Boss白名单
  private static bossCandidateWhitelist = [
    // === 力量型核心 (高生存+输出) ===
    'npc_dota_hero_axe', // 斧王 - 反击螺旋,高护甲
    'npc_dota_hero_bristleback', // 钢背兽 - 减伤被动,持续输出
    'npc_dota_hero_chaos_knight', // 混沌骑士 - 高爆发,幻象
    'npc_dota_hero_dragon_knight', // 龙骑士 - 高护甲,AOE输出
    'npc_dota_hero_pudge', // 帕吉 - 高生命,魔法伤害
    'npc_dota_hero_sven', // 斯温 - 高爆发,AOE清场
    'npc_dota_hero_tiny', // 小小 - 高爆发,后期肉盾
    'npc_dota_hero_skeleton_king', // 骷髅王 - 重生,高输出

    // === 敏捷型核心 (输出+一定生存) ===
    'npc_dota_hero_juggernaut', // 剑圣 - 魔免,高输出
    'npc_dota_hero_phantom_assassin', // 幻影刺客 - 高爆发,闪避
    'npc_dota_hero_luna', // 露娜 - AOE输出,月光
    'npc_dota_hero_medusa', // 美杜莎 - 魔法盾,后期肉盾
    'npc_dota_hero_spectre', // 幽鬼 - 折射,后期肉盾
    'npc_dota_hero_kunkka', // 昆卡 - AOE控制+输出

    // === 智力型核心 (高输出+控制) ===
    'npc_dota_hero_death_prophet', // 死亡先知 - 持续输出,生存
    'npc_dota_hero_necrolyte', // 瘟疫法师 - 回复+输出
    'npc_dota_hero_tinker', // 修补匠 - 持续输出

    // === 混合型 (输出+生存平衡) ===
    'npc_dota_hero_bloodseeker', // 血魔 - 追杀能力,回复
    'npc_dota_hero_bounty_hunter', // 赏金猎人 - 爆发+隐身
    'npc_dota_hero_riki', // 力丸 - 持续输出+隐身
    'npc_dota_hero_viper', // 冥界亚龙 - 持续输出,减速
    'npc_dota_hero_windrunner', // 风行者 - 高输出,闪避
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

  // 在 event-npc-spawned.ts 中添加
  private static bossSelected = false;
  // 英雄出生
  private OnRealHeroSpawned(hero: CDOTA_BaseNPC_Hero): void {
    this.SetHeroSpawnPoint(hero);
    // 近战buff
    if (
      hero.GetAttackCapability() === UnitAttackCapability.MELEE_ATTACK ||
      hero.GetName() === 'npc_dota_hero_troll_warlord' ||
      hero.GetName() === 'npc_dota_hero_lone_druid'
    ) {
      ModifierHelper.applyGlobalModifier(hero, 'modifier_global_melee_resistance');
    }
    // 魔抗修正
    hero.AddNewModifier(hero, undefined, modifier_intelect_magic_resist.name, {});

    if (PlayerHelper.IsHumanPlayer(hero)) {
      // 设置会员
      const steamAccountId = PlayerResource.GetSteamAccountID(hero.GetPlayerID());
      const memberLevel = Player.GetMemberLevel(steamAccountId);
      if (memberLevel === MemberLevel.NORMAL) {
        ModifierHelper.applyGlobalModifier(hero, 'modifier_global_member_normal');
      } else if (memberLevel === MemberLevel.PREMIUM) {
        ModifierHelper.applyGlobalModifier(hero, 'modifier_global_member_premium');
      }
      // 设置新手BUFF
      const playerSeasonLevel = Player.GetSeasonLevel(steamAccountId);
      if (playerSeasonLevel <= 5) {
        ModifierHelper.applyGlobalModifier(hero, 'modifier_global_newbie');
      } else if (playerSeasonLevel <= 8) {
        ModifierHelper.applyGlobalModifier(hero, 'modifier_global_newbie_2');
      }
      // 设置玩家属性
      Player.SetPlayerProperty(hero);
    }
    if (PlayerHelper.IsBotPlayer(hero)) {
      // 机器人
      // delay 1s 后启用AI
      Timers.CreateTimer(1, () => {
        // 设置bot难度 0~4
        hero.SetBotDifficulty(4);
        GameRules.AI.EnableAI(hero);
        // 随机选择一个Bot作为Boss
        GameRules.AI.EnableAI(hero);

        // ✅ 新增: 只有经验金钱倍数>=12时才会出现Boss
        if (
          !EventNpcSpawned.bossSelected &&
          hero.GetTeam() === DotaTeam.BADGUYS &&
          GameRules.Option.direGoldXpMultiplier >= 12
        ) {
          // 黑名单
          const isSupport = EventNpcSpawned.supportHeroBlacklist.includes(hero.GetUnitName());
          // 检查是否在白名单中
          const isCandidate = EventNpcSpawned.bossCandidateWhitelist.includes(hero.GetUnitName());

          if (!isSupport && isCandidate) {
            EventNpcSpawned.bossSelected = true;
            this.MakeBotBoss(hero);
          }
        }
        if (!hero.isBoss) BotAbility.AddBotAbility(hero, 0);
      });

      // bot在家待机一会在出门，防止出门在符点送人头
      const moveTime = 35;
      if (hero.GetTeam() === DotaTeam.BADGUYS) {
        hero.AddNewModifier(hero, undefined, 'modifier_rooted', {
          duration: GameConfig.PRE_GAME_TIME - moveTime,
        });
      }
    }
  }

  private MakeBotBoss(hero: CDOTA_BaseNPC_Hero): void {
    //print(`[BotBoss] Selected ${hero.GetUnitName()} as Boss`);
    hero.isBoss = true;
    // ✅ 新增: 向所有玩家发送Boss生成通知 mark bug
    const heroName = hero.GetUnitName();
    const localizedName = `#${heroName}`;
    GameRules.SendCustomMessage(
      `<font color='#FF0000'>⚠️ 随机BotBoss: ${localizedName}。BotBoss拥有双倍经验金钱倍率，并有更高的进攻性，但击杀boss也会得到成倍的经验和金钱！</font>`,
      1,
      0,
    );
    Timers.CreateTimer(3, () => {
      const highestPropertyPlayer = this.FindHighestPropertyPlayer();

      if (!highestPropertyPlayer) {
        //print('[BotBoss] No player with properties found, retrying in 5s...');
        Timers.CreateTimer(5, () => {
          const retryPlayer = this.FindHighestPropertyPlayer();
          if (!retryPlayer) {
            //print('[BotBoss] Still no player found, skipping boss property copy');
            hero.SetModelScale(2);
            return;
          }
          this.ApplyBossProperties(hero, retryPlayer);
        });
        return;
      }

      this.ApplyBossProperties(hero, highestPropertyPlayer);
    });
  }

  private ApplyBossProperties(
    hero: CDOTA_BaseNPC_Hero,
    playerInfo: { hero: CDOTA_BaseNPC_Hero; steamId: number; totalLevel: number },
  ): void {
    const multiplier = GameRules.Option.direGoldXpMultiplier;

    //print(
    //  `[BotBoss] Copying properties from ${playerInfo.hero.GetUnitName()} (Property Level: ${playerInfo.totalLevel}, Multiplier: ${multiplier}x)`,
    //);

    hero.SetModelScale(2);
    this.CopyPlayerPropertiesToBot(hero, playerInfo.steamId, math.min(multiplier * 1.2, 100));

    // 根据倍数决定技能数量
    let extraAbilityCount = 0;
    if (multiplier >= 60) {
      extraAbilityCount = 2;
    } else if (multiplier >= 20) {
      extraAbilityCount = 1;
    } else {
      extraAbilityCount = 0;
    }

    // ✅ 修改: 使用BotAbility添加技能
    BotAbility.AddBotAbility(hero, extraAbilityCount);
  }

  private FindHighestPropertyPlayer():
    | { hero: CDOTA_BaseNPC_Hero; steamId: number; totalLevel: number }
    | undefined {
    let highestLevel = 0;
    let result: { hero: CDOTA_BaseNPC_Hero; steamId: number; totalLevel: number } | undefined;

    //print('[BotBoss] Searching for highest property player...');

    PlayerHelper.ForEachPlayer((playerId) => {
      if (PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        const steamId = PlayerResource.GetSteamAccountID(playerId);

        //print(
        //  `[BotBoss] Checking player ${playerId}, steamId: ${steamId}, hero: ${hero ? hero.GetUnitName() : 'null'}`,
        //);

        if (hero && hero.IsRealHero() && !hero.IsIllusion()) {
          const playerData = CustomNetTables.GetTableValue('player_table', steamId.toString());

          // 修改后
          if (playerData !== undefined && playerData !== null) {
            //print(
            //  `[BotBoss] Player ${steamId} has data, totalLevel: ${playerData.totalLevel || 'undefined'}`,
            //);

            // 修改后
            if (playerData.totalLevel !== undefined && playerData.totalLevel > 0) {
              const totalLevel = playerData.totalLevel as number;
              if (totalLevel > highestLevel) {
                highestLevel = totalLevel;
                result = { hero, steamId, totalLevel };
                //print(`[BotBoss] New highest: ${hero.GetUnitName()} with level ${totalLevel}`);
              }
            }
          } else {
            //print(`[BotBoss] Player ${steamId} has no data in player_table`);
          }
        }
      }
    });

    if (result) {
      //print(
      //  `[BotBoss] Found highest property player: ${result.hero.GetUnitName()} (level ${result.totalLevel})`,
      //);
    } else {
      //print('[BotBoss] No player with properties found');
    }

    return result;
  }

  private CopyPlayerPropertiesToBot(
    bot: CDOTA_BaseNPC_Hero,
    playerSteamId: number,
    multiplier: number,
  ): void {
    const playerData = CustomNetTables.GetTableValue('player_table', playerSteamId.toString());

    if (!playerData || !playerData.properties) {
      //print('[BotBoss] No properties found for player');
      return;
    }

    const discountRate = Math.min(multiplier / 100, 1.0);
    //print(
    //  `[BotBoss] Applying ${(discountRate * 100).toFixed(0)}% of player properties (${multiplier}x multiplier)`,
    //);

    const properties = playerData.properties as Record<string, PlayerProperty>;

    // 添加调试:显示属性总数
    //const propertyCount = Object.keys(properties).length;
    //print(`[BotBoss] Found ${propertyCount} properties to copy`);

    Object.values(properties).forEach((property) => {
      if (property.level > 0) {
        const discountedLevel = Math.floor(property.level * discountRate);

        if (discountedLevel > 0) {
          const discountedProperty: PlayerProperty = {
            steamId: property.steamId,
            name: property.name,
            level: discountedLevel,
          };

          PropertyController.LevelupHeroProperty(bot, discountedProperty);
          //print(
          //  `[BotBoss] Applied property ${property.name} level ${discountedLevel} (original: ${property.level}, discount: ${(discountRate * 100).toFixed(0)}%)`,
          //);
        } else {
          //print(`[BotBoss] Skipped property ${property.name} (discounted level is 0)`);
        }
      }
    });
    //print(`[BotBoss] Applied all property`);
  }

  private OnCreepSpawned(creep: CDOTA_BaseNPC): void {
    const creepName = creep.GetName();

    if (creepName === 'npc_dota_roshan') {
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
    }
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
