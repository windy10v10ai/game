import { modifier_debug_invulnerable } from '../../modifiers/debug/modifier_debug_invulnerable';
import { modifier_debug_manual_control } from '../../modifiers/debug/modifier_debug_manual_control';

// 调试面板默认生成英雄（npc_dota_hero_18 → sven），与原生面板初始体验一致。
const DEFAULT_SPAWN_HERO_ID = 18;

// 面板按钮通过 Valve 内置 FireCustomGameEvent_Str 发送，payload 固定为 { str, PlayerID }。
interface StrEventData {
  PlayerID: PlayerID;
  str: string;
}

/**
 * 英雄调试面板服务端逻辑，仅在 Tools 模式启用。
 * 替代原 game/scripts/vscripts/eyeherodemo/demo_core.lua + demo_events.lua。
 */
export class HeroDebugPanel {
  // 每个真人玩家当前主英雄的 entindex，用于英雄替换时清理旧面板条目。
  private playerHeroEntIndex = new Map<PlayerID, EntityIndex>();
  // 已创建调试面板 HUD 的玩家，避免重复创建。
  private hudCreatedPlayers = new Set<PlayerID>();

  constructor() {
    if (!IsInToolsMode()) {
      return;
    }

    GameRules.SetUseUniversalShopMode(true);

    this.registerButtonListeners();

    ListenToGameEvent('npc_spawned', (keys) => this.onNpcSpawned(keys), this);
    ListenToGameEvent('dota_on_hero_finish_spawn', (keys) => this.onHeroFinishSpawn(keys), this);
    ListenToGameEvent('dota_item_purchased', (keys) => this.onItemPurchased(keys), this);
  }

  private registerButtonListeners(): void {
    // 生成英雄到指定队伍
    this.onStr('SpawnToTeamButtonPressed', (e) => this.onSpawnToTeam(e));
    this.onStr('DummyTargetButtonPressed', (e) => this.onSpawnDummyTarget(e));

    // 选择待生成英雄
    this.onStr('SelectSpawnHeroButtonPressed', (e) => this.onSelectSpawnHero(e));
    this.onStr('SelectMainHeroButtonPressed', (e) => this.onSelectMainHero(e));
    this.onStr('RequestInitialSpawnHeroID', () => this.sendSpawnHeroId(DEFAULT_SPAWN_HERO_ID));

    // 编辑所选单位（payload.str 为目标 entindex）
    this.onStr('LevelUpHero', (e) => this.withHero(e, (h) => h.HeroLevelUp(true)));
    this.onStr('MaxLevelUpHero', (e) => this.withHero(e, (h) => this.maxLevelHero(h)));
    this.onStr('ScepterHero', (e) => this.withHero(e, (h) => this.grantScepter(h)));
    this.onStr('ShardHero', (e) => this.withHero(e, (h) => this.grantShard(h)));
    this.onStr('ResetHero', (e) => this.withHero(e, (h) => this.resetHero(h)));
    this.onStr('RemoveHeroButtonPressed', (e) => this.onRemoveHero(e));
    this.onStr('InvulnOnHero', (e) => this.withHero(e, (h) => this.setInvulnerable(h, true)));
    this.onStr('InvulnOffHero', (e) => this.withHero(e, (h) => this.setInvulnerable(h, false)));
    this.onStr('ToggleInvulnerabilityHero', (e) =>
      this.withHero(e, (h) =>
        this.setInvulnerable(h, !h.HasModifier(modifier_debug_invulnerable.name)),
      ),
    );

    // 全局调试开关
    this.onStr('FreeSpellsButtonPressed', () => this.toggleFreeSpells());
    this.onStr('RefreshButtonPressed', () => SendToServerConsole('dota_dev hero_refresh'));
    this.onStr('ToggleDayNight', () => this.toggleDayNight());
    this.onStr('PauseButtonPressed', () => SendToServerConsole('dota_pause'));
    this.onStr('LeaveButtonPressed', () => SendToServerConsole('disconnect'));

    // 生成符文
    this.onStr('SpawnRuneDoubleDamagePressed', (e) => this.spawnRune(e, RuneType.DOUBLEDAMAGE));
    this.onStr('SpawnRuneHastePressed', (e) => this.spawnRune(e, RuneType.HASTE));
    this.onStr('SpawnRuneIllusionPressed', (e) => this.spawnRune(e, RuneType.ILLUSION));
    this.onStr('SpawnRuneInvisibilityPressed', (e) => this.spawnRune(e, RuneType.INVISIBILITY));
    this.onStr('SpawnRuneRegenerationPressed', (e) => this.spawnRune(e, RuneType.REGENERATION));
    this.onStr('SpawnRuneArcanePressed', (e) => this.spawnRune(e, RuneType.ARCANE));
  }

  private onStr(eventName: string, handler: (event: StrEventData) => void): void {
    CustomGameEventManager.RegisterListener<StrEventData>(eventName, (_userId, event) => {
      handler(event);
      EmitGlobalSound('UI.Button.Pressed');
    });
  }

  // 解析 payload.str 为目标英雄并执行操作
  private withHero(event: StrEventData, action: (hero: CDOTA_BaseNPC_Hero) => void): void {
    const entIndex = tonumber(event.str);
    if (entIndex === undefined) {
      return;
    }
    const hero = EntIndexToHScript(entIndex as EntityIndex) as CDOTA_BaseNPC_Hero | undefined;
    if (hero && !hero.IsNull() && hero.IsHero()) {
      action(hero);
    }
  }

  private getSelectedHero(playerId: PlayerID): CDOTA_BaseNPC_Hero | undefined {
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    return hero && !hero.IsNull() ? hero : undefined;
  }

  // -------------------------------------------------------------------------
  // 生成英雄
  // -------------------------------------------------------------------------

  private onSpawnToTeam(event: StrEventData): void {
    const playerId = event.PlayerID;
    const selectedHero = this.getSelectedHero(playerId);
    if (!selectedHero) {
      return;
    }

    const team = tonumber(event.str) ?? PlayerResource.GetTeam(playerId);
    const player = PlayerResource.GetPlayer(playerId);
    if (!player) {
      return;
    }
    const heroName = Convars.GetStr('dota_hero_demo_default_enemy');
    if (heroName === undefined) {
      return;
    }

    this.spawnDebugHero(player, playerId, heroName, team, selectedHero.GetAbsOrigin());
  }

  // 在指定位置创建一个由调试玩家手动控制的英雄。
  private spawnDebugHero(
    player: CDOTAPlayerController,
    playerId: PlayerID,
    heroName: string,
    team: DotaTeam,
    spawnLoc: Vector,
  ): void {
    DebugCreateUnit(player, heroName, team, false, (spawned) => {
      const hero = spawned as CDOTA_BaseNPC_Hero;
      // 标记为调试面板英雄：跳过出生点重置、bot AI 初始化与出装。
      hero.AddNewModifier(hero, undefined, modifier_debug_manual_control.name, {});

      FindClearSpaceForUnit(hero, spawnLoc, false);
      hero.SetRespawnPosition(spawnLoc);
      // 绑定到操作者，使其手动控制、不被 bot AI 接管。
      hero.SetOwner(player);
      hero.SetPlayerID(playerId);
      hero.SetControllableByPlayer(playerId, false);
      hero.RemoveModifierByName('modifier_rooted');
      // 关闭自动索敌并立刻 Hold，保持静止等待玩家操作。
      hero.SetAcquisitionRange(0);
      hero.SetIdleAcquire(false);
      hero.Hold();
    });
  }

  private onSpawnDummyTarget(event: StrEventData): void {
    const selectedHero = this.getSelectedHero(event.PlayerID);
    if (!selectedHero) {
      return;
    }
    const dummy = CreateUnitByName(
      'npc_dota_hero_target_dummy',
      selectedHero.GetAbsOrigin(),
      true,
      undefined,
      undefined,
      DotaTeam.NEUTRALS,
    );
    dummy.SetControllableByPlayer(event.PlayerID, false);
    dummy.Hold();
    dummy.SetIdleAcquire(false);
    dummy.SetAcquisitionRange(0);
  }

  private onSelectSpawnHero(event: StrEventData): void {
    const heroId = tonumber(event.str);
    if (heroId === undefined) {
      return;
    }
    this.sendSpawnHeroId(heroId);
  }

  private onSelectMainHero(event: StrEventData): void {
    const heroId = tonumber(event.str);
    if (heroId === undefined) {
      return;
    }
    const heroName = DOTAGameManager.GetHeroUnitNameByID(heroId);
    CustomGameEventManager.Send_ServerToAllClients<{ hero_id: number; hero_name: string }>(
      'set_main_hero_id',
      { hero_id: heroId, hero_name: heroName },
    );
  }

  private sendSpawnHeroId(heroId: number): void {
    const heroName = DOTAGameManager.GetHeroUnitNameByID(heroId);
    Convars.SetStr('dota_hero_demo_default_enemy', heroName);
    CustomGameEventManager.Send_ServerToAllClients<{ hero_id: number; hero_name: string }>(
      'set_spawn_hero_id',
      { hero_id: heroId, hero_name: heroName },
    );
  }

  // -------------------------------------------------------------------------
  // 编辑所选单位
  // -------------------------------------------------------------------------

  private maxLevelHero(hero: CDOTA_BaseNPC_Hero): void {
    hero.AddExperience(59900, ModifyXpReason.UNSPECIFIED, false, false);
    for (let i = 0; i < DOTA_MAX_ABILITIES; i++) {
      const ability = hero.GetAbilityByIndex(i);
      if (ability && !ability.IsAttributeBonus()) {
        while (
          ability.GetLevel() < ability.GetMaxLevel() &&
          ability.CanAbilityBeUpgraded() &&
          !ability.IsHidden()
        ) {
          hero.UpgradeAbility(ability);
        }
      }
    }
  }

  private grantScepter(hero: CDOTA_BaseNPC_Hero): void {
    if (!hero.HasModifier('modifier_item_ultimate_scepter_consumed')) {
      hero.AddItemByName('item_ultimate_scepter_2');
    }
  }

  private grantShard(hero: CDOTA_BaseNPC_Hero): void {
    if (!hero.HasModifier('modifier_item_aghanims_shard')) {
      hero.AddItemByName('item_aghanims_shard');
    }
  }

  // 重置选中单位：回到初始状态（1 级、技能加点清零、属性归零）。
  // 引擎无英雄降级 API，因此采用销毁原英雄后在原位重建一个全新 1 级英雄的方式。
  private resetHero(hero: CDOTA_BaseNPC_Hero): void {
    // 仅处理调试面板生成的英雄，避免误销毁玩家自己的主英雄。
    if (!hero.HasModifier(modifier_debug_manual_control.name)) {
      return;
    }
    const player = hero.GetPlayerOwner();
    if (!player) {
      return;
    }
    const playerId = hero.GetPlayerID();
    const heroName = hero.GetUnitName();
    const team = hero.GetTeamNumber();
    const spawnLoc = hero.GetAbsOrigin();

    hero.Destroy();
    this.spawnDebugHero(player, playerId, heroName, team, spawnLoc);
  }

  private setInvulnerable(hero: CDOTA_BaseNPC_Hero, invulnerable: boolean): void {
    const units = hero.IsRealHero() ? hero.GetAdditionalOwnedUnits() : [];
    units.push(hero);
    for (const unit of units) {
      if (invulnerable) {
        unit.AddNewModifier(hero, undefined, modifier_debug_invulnerable.name, {});
      } else {
        unit.RemoveModifierByName(modifier_debug_invulnerable.name);
      }
    }
  }

  private onRemoveHero(event: StrEventData): void {
    const entIndex = tonumber(event.str);
    if (entIndex === undefined) {
      return;
    }
    const hero = EntIndexToHScript(entIndex as EntityIndex) as CDOTA_BaseNPC_Hero | undefined;
    if (!hero || hero.IsNull() || !hero.IsHero()) {
      return;
    }
    // 仅移除调试面板生成的英雄。玩家自己的主英雄没有该标记，自然被拒绝，
    // 避免误删（客户端无法可靠判断，由服务端用 modifier 标记统一把关）。
    if (!hero.HasModifier(modifier_debug_manual_control.name)) {
      return;
    }

    // 调试英雄是 DebugCreateUnit 创建的额外单位，直接销毁实体即可。
    hero.Destroy();
    CustomGameEventManager.Send_ServerToAllClients<{ entindex: number }>('remove_hero_entry', {
      entindex: entIndex,
    });
  }

  // -------------------------------------------------------------------------
  // 全局开关
  // -------------------------------------------------------------------------

  private toggleFreeSpells(): void {
    const enabled = Convars.GetInt('dota_ability_debug') === 1;
    Convars.SetInt('dota_ability_debug', enabled ? 0 : 1);
    if (!enabled) {
      SendToServerConsole('dota_dev hero_refresh');
    }
  }

  private toggleDayNight(): void {
    GameRules.SetTimeOfDay(GameRules.IsDaytime() ? 0.751 : 0.251);
  }

  private spawnRune(event: StrEventData, runeType: RuneType): void {
    const hero = this.getSelectedHero(event.PlayerID);
    if (!hero) {
      return;
    }
    const target = hero.GetAbsOrigin().__add(hero.GetForwardVector().__mul(200));
    target.z = GetGroundHeight(target, undefined);
    CreateRune(target, runeType);
  }

  // -------------------------------------------------------------------------
  // 游戏事件
  // -------------------------------------------------------------------------

  private onHeroFinishSpawn(keys: GameEventProvidedProperties & DotaOnHeroFinishSpawnEvent): void {
    const hero = EntIndexToHScript(keys.heroindex as EntityIndex) as CDOTA_BaseNPC_Hero | undefined;
    if (!hero || hero.IsNull()) {
      return;
    }
    const playerId = hero.GetPlayerOwnerID();
    if (playerId < 0 || PlayerResource.IsFakeClient(playerId)) {
      return;
    }
    if (this.hudCreatedPlayers.has(playerId)) {
      return;
    }
    this.hudCreatedPlayers.add(playerId);
    // 为每个真人玩家单独创建调试面板 HUD。
    CustomUI.DynamicHud_Create(
      playerId,
      'AIB_HeroDebugPanel',
      'file://{resources}/layout/custom_game/eyeherodemo/eyeherodemo.xml',
      {},
    );
    this.sendSpawnHeroId(DEFAULT_SPAWN_HERO_ID);
  }

  private onNpcSpawned(keys: GameEventProvidedProperties & NpcSpawnedEvent): void {
    const unit = EntIndexToHScript(keys.entindex) as CDOTA_BaseNPC | undefined;
    if (!unit) {
      return;
    }
    const hero = unit as CDOTA_BaseNPC_Hero;
    const isRealHero: boolean = hero.IsRealHero();
    const isClone: boolean = hero.IsClone();
    const isTempestDouble: boolean = hero.IsTempestDouble();
    if (!isRealHero || isClone || isTempestDouble) {
      return;
    }

    // 调试面板生成的英雄虽与操作者共享 PlayerID，但不是玩家主英雄，
    // 不应进入面板顶部的“玩家英雄”栏，也不进编辑列表。
    if (hero.HasModifier(modifier_debug_manual_control.name)) {
      return;
    }

    const playerId = hero.GetPlayerOwnerID();

    if (playerId >= 0 && !PlayerResource.IsFakeClient(playerId)) {
      // 英雄替换时通知面板移除旧条目
      const prev = this.playerHeroEntIndex.get(playerId);
      if (prev !== undefined && prev !== keys.entindex) {
        CustomGameEventManager.Send_ServerToAllClients<{ entindex: number }>('remove_hero_entry', {
          entindex: prev,
        });
      }
      this.playerHeroEntIndex.set(playerId, keys.entindex);
      CustomGameEventManager.Send_ServerToAllClients<{ hero_id: number }>('set_player_hero_id', {
        hero_id: hero.GetHeroID(),
      });
    }

    if (keys.is_respawn === 0) {
      CustomGameEventManager.Send_ServerToAllClients<{ entindex: number }>('add_new_hero_entry', {
        entindex: keys.entindex,
      });
    }
  }

  private onItemPurchased(keys: GameEventProvidedProperties & DotaItemPurchasedEvent): void {
    const hero = this.getSelectedHero(keys.PlayerID);
    if (hero) {
      // 调试模式下返还购买金额
      hero.ModifyGold(keys.itemcost, true, ModifyGoldReason.UNSPECIFIED);
    }
  }
}
