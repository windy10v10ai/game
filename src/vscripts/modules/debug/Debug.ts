import { GA4 } from '../../api/analytics/ga4';
import { reloadable } from '../../utils/tstl-utils';
import { GameEnd } from '../event/game-end/game-end';
import { ModifierHelper } from '../helper/modifier-helper';
import { PlayerHelper } from '../helper/player-helper';
import { CMD } from './debug-cmd';

@reloadable
export class Debug {
  DebugEnabled = false;
  // 在线测试白名单
  OnlineDebugWhiteList = [
    136407523, // windy
    916506173, // windy
    385130282, // mimihua
    116431158,
  ];

  constructor() {
    // 工具模式下默认开启调试
    this.DebugEnabled = IsInToolsMode();
    ListenToGameEvent(`player_chat`, (keys) => this.OnPlayerChat(keys), this);
  }

  OnPlayerChat(keys: GameEventProvidedProperties & PlayerChatEvent): void {
    const steamid = PlayerResource.GetSteamAccountID(keys.playerid);

    if (!this.OnlineDebugWhiteList.includes(steamid)) {
      return;
    }

    const strs = keys.text.split(' ');
    const cmd = strs[0];
    const args = strs.slice(1);

    if (cmd === '-debug') {
      this.DebugEnabled = !this.DebugEnabled;
    }

    // 只在允许调试的时候才执行以下指令
    // commands that only work in debug mode below:
    if (!this.DebugEnabled) return;

    // ---- 常用命令 ----

    if (cmd === CMD.V) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const pos = hero.GetAbsOrigin();
      const vectorString = `Vector(${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(
        pos.z,
      )})`;
      this.log(`当前位置: ${vectorString}`);
    }
    if (cmd === CMD.M) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const modifiers = hero.FindAllModifiers();
      for (const modifier of modifiers) {
        this.log(modifier.GetName());
      }
    }
    if (cmd === CMD.A) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const abilities = hero.GetAbilityCount();
      this.log(`abilities: ${abilities}`);
      for (let i = 0; i < abilities; i++) {
        const ability = hero.GetAbilityByIndex(i);
        if (!ability) continue;
        this.log(ability.GetName());
      }
    }

    if (cmd === CMD.REFRESH_AI) {
      this.log(`REFRESH_AI`);
      PlayerHelper.ForEachPlayer((playerId) => {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        GameRules.AI.EnableAI(hero);
      });
    }

    if (cmd === CMD.T) {
      this.log(`Time: ${Time()}`);
      this.log(`GameTime: ${GameRules.GetGameTime()}`);
      this.log(`GetDOTATime: ${GameRules.GetDOTATime(false, true)}`);
      GA4.FetchCurrentTime((timestamp) => {
        this.log(`FetchCurrentTime: ${timestamp}`);
      });
    }

    if (cmd === CMD.SHARD) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      hero.AddItemByName('item_aghanims_shard');
    }

    if (cmd === CMD.G) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      // 获得金钱经验技能升满
      hero.ModifyGold(99999, false, ModifyGoldReason.UNSPECIFIED);
      hero.AddExperience(99999, ModifyXpReason.UNSPECIFIED, false, true);
      // refresh teleport
      hero.GetItemInSlot(15)?.EndCooldown();
    }

    if (cmd === CMD.G_ALL) {
      PlayerHelper.ForEachPlayer((playerId) => {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        // 获得金钱经验技能升满
        hero.ModifyGold(50000, false, ModifyGoldReason.UNSPECIFIED);
        hero.AddExperience(50000, ModifyXpReason.UNSPECIFIED, false, true);
      });
    }

    if (cmd === CMD.L_ALL) {
      for (let i = 0; i < 30; i++) {
        Timers.CreateTimer(i * 3, () => {
          PlayerHelper.ForEachPlayer((playerId) => {
            const hero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (!hero) return;
            // 升级 加钱
            hero.HeroLevelUp(true);
            hero.ModifyGold(5000, false, ModifyGoldReason.UNSPECIFIED);
          });
        });
      }
    }

    // ---- ability ----
    if (cmd === CMD.ADD_ABILITY) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const abilityName = args[0];
      hero.AddAbility(abilityName);
    }
    if (cmd === CMD.ADD_ABILITY_ALL) {
      PlayerHelper.ForEachPlayer((playerId) => {
        if (!PlayerHelper.IsHumanPlayerByPlayerId(playerId)) return;
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        const abilityName = args[0];
        hero.AddAbility(abilityName);
      });
    }
    // ---- item ----
    // add bkb to all
    if (cmd === CMD.ADD_BKB_ALL) {
      PlayerHelper.ForEachPlayer((playerId) => {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        hero.AddItemByName('item_black_king_bar_2');
      });
    }
    if (cmd === CMD.ADD_ITEM_ALL) {
      const itemName = args[0];
      PlayerHelper.ForEachPlayer((playerId) => {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        hero.AddItemByName(itemName);
      });
    }
    if (cmd === CMD.RM_ITEM) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const itemName = args[0];
      const item = hero.FindItemInInventory(itemName);
      UTIL_RemoveImmediate(item);
    }
    if (cmd === CMD.REPLACE_NEUTRAL_ITEM) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const item = hero.GetItemInSlot(InventorySlot.NEUTRAL_ACTIVE_SLOT);
      if (item) {
        UTIL_RemoveImmediate(item);
      }
      const itemName = args[0];
      hero.AddItemByName(itemName);
    }
    if (cmd === CMD.REPLACE_ENHANCE_ITEM) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const item = hero.GetItemInSlot(InventorySlot.NEUTRAL_PASSIVE_SLOT);
      if (item) {
        UTIL_RemoveImmediate(item);
      }
      const itemName = args[0];
      hero.AddItemByName(itemName);
    }

    if (cmd === CMD.REPLACE_ITEM_ALL) {
      const itemName = args[0];
      PlayerHelper.ForEachPlayer((playerId) => {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        for (let i = 0; i < 6; i++) {
          const item = hero.GetItemInSlot(i);
          if (item) {
            UTIL_RemoveImmediate(item);
          }
          hero.AddItemByName(itemName);
        }
      });
    }

    if (cmd === CMD.REMOVE_ITEM_ALL) {
      PlayerHelper.ForEachPlayer((playerId) => {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        for (let i = 0; i < 6; i++) {
          const item = hero.GetItemInSlot(i);
          if (item) {
            UTIL_RemoveImmediate(item);
          }
        }
      });
    }

    if (cmd === CMD.LOTTERY) {
      GameRules.Lottery.initLotteryAll();
    }

    if (cmd === CMD.END) {
      GameEnd.OnGameEnd(2);
    }

    if (cmd === CMD.KILL) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;

      hero.Kill(undefined, hero);
    }

    if (cmd === CMD.KILL_ALL) {
      PlayerHelper.ForEachPlayer((playerId) => {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        hero.Kill(undefined, hero);
      });
    }

    if (cmd.startsWith(CMD.GET_KEY_V3)) {
      const version = args[0];
      const key = GetDedicatedServerKeyV3(version);
      this.log(`${version}: ${key}`);
    }

    // add modifier 卡顿测试
    if (cmd.startsWith(CMD.MODIFIER_ADD)) {
      const modifierName = args[0];
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (hero) {
        hero.AddNewModifier(hero, undefined, modifierName, {});
      }
    }
    if (cmd.startsWith(CMD.MODIFIER_REMOVE)) {
      const modifierName = args[0];
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (hero) {
        hero.RemoveModifierByName(modifierName);
      }
    }

    const modiferCount = 50;
    if (cmd.startsWith(CMD.MODIFIER_ADD_All)) {
      const modifierName = args[0];
      PlayerHelper.ForEachPlayer((playerId) => {
        // add modifier
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
          for (let i = 0; i < modiferCount; i++) {
            hero.AddNewModifier(hero, undefined, modifierName, {});
          }
        }
      });
    }
    if (cmd.startsWith(CMD.MODIFIER_ADD_DATADRIVE_All)) {
      const modifierName = args[0];
      PlayerHelper.ForEachPlayer((playerId) => {
        // add modifier
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
          for (let i = 0; i < modiferCount; i++) {
            ModifierHelper.applyItemDataDrivenModifier(hero, hero, modifierName);
          }
        }
      });
    }
    if (cmd.startsWith(CMD.MODIFIER_REMOVE_All)) {
      const modifierName = args[0];
      PlayerHelper.ForEachPlayer((playerId) => {
        // add modifier
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
          // remove all modifier
          for (let i = 0; i < modiferCount; i++) {
            hero.RemoveModifierByName(modifierName);
          }
        }
      });
    }

    // ---- 当前英雄相关 ----
    if (cmd === CMD.REPLACE_HERO) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const heroName = args[0];
      PlayerResource.ReplaceHeroWith(hero.GetPlayerID(), heroName, 0, 0);
    }

    if (cmd === CMD.RESET_ABILITY) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      for (let i = 0; i < 16; i++) {
        const ability = hero.GetAbilityByIndex(i);
        if (ability) {
          ability.SetLevel(0);
        }
      }
    }
    if (cmd === CMD.REFRESH_BUYBACK) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      hero.SetBuybackCooldownTime(0);
    }
    // 获取状态抗性
    if (cmd === CMD.GET_SR) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const sr = hero.GetStatusResistance();
      this.log(`status resistance: ${sr}`);
    }
    // 造成存粹伤害
    if (cmd === CMD.DAMAGE_PURE) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const damage = Number(args[0]);
      ApplyDamage({
        attacker: hero,
        victim: hero,
        damage: damage,
        damage_type: DamageTypes.PURE,
        ability: undefined,
        damage_flags: DamageFlag.NONE,
      });
    }
    // 减少生命值
    if (cmd === CMD.HP_LOSS) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      hero.SetHealth(hero.GetHealth() * 0.1);
    }
    // 晕眩
    if (cmd === CMD.STUN) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const duration = Number(args[0] || 5);
      hero.AddNewModifier(hero, undefined, 'modifier_stunned', { duration });
    }
    // 沉默
    if (cmd === CMD.SILENCE) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const duration = Number(args[0] || 5);
      hero.AddNewModifier(hero, undefined, 'modifier_silence', { duration });
    }
    // 缠绕
    if (cmd === CMD.ROOT) {
      const hero = PlayerResource.GetSelectedHeroEntity(keys.playerid);
      if (!hero) return;
      const duration = Number(args[0] || 5);
      hero.AddNewModifier(hero, undefined, 'modifier_rooted', { duration });
    }
  }

  log(message: string) {
    print(`[Debug] ${message}`);
    Say(HeroList.GetHero(0), message, false);
  }
}
