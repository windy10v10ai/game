import { Player, PlayerProperty } from '../../api/player';
import {
  addAbilityToDynamicSlot,
  moveAbilityToDynamicSlot,
} from '../../modules/lottery/ability/ability-slot';
import { PropertyController } from '../../modules/property/property_controller';
import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  buildInheritedAbilityRuntimeSignature,
  buildLoneDruidBearInheritanceSignature,
  calculateInheritedAbilityDiff,
  collectInheritableAbilities,
  InheritedAbilitySnapshot,
  isLoneDruidSpiritBearUnitName,
  LONE_DRUID_BEAR_INHERITANCE_MODIFIER,
  isOwnedLoneDruidSpiritBearCandidate,
} from './lone-druid-bear-inheritance';

const AWAKEN_MODIFIER = 'modifier_special_bonus_unique_lone_druid_upgrade';
const BEAR_MODIFIER = LONE_DRUID_BEAR_INHERITANCE_MODIFIER;
const BEAR_SPAWN_RETRY_DELAYS = [0.03, 0.1, 0.3];

@registerAbility('special_bonus_unique_lone_druid_upgrade')
export class SpecialBonusUniqueLoneDruidUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return AWAKEN_MODIFIER;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_lone_druid_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_lone_druid_upgrade extends BaseModifier {
  private spawnListenerId: EventListenerID | undefined;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.spawnListenerId = ListenToGameEvent(
      'npc_spawned',
      (event) => this.onNpcSpawned(event),
      this,
    );
    this.scanExistingBears();
    Timers.CreateTimer(0, () => {
      if (!this.IsNull()) this.scanExistingBears();
    });
  }

  OnRefresh(): void {
    if (IsServer()) this.scanExistingBears();
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    if (this.spawnListenerId !== undefined) {
      StopListeningToGameEvent(this.spawnListenerId);
      this.spawnListenerId = undefined;
    }

    const druid = this.GetParent();
    if (druid.IsNull()) return;
    this.forEachSpiritBear((bear) => bear.RemoveModifierByNameAndCaster(BEAR_MODIFIER, druid));
  }

  private onNpcSpawned(event: GameEventProvidedProperties & NpcSpawnedEvent): void {
    const entity = EntIndexToHScript(event.entindex) as CBaseEntity | undefined;
    if (!entity || entity.IsNull() || !entity.IsBaseNPC()) return;
    const bear = entity as CDOTA_BaseNPC;
    if (!isLoneDruidSpiritBearUnitName(bear.GetUnitName())) return;
    if (!this.tryAttachBearModifier(bear)) this.retryAttachBearModifier(event.entindex, 0);
  }

  private retryAttachBearModifier(entindex: EntityIndex, retryIndex: number): void {
    if (retryIndex >= BEAR_SPAWN_RETRY_DELAYS.length) return;
    Timers.CreateTimer(BEAR_SPAWN_RETRY_DELAYS[retryIndex], () => {
      if (this.IsNull()) return;
      const entity = EntIndexToHScript(entindex) as CBaseEntity | undefined;
      if (!entity || entity.IsNull() || !entity.IsBaseNPC()) return;
      const bear = entity as CDOTA_BaseNPC;
      if (!isLoneDruidSpiritBearUnitName(bear.GetUnitName())) return;
      if (!this.tryAttachBearModifier(bear)) this.retryAttachBearModifier(entindex, retryIndex + 1);
    });
  }

  private scanExistingBears(): void {
    this.forEachSpiritBear((bear) => this.tryAttachBearModifier(bear));
  }

  private forEachSpiritBear(callback: (bear: CDOTA_BaseNPC) => void): void {
    let entity = Entities.First() as CBaseEntity | undefined;
    while (entity) {
      const next = Entities.Next(entity);
      if (!entity.IsNull() && entity.IsBaseNPC()) {
        const unit = entity as CDOTA_BaseNPC;
        if (isLoneDruidSpiritBearUnitName(unit.GetUnitName())) callback(unit);
      }
      entity = next;
    }
  }

  private tryAttachBearModifier(bear: CDOTA_BaseNPC): boolean {
    const druid = this.GetParent();
    const awaken = this.GetAbility();
    if (
      this.IsNull() ||
      bear.IsNull() ||
      !bear.IsAlive() ||
      druid.IsNull() ||
      !druid.IsRealHero() ||
      !awaken ||
      awaken.IsNull() ||
      awaken.GetLevel() <= 0 ||
      !awaken.IsActivated() ||
      !this.isOwnedBear(bear, druid)
    ) {
      return false;
    }

    if (bear.FindModifierByNameAndCaster(BEAR_MODIFIER, druid)) return true;
    if (bear.HasModifier(BEAR_MODIFIER)) bear.RemoveModifierByName(BEAR_MODIFIER);
    return bear.AddNewModifier(druid, awaken, BEAR_MODIFIER, {}) !== undefined;
  }

  private isOwnedBear(bear: CDOTA_BaseNPC, druid: CDOTA_BaseNPC): boolean {
    const owner = bear.GetOwnerEntity() as CBaseEntity | undefined;
    const ownerEntityIndex = owner && !owner.IsNull() ? owner.GetEntityIndex() : undefined;
    const bearPlayerId = bear.GetPlayerOwnerID();
    const druidPlayerId = druid.GetPlayerOwnerID();
    return isOwnedLoneDruidSpiritBearCandidate({
      unitName: bear.GetUnitName(),
      ownerEntityIndex,
      ownerIsBaseNpc: owner !== undefined && !owner.IsNull() && owner.IsBaseNPC(),
      druidEntityIndex: druid.GetEntityIndex(),
      unitPlayerOwnerId: PlayerResource.IsValidPlayerID(bearPlayerId) ? bearPlayerId : -1,
      druidPlayerOwnerId: PlayerResource.IsValidPlayerID(druidPlayerId) ? druidPlayerId : -1,
      unitTeam: bear.GetTeamNumber(),
      druidTeam: druid.GetTeamNumber(),
    });
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_lone_druid_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_lone_druid_upgrade_bear extends BaseModifier {
  private signature = '';
  private bonusSkillPointLedgerKey = '';
  private inheritedAbilityLedger: Record<string, number> = {};

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.bonusSkillPointLedgerKey = `lone-druid-bear:${this.GetParent().GetEntityIndex()}`;
    this.syncInheritance();
    const ability = this.GetAbility();
    this.StartIntervalThink(ability ? ability.GetSpecialValueFor('sync_interval') : 1);
  }

  OnIntervalThink(): void {
    this.syncInheritance();
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    const bear = this.GetParent();
    if (bear.IsNull()) {
      PropertyController.ForgetBonusSkillPointLedger(this.bonusSkillPointLedgerKey);
      return;
    }
    PropertyController.RemoveAllPlayerPropertyFromUnit(bear);
    PropertyController.SyncBonusSkillPointsToUnit(bear, 0, this.bonusSkillPointLedgerKey);
    for (const abilityName of Object.keys(this.inheritedAbilityLedger)) {
      bear.RemoveAbility(abilityName);
    }
    this.inheritedAbilityLedger = {};
  }

  private syncInheritance(): void {
    const bear = this.GetParent();
    const druid = this.GetCaster();
    if (!druid || druid.IsNull() || !druid.IsRealHero() || bear.IsNull() || !bear.IsAlive()) return;

    const playerId = druid.GetPlayerOwnerID();
    if (!PlayerResource.IsValidPlayerID(playerId)) return;
    const steamId = PlayerResource.GetSteamAccountID(playerId);
    const properties = Player.playerInfoMap.get(steamId.toString())?.properties ?? [];
    const abilities = collectInheritableAbilities(this.getDruidAbilities(druid));
    const skillPointProperty = properties.find(
      (property) => property.name === 'property_skill_points_bonus',
    );
    const playerPropertiesEnabled = GameRules.Option.enablePlayerAttribute;
    const bonusSkillPoints =
      playerPropertiesEnabled && skillPointProperty
        ? PropertyController.GetBonusSkillPointCount(druid, skillPointProperty)
        : 0;
    const sourceSignature = `${buildLoneDruidBearInheritanceSignature(
      druid.GetLevel(),
      properties,
      abilities,
      bonusSkillPoints,
    )}|${playerPropertiesEnabled ? 1 : 0}`;
    this.ensureInheritedAbilitySlots(bear, abilities);
    const actualAbilityLevels = this.getBearAbilityLevels(bear, abilities);
    const signature = `${sourceSignature}|${buildInheritedAbilityRuntimeSignature(
      abilities,
      actualAbilityLevels,
    )}`;
    if (signature === this.signature) return;

    PropertyController.RemoveAllPlayerPropertyFromUnit(bear);
    for (const property of properties) {
      PropertyController.ApplyPlayerPropertyToUnit(
        druid,
        bear,
        property as PlayerProperty,
        this.bonusSkillPointLedgerKey,
      );
    }
    PropertyController.SyncBonusSkillPointsToUnit(
      bear,
      bonusSkillPoints,
      this.bonusSkillPointLedgerKey,
    );
    this.SetStackCount(bonusSkillPoints);
    this.syncAbilities(bear, abilities, actualAbilityLevels);
    this.signature = `${sourceSignature}|${buildInheritedAbilityRuntimeSignature(
      abilities,
      this.getBearAbilityLevels(bear, abilities),
    )}`;
  }

  private getDruidAbilities(druid: CDOTA_BaseNPC): InheritedAbilitySnapshot[] {
    const abilities: InheritedAbilitySnapshot[] = [];
    for (let index = 0; index < druid.GetAbilityCount(); index += 1) {
      const ability = druid.GetAbilityByIndex(index);
      if (!ability || ability.IsNull()) continue;
      abilities.push({ name: ability.GetAbilityName(), level: ability.GetLevel() });
    }
    return abilities;
  }

  private ensureInheritedAbilitySlots(
    bear: CDOTA_BaseNPC,
    desired: InheritedAbilitySnapshot[],
  ): void {
    for (const snapshot of desired) {
      const ability = bear.FindAbilityByName(snapshot.name);
      if (ability && !ability.IsNull()) moveAbilityToDynamicSlot(bear, ability);
    }
  }

  private getBearAbilityLevels(
    bear: CDOTA_BaseNPC,
    desired: InheritedAbilitySnapshot[],
  ): Record<string, number | undefined> {
    const levels: Record<string, number | undefined> = {};
    for (const snapshot of desired) {
      const ability = bear.FindAbilityByName(snapshot.name);
      levels[snapshot.name] = ability && !ability.IsNull() ? ability.GetLevel() : undefined;
    }
    return levels;
  }

  private syncAbilities(
    bear: CDOTA_BaseNPC,
    desired: InheritedAbilitySnapshot[],
    actualAbilityLevels: Record<string, number | undefined>,
  ): void {
    const diff = calculateInheritedAbilityDiff(
      desired,
      this.inheritedAbilityLedger,
      actualAbilityLevels,
    );
    for (const abilityName of diff.remove) {
      bear.RemoveAbility(abilityName);
      delete this.inheritedAbilityLedger[abilityName];
    }
    for (const snapshot of diff.add) {
      const existing = bear.FindAbilityByName(snapshot.name);
      if (existing && !existing.IsNull()) {
        existing.SetLevel(snapshot.level);
        continue;
      }
      const added = addAbilityToDynamicSlot(bear, snapshot.name);
      if (!added || added.IsNull()) continue;
      added.SetLevel(snapshot.level);
      this.inheritedAbilityLedger[snapshot.name] = snapshot.level;
    }
    for (const snapshot of diff.update) {
      const inherited = bear.FindAbilityByName(snapshot.name);
      if (!inherited || inherited.IsNull()) {
        const restored = addAbilityToDynamicSlot(bear, snapshot.name);
        if (!restored || restored.IsNull()) continue;
        restored.SetLevel(snapshot.level);
      } else {
        inherited.SetLevel(snapshot.level);
      }
      this.inheritedAbilityLedger[snapshot.name] = snapshot.level;
    }
  }
}
