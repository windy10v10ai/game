import { ApiClient, HttpMethod } from './api-client';
import { GamePresetCustomOptions, Player, PlayerSetting } from './player';

export class PlayerSettingApi {
  constructor() {
    // 发送快捷键设置
    CustomGameEventManager.RegisterListener<SaveBindAbilityKeyEventData>(
      'save_bind_ability_key',
      (_, event) => this.SendBindAbilityKey(event),
    );
  }

  private SendBindAbilityKey(
    event: NetworkedData<SaveBindAbilityKeyEventData & { PlayerID: PlayerID }>,
  ) {
    const steamId = PlayerResource.GetSteamAccountID(event.PlayerID);
    const playerSetting: PlayerSetting = {
      isRememberAbilityKey: event.isRememberAbilityKey === 1,
      activeAbilityKey: event.activeAbilityKey,
      passiveAbilityKey: event.passiveAbilityKey,
      passiveAbilityKey2: event.passiveAbilityKey2,
      activeAbilityQuickCast: event.activeAbilityQuickCast === 1,
      passiveAbilityQuickCast: event.passiveAbilityQuickCast === 1,
      passiveAbilityQuickCast2: event.passiveAbilityQuickCast2 === 1,
      wardObserverKey: event.wardObserverKey,
      wardObserverQuickCast: event.wardObserverQuickCast === 1,
      wardSentryKey: event.wardSentryKey,
      wardSentryQuickCast: event.wardSentryQuickCast === 1,
    };

    ApiClient.sendWithRetry({
      method: HttpMethod.PUT,
      path: `/player/${steamId}/setting`,
      body: playerSetting,
      successFunc: (data: string) => {
        const updatedSetting = json.decode(data)[0] as PlayerSetting;
        Player.MergePlayerInfo({ id: steamId.toString(), playerSetting: updatedSetting });
      },
    });
  }
}

/**
 * 按地图记住/清除玩家游戏预设：意图由客户端事件传入，持久化延到 PRE_GAME。
 * 与 /game/start 基线比对，内容无变化则不发请求，尽量减少 firebase 写。
 */
export class PlayerGamePresetApi {
  private rememberIntent = new Map<PlayerID, boolean>();

  constructor() {
    CustomGameEventManager.RegisterListener<SaveGamePresetEventData>(
      'save_game_preset',
      (_, event) => this.OnRememberIntent(event),
    );
    ListenToGameEvent(
      'game_rules_state_change',
      () => {
        if (GameRules.State_Get() === GameState.PRE_GAME) {
          this.FlushPresets();
        }
      },
      undefined,
    );
  }

  private OnRememberIntent(event: NetworkedData<SaveGamePresetEventData & { PlayerID: PlayerID }>) {
    this.rememberIntent.set(event.PlayerID, event.remember === 1);
  }

  private FlushPresets() {
    const mapName = GetMapName();
    this.rememberIntent.forEach((remember, playerId) => {
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      // 已存基线，用于去重
      const baseline = Player.playerInfoMap.get(steamId.toString())?.playerSetting;

      if (!remember) {
        // 原本没存过就不发清除
        if (this.HasMapSlot(baseline, mapName)) {
          this.SendPreset(steamId, { map: mapName, remember: false });
        }
        return;
      }

      if (mapName === 'custom') {
        const newOptions = this.BuildCustomOptions();
        if (this.CustomOptionsEqual(baseline?.gamePresetCustom?.gameOptions, newOptions)) return;
        this.SendPreset(steamId, { map: mapName, remember: true, gameOptions: newOptions });
      } else {
        const choice = CustomNetTables.GetTableValue('difficulty_choice', playerId.toString());
        if (choice === undefined) return;
        const oldDifficulty =
          mapName === 'dota'
            ? baseline?.gamePresetDota?.difficulty
            : baseline?.gamePresetHard?.difficulty;
        if (oldDifficulty === choice.difficulty) return;
        this.SendPreset(steamId, { map: mapName, remember: true, difficulty: choice.difficulty });
      }
    });
    this.rememberIntent.clear();
  }

  private HasMapSlot(setting: PlayerSetting | undefined, mapName: string): boolean {
    if (!setting) return false;
    if (mapName === 'custom') return setting.gamePresetCustom !== undefined;
    if (mapName === 'dota') return setting.gamePresetDota !== undefined;
    if (mapName === 'hard') return setting.gamePresetHard !== undefined;
    return false;
  }

  private CustomOptionsEqual(
    a: GamePresetCustomOptions | undefined,
    b: GamePresetCustomOptions,
  ): boolean {
    if (!a) return false;
    return (
      a.multiplierRadiant === b.multiplierRadiant &&
      a.multiplierDire === b.multiplierDire &&
      a.playerNumberRadiant === b.playerNumberRadiant &&
      a.playerNumberDire === b.playerNumberDire &&
      a.towerPowerPct === b.towerPowerPct &&
      a.respawnTimePct === b.respawnTimePct &&
      a.startingGoldPlayer === b.startingGoldPlayer &&
      a.startingGoldBot === b.startingGoldBot &&
      a.maxLevel === b.maxLevel &&
      a.fixedAbility === b.fixedAbility &&
      a.forceRandomHero === b.forceRandomHero &&
      a.enablePlayerAttribute === b.enablePlayerAttribute &&
      a.midOnlyMode === b.midOnlyMode
    );
  }

  private BuildCustomOptions(): GamePresetCustomOptions {
    const o = GameRules.Option;
    return {
      multiplierRadiant: o.radiantGoldXpMultiplier,
      multiplierDire: o.direGoldXpMultiplier,
      playerNumberRadiant: o.radiantPlayerNumber,
      playerNumberDire: o.direPlayerNumber,
      towerPowerPct: o.towerPower,
      respawnTimePct: o.respawnTimePercentage,
      startingGoldPlayer: o.startingGoldPlayer,
      startingGoldBot: o.startingGoldBot,
      maxLevel: o.maxLevel,
      fixedAbility: o.fixedAbility,
      forceRandomHero: o.forceRandomHero ? 1 : 0,
      enablePlayerAttribute: o.enablePlayerAttribute ? 1 : 0,
      midOnlyMode: o.midOnlyMode ? 1 : 0,
    };
  }

  private SendPreset(steamId: number, body: object) {
    ApiClient.sendWithRetry({
      method: HttpMethod.PUT,
      path: `/player/${steamId}/game-preset`,
      body,
      successFunc: () => {},
    });
  }
}
