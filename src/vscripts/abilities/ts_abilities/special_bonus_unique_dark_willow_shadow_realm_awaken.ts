import { NetTableHelper } from '../../modules/helper/net-table-helper';
import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { findHeroCreepOrBuildingInRange } from './shared/auto-cast-ability';

const SHADOW_REALM_ABILITY = 'dark_willow_shadow_realm';
const SHADOW_REALM_MODIFIER = 'modifier_dark_willow_shadow_realm_buff';
const SCEPTER_MODIFIER = 'modifier_item_ultimate_scepter';
const SCEPTER_CONSUMED_MODIFIER = 'modifier_item_ultimate_scepter_2_consumed';
const PLAYER_PROPERTY_LUA_PREFIX = 'property_';
const PLAYER_PROPERTY_DATA_DRIVEN_PREFIX = 'modifier_player_property_';
const TARGET_THINK_INTERVAL = 0.25;

interface PlayerPropertyModifier extends CDOTA_Buff {
  value?: number;
}

interface PhantomControlParams {
  persist_with_scepter?: number;
  source_entindex?: EntityIndex;
}

function hasScepterUpgrade(unit: CDOTA_BaseNPC_Hero): boolean {
  return (
    unit.HasScepter() ||
    unit.HasModifier(SCEPTER_MODIFIER) ||
    unit.HasModifier(SCEPTER_CONSUMED_MODIFIER)
  );
}

function syncAbilityState(sourceAbility: CDOTABaseAbility, phantomAbility: CDOTABaseAbility): void {
  phantomAbility.SetLevel(sourceAbility.GetLevel());
  phantomAbility.SetActivated(sourceAbility.IsActivated());

  if (sourceAbility.GetToggleState() !== phantomAbility.GetToggleState()) {
    phantomAbility.ToggleAbility();
  }
  if (sourceAbility.GetAutoCastState() !== phantomAbility.GetAutoCastState()) {
    phantomAbility.ToggleAutoCast();
  }
}

function syncExistingAbilityLevels(source: CDOTA_BaseNPC_Hero, phantom: CDOTA_BaseNPC_Hero): void {
  for (let index = 0; index < source.GetAbilityCount(); index += 1) {
    const sourceAbility = source.GetAbilityByIndex(index);
    if (!sourceAbility || sourceAbility.IsNull()) continue;

    const phantomAbility = phantom.FindAbilityByName(sourceAbility.GetAbilityName());
    if (!phantomAbility || phantomAbility.IsNull()) continue;
    syncAbilityState(sourceAbility, phantomAbility);
  }
}

function copyDraftedAbilities(source: CDOTA_BaseNPC_Hero, phantom: CDOTA_BaseNPC_Hero): void {
  const playerId = source.GetPlayerOwnerID();
  if (playerId < 0) return;

  const steamAccountId = PlayerResource.GetSteamAccountID(playerId).toString();
  const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountId);
  const draftedAbilityNames = [
    lotteryStatus.activeAbilityName,
    lotteryStatus.passiveAbilityName,
    lotteryStatus.passiveAbilityName2,
  ];

  for (const abilityName of draftedAbilityNames) {
    if (!abilityName) continue;

    const sourceAbility = source.FindAbilityByName(abilityName);
    if (!sourceAbility || sourceAbility.IsNull()) continue;

    let phantomAbility = phantom.FindAbilityByName(abilityName);
    if (!phantomAbility || phantomAbility.IsNull()) {
      phantomAbility = phantom.AddAbility(abilityName);
    }
    if (!phantomAbility || phantomAbility.IsNull()) continue;

    syncAbilityState(sourceAbility, phantomAbility);
  }
}

function copyPlayerProperties(source: CDOTA_BaseNPC_Hero, phantom: CDOTA_BaseNPC_Hero): void {
  for (const rawModifier of source.FindAllModifiers()) {
    const modifier = rawModifier as PlayerPropertyModifier;
    const modifierName = modifier.GetName();

    if (modifierName.startsWith(PLAYER_PROPERTY_LUA_PREFIX)) {
      if (modifier.value === undefined) continue;

      phantom.RemoveModifierByName(modifierName);
      phantom.AddNewModifier(phantom, undefined, modifierName, { value: modifier.value });
      continue;
    }

    if (!modifierName.startsWith(PLAYER_PROPERTY_DATA_DRIVEN_PREFIX)) continue;

    const dataDrivenAbility = modifier.GetAbility() as CDOTA_Item_DataDriven | undefined;
    if (!dataDrivenAbility || dataDrivenAbility.IsNull()) continue;

    phantom.RemoveModifierByName(modifierName);
    dataDrivenAbility.ApplyDataDrivenModifier(phantom, phantom, modifierName, { duration: -1 });
  }
}

@registerAbility('special_bonus_unique_dark_willow_shadow_realm_awaken')
export class SpecialBonusUniqueDarkWillowShadowRealmAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_dark_willow_shadow_realm_awaken.name;
  }
}

/** 邪影芳灵 影域留形觉醒。 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_dark_willow_shadow_realm_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_dark_willow_shadow_realm_awaken extends BaseModifier {
  private phantom?: CDOTA_BaseNPC_Hero;
  private spawnSerial = 0;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  AllowIllusionDuplicate(): boolean {
    return false;
  }

  GetTexture(): string {
    return SHADOW_REALM_ABILITY;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (event.unit !== parent || parent.IsIllusion()) return;
    if (event.ability.GetAbilityName() !== SHADOW_REALM_ABILITY) return;

    this.spawnSerial += 1;
    const serial = this.spawnSerial;
    this.removePhantom();

    const position = parent.GetAbsOrigin();
    const castPosition = Vector(position.x, position.y, position.z);
    const forward = parent.GetForwardVector();
    const castForward = Vector(forward.x, forward.y, forward.z);
    const duration = Math.max(0, event.ability.GetSpecialValueFor('duration'));
    if (duration <= 0) return;
    const persistWithScepter = hasScepterUpgrade(parent as CDOTA_BaseNPC_Hero);

    Timers.CreateTimer(0, () => {
      this.createPhantom(
        parent as CDOTA_BaseNPC_Hero,
        event.ability,
        castPosition,
        castForward,
        duration,
        persistWithScepter,
        serial,
      );
    });
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    this.spawnSerial += 1;
    this.removePhantom();
  }

  private createPhantom(
    source: CDOTA_BaseNPC_Hero,
    shadowRealm: CDOTABaseAbility,
    position: Vector,
    forward: Vector,
    duration: number,
    persistWithScepter: boolean,
    serial: number,
  ): void {
    if (this.IsNull() || serial !== this.spawnSerial) return;
    if (source.IsNull() || !source.IsAlive() || shadowRealm.IsNull()) return;

    const illusions = CreateIllusions(
      source,
      source,
      {
        outgoing_damage: 0,
        incoming_damage: 0,
        bounty_base: 0,
        bounty_growth: 0,
        outgoing_damage_structure: 0,
        outgoing_damage_roshan: 0,
      },
      1,
      0,
      false,
      false,
    );
    const phantom = illusions[0];
    if (!phantom || phantom.IsNull()) return;

    phantom.SetAbsOrigin(position);
    phantom.SetForwardVector(forward);
    phantom.SetIdleAcquire(false);
    phantom.SetAcquisitionRange(0);

    syncExistingAbilityLevels(source, phantom);
    copyDraftedAbilities(source, phantom);
    copyPlayerProperties(source, phantom);

    if (persistWithScepter && !phantom.HasModifier(SCEPTER_MODIFIER)) {
      phantom.AddNewModifier(phantom, undefined, SCEPTER_MODIFIER, { duration });
    }

    const phantomShadowRealmAbility = phantom.FindAbilityByName(SHADOW_REALM_ABILITY);
    if (phantomShadowRealmAbility && !phantomShadowRealmAbility.IsNull()) {
      phantom.RemoveModifierByName(SHADOW_REALM_MODIFIER);
      phantom.AddNewModifier(phantom, phantomShadowRealmAbility, SHADOW_REALM_MODIFIER, {
        duration,
      });
    }

    phantom.AddNewModifier(source, this.GetAbility(), 'modifier_kill', { duration });
    phantom.AddNewModifier(
      source,
      this.GetAbility(),
      modifier_dark_willow_shadow_realm_phantom_control.name,
      {
        duration,
        persist_with_scepter: persistWithScepter ? 1 : 0,
        source_entindex: source.GetEntityIndex(),
      },
    );
    this.phantom = phantom;
  }

  private removePhantom(): void {
    if (!this.phantom || this.phantom.IsNull()) {
      this.phantom = undefined;
      return;
    }

    UTIL_Remove(this.phantom);
    this.phantom = undefined;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_dark_willow_shadow_realm_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_dark_willow_shadow_realm_phantom_control extends BaseModifier {
  private persistWithScepter = false;
  private sourceEntityIndex?: EntityIndex;
  private firstAttackRecord?: number;
  private sourceShadowRealmObserved = false;
  private shouldRefreshAttackOrder = false;

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.ROOTED]: true,
      [ModifierState.SILENCED]: true,
      [ModifierState.MUTED]: true,
      [ModifierState.NO_UNIT_COLLISION]: true,
    };
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ATTACK_RECORD, ModifierFunction.ON_ATTACK_RECORD_DESTROY];
  }

  OnCreated(params: PhantomControlParams): void {
    this.refreshParams(params);
    if (!IsServer()) return;
    this.StartIntervalThink(TARGET_THINK_INTERVAL);
  }

  OnRefresh(params: PhantomControlParams): void {
    this.refreshParams(params);
  }

  OnAttackRecord(event: ModifierAttackEvent): void {
    if (!IsServer() || event.attacker !== this.GetParent()) return;
    if (this.firstAttackRecord !== undefined) return;
    this.firstAttackRecord = event.record;
  }

  OnAttackRecordDestroy(event: ModifierAttackEvent): void {
    if (!IsServer() || event.attacker !== this.GetParent()) return;
    if (this.persistWithScepter) {
      this.shouldRefreshAttackOrder = true;
      return;
    }
    if (event.record !== this.firstAttackRecord) return;

    UTIL_Remove(this.GetParent());
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    const phantom = this.GetParent() as CDOTA_BaseNPC_Hero;
    if (phantom.IsNull() || !phantom.IsAlive()) return;

    if (this.sourceEntityIndex !== undefined) {
      const source = EntIndexToHScript(this.sourceEntityIndex) as CDOTA_BaseNPC_Hero | undefined;
      if (!source || source.IsNull() || !source.IsAlive()) {
        UTIL_Remove(phantom);
        return;
      }
      if (this.persistWithScepter) {
        if (source.HasModifier(SHADOW_REALM_MODIFIER)) {
          this.sourceShadowRealmObserved = true;
        } else if (this.sourceShadowRealmObserved) {
          UTIL_Remove(phantom);
          return;
        }
      }
    }

    const target = findHeroCreepOrBuildingInRange(
      phantom,
      phantom.Script_GetAttackRange(),
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
    );
    if (!target) {
      this.shouldRefreshAttackOrder = false;
      if (phantom.GetAttackTarget()) phantom.Stop();
      return;
    }

    const currentTarget = phantom.GetAttackTarget();
    if (!this.shouldRefreshAttackOrder && phantom.IsAttacking() && currentTarget === target) {
      return;
    }
    this.shouldRefreshAttackOrder = false;

    ExecuteOrderFromTable({
      OrderType: UnitOrder.ATTACK_TARGET,
      UnitIndex: phantom.GetEntityIndex(),
      TargetIndex: target.GetEntityIndex(),
      Queue: false,
    });
  }

  private refreshParams(params: PhantomControlParams): void {
    this.persistWithScepter = params.persist_with_scepter === 1;
    this.sourceEntityIndex = params.source_entindex;
  }
}
