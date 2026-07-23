import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  calculateWarlockImmolationDamage,
  isOwnedWarlockInfernalCandidate,
  isWarlockImmolationDamageSpecial,
  isWarlockInfernalUnitName,
} from './warlock-awaken-math';

const PERMANENT_IMMOLATION_ABILITY = 'warlock_golem_permanent_immolation';
const AWAKEN_MODIFIER = 'modifier_special_bonus_unique_warlock_upgrade';
const INFERNAL_MODIFIER = 'modifier_special_bonus_unique_warlock_upgrade_infernal';
// 地狱火刚生成时 owner/技能可能还未就绪，挂载失败后短暂重试兜底
const INFERNAL_SPAWN_RETRY_DELAYS = [0.03, 0.1, 0.3];

/** 术士觉醒 */
@registerAbility('special_bonus_unique_warlock_upgrade')
export class SpecialBonusUniqueWarlockUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return AWAKEN_MODIFIER;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_warlock_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_warlock_upgrade extends BaseModifier {
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
    this.scanExistingInfernals();
    // 觉醒创建的同一帧内已存在的地狱火数据可能还未就绪，下一帧再补扫一次兜底
    Timers.CreateTimer(0, () => {
      if (!this.IsNull()) this.scanExistingInfernals();
    });
  }

  OnRefresh(): void {
    if (!IsServer()) return;
    this.scanExistingInfernals();
  }

  OnDestroy(): void {
    if (!IsServer()) return;

    if (this.spawnListenerId !== undefined) {
      StopListeningToGameEvent(this.spawnListenerId);
      this.spawnListenerId = undefined;
    }

    const warlock = this.GetParent();
    if (warlock.IsNull() || !warlock.IsRealHero()) return;
    this.forEachInfernal((infernal) => {
      infernal.RemoveModifierByNameAndCaster(INFERNAL_MODIFIER, warlock);
    });
  }

  private onNpcSpawned(event: GameEventProvidedProperties & NpcSpawnedEvent): void {
    const entity = EntIndexToHScript(event.entindex) as CBaseEntity | undefined;
    if (!entity || entity.IsNull() || !entity.IsBaseNPC()) return;

    const infernal = entity as CDOTA_BaseNPC;
    if (!isWarlockInfernalUnitName(infernal.GetUnitName())) return;
    if (!this.tryAttachInfernalModifier(infernal)) {
      this.retryAttachInfernalModifier(event.entindex, 0);
    }
  }

  private retryAttachInfernalModifier(entindex: EntityIndex, retryIndex: number): void {
    if (retryIndex >= INFERNAL_SPAWN_RETRY_DELAYS.length) return;

    Timers.CreateTimer(INFERNAL_SPAWN_RETRY_DELAYS[retryIndex], () => {
      if (this.IsNull()) return;

      const entity = EntIndexToHScript(entindex) as CBaseEntity | undefined;
      if (!entity || entity.IsNull() || !entity.IsBaseNPC()) return;

      const infernal = entity as CDOTA_BaseNPC;
      if (!isWarlockInfernalUnitName(infernal.GetUnitName())) return;
      if (!this.tryAttachInfernalModifier(infernal)) {
        this.retryAttachInfernalModifier(entindex, retryIndex + 1);
      }
    });
  }

  private scanExistingInfernals(): void {
    this.forEachInfernal((infernal) => this.tryAttachInfernalModifier(infernal));
  }

  private forEachInfernal(callback: (infernal: CDOTA_BaseNPC) => void): void {
    let entity = Entities.First() as CBaseEntity | undefined;
    while (entity) {
      const next = Entities.Next(entity);
      if (!entity.IsNull() && entity.IsBaseNPC()) {
        const unit = entity as CDOTA_BaseNPC;
        if (isWarlockInfernalUnitName(unit.GetUnitName())) {
          callback(unit);
        }
      }
      entity = next;
    }
  }

  private tryAttachInfernalModifier(infernal: CDOTA_BaseNPC): boolean {
    const warlock = this.GetParent();
    const awaken = this.GetAbility();
    if (
      this.IsNull() ||
      infernal.IsNull() ||
      !infernal.IsAlive() ||
      warlock.IsNull() ||
      !warlock.IsRealHero() ||
      !awaken ||
      awaken.IsNull() ||
      awaken.GetLevel() <= 0 ||
      !awaken.IsActivated()
    ) {
      return false;
    }

    const immolation = infernal.FindAbilityByName(PERMANENT_IMMOLATION_ABILITY);
    if (!this.isOwnedInfernal(infernal, warlock, immolation !== undefined)) return false;

    if (infernal.FindModifierByNameAndCaster(INFERNAL_MODIFIER, warlock)) return true;
    if (infernal.HasModifier(INFERNAL_MODIFIER)) {
      infernal.RemoveModifierByName(INFERNAL_MODIFIER);
    }

    return infernal.AddNewModifier(warlock, awaken, INFERNAL_MODIFIER, {}) !== undefined;
  }

  private isOwnedInfernal(
    infernal: CDOTA_BaseNPC,
    warlock: CDOTA_BaseNPC,
    hasPermanentImmolation: boolean,
  ): boolean {
    const owner = infernal.GetOwnerEntity() as CBaseEntity | undefined;
    const ownerEntityIndex = owner && !owner.IsNull() ? owner.GetEntityIndex() : undefined;
    const infernalPlayerId = infernal.GetPlayerOwnerID();
    const warlockPlayerId = warlock.GetPlayerOwnerID();

    return isOwnedWarlockInfernalCandidate({
      unitName: infernal.GetUnitName(),
      hasPermanentImmolation,
      ownerEntityIndex,
      warlockEntityIndex: warlock.GetEntityIndex(),
      unitPlayerOwnerId: PlayerResource.IsValidPlayerID(infernalPlayerId) ? infernalPlayerId : -1,
      warlockPlayerOwnerId: PlayerResource.IsValidPlayerID(warlockPlayerId) ? warlockPlayerId : -1,
    });
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_warlock_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_warlock_upgrade_infernal extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL,
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL_VALUE,
    ];
  }

  GetModifierOverrideAbilitySpecial(event: ModifierOverrideAbilitySpecialEvent): 0 | 1 {
    return this.shouldOverride(event) ? 1 : 0;
  }

  GetModifierOverrideAbilitySpecialValue(event: ModifierOverrideAbilitySpecialEvent): number {
    const eventAbility = event.ability;
    if (!eventAbility || eventAbility.IsNull()) return 0;

    const nativeDamage = eventAbility.GetLevelSpecialValueNoOverride(
      event.ability_special_value,
      event.ability_special_level,
    );
    if (!this.shouldOverride(event)) return nativeDamage;

    const warlock = this.GetCaster();
    const awaken = this.GetAbility();
    if (!warlock || warlock.IsNull() || !awaken || awaken.IsNull()) return nativeDamage;

    return calculateWarlockImmolationDamage(
      nativeDamage,
      warlock.GetHealthRegen(),
      warlock.GetManaRegen(),
      awaken.GetSpecialValueFor('regen_to_damage_pct'),
    );
  }

  private shouldOverride(event: ModifierOverrideAbilitySpecialEvent): boolean {
    const parent = this.GetParent();
    const warlock = this.GetCaster();
    const awaken = this.GetAbility();
    const eventAbility = event.ability;
    if (
      parent.IsNull() ||
      !warlock ||
      warlock.IsNull() ||
      !warlock.IsRealHero() ||
      !awaken ||
      awaken.IsNull() ||
      !eventAbility ||
      eventAbility.IsNull()
    ) {
      return false;
    }

    const immolation = parent.FindAbilityByName(PERMANENT_IMMOLATION_ABILITY);
    const owner = parent.GetOwnerEntity() as CBaseEntity | undefined;
    const ownerEntityIndex = owner && !owner.IsNull() ? owner.GetEntityIndex() : undefined;
    const parentPlayerId = parent.GetPlayerOwnerID();
    const warlockPlayerId = warlock.GetPlayerOwnerID();

    return (
      isOwnedWarlockInfernalCandidate({
        unitName: parent.GetUnitName(),
        hasPermanentImmolation:
          immolation !== undefined && immolation.GetEntityIndex() === eventAbility.GetEntityIndex(),
        ownerEntityIndex,
        warlockEntityIndex: warlock.GetEntityIndex(),
        unitPlayerOwnerId: PlayerResource.IsValidPlayerID(parentPlayerId) ? parentPlayerId : -1,
        warlockPlayerOwnerId: PlayerResource.IsValidPlayerID(warlockPlayerId)
          ? warlockPlayerId
          : -1,
      }) &&
      isWarlockImmolationDamageSpecial(
        eventAbility.GetAbilityName(),
        event.ability_special_value,
      ) &&
      warlock.HasModifier(AWAKEN_MODIFIER) &&
      !warlock.PassivesDisabled() &&
      awaken.GetLevel() > 0 &&
      awaken.IsActivated()
    );
  }
}
