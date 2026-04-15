import { BaseItem, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

/**
 * Pure bonus calculator — extracted for unit testing.
 * Returns the hero-kill gold bonus for this item (floor of 5%).
 */
export function calculateProsperityBonus(gold: number): number {
  return Math.floor(gold * 0.05);
}

@registerAbility('item_hand_of_prosperity')
export class ItemHandOfProsperity extends BaseItem {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_hand_of_prosperity';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
    const target = this.GetCursorTarget();
    if (!caster || !target) return;

    const targetPos = target.GetAbsOrigin();
    const selfXp = this.GetSpecialValueFor('self_xp');
    const selfGold = this.GetSpecialValueFor('self_gold');
    const groupXp = this.GetSpecialValueFor('group_xp');
    const groupGold = this.GetSpecialValueFor('group_gold');
    const casterPlayerID = caster.GetPlayerOwnerID();

    // Midas particle
    const pfx = ParticleManager.CreateParticle(
      'particles/items2_fx/hand_of_midas.vpcf',
      ParticleAttachment.ABSORIGIN,
      target,
    );
    ParticleManager.SetParticleControl(pfx, 0, targetPos);
    ParticleManager.SetParticleControl(pfx, 1, targetPos);
    ParticleManager.ReleaseParticleIndex(pfx);

    // Transmute
    target.Kill(this, caster);
    caster.EmitSound('DOTA_Item.Hand_Of_Midas');

    const goldMul = AIGameMode.GetPlayerGoldXpMultiplier(casterPlayerID);
    caster.ModifyGold(selfGold, true, ModifyGoldReason.CREEP_KILL);

    // IsTempestDouble is a type-predicate so we check via a base-typed alias
    // to avoid TypeScript narrowing `caster` to `never` in the else branch.
    const casterNPC: CDOTA_BaseNPC = caster;
    if (!casterNPC.IsTempestDouble()) {
      caster.AddExperience(
        target.GetDeathXP() * selfXp * goldMul,
        ModifyXpReason.CREEP_KILL,
        false,
        false,
      );
    }
    SendOverheadEventMessage(
      caster.GetPlayerOwner(),
      OverheadAlert.GOLD,
      target,
      selfGold * goldMul,
      undefined,
    );

    // Team bonus — allies within group_range
    const selfPos = caster.GetAbsOrigin();
    const teammates = FindUnitsInRadius(
      caster.GetTeamNumber(),
      selfPos,
      undefined,
      this.GetSpecialValueFor('group_range'),
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO,
      UnitTargetFlags.NOT_ILLUSIONS,
      FindOrder.ANY,
      false,
    );

    for (const teammate of teammates) {
      const teammateHero = teammate as CDOTA_BaseNPC_Hero;
      const teammateNPC: CDOTA_BaseNPC = teammate;
      if (
        teammateHero.GetPlayerOwnerID() !== casterPlayerID &&
        teammateHero.IsRealHero() &&
        !teammateNPC.IsTempestDouble()
      ) {
        const teammatePlayerID = teammateHero.GetPlayerOwnerID();
        const teammateMul = AIGameMode.GetPlayerGoldXpMultiplier(teammatePlayerID);
        teammateHero.EmitSound('DOTA_Item.Hand_Of_Midas');
        teammateHero.ModifyGold(groupGold, true, ModifyGoldReason.CREEP_KILL);
        teammateHero.AddExperience(
          target.GetDeathXP() * groupXp * teammateMul,
          ModifyXpReason.CREEP_KILL,
          false,
          false,
        );
        SendOverheadEventMessage(
          teammateHero.GetPlayerOwner(),
          OverheadAlert.GOLD,
          teammateHero,
          groupGold * teammateMul,
          undefined,
        );
      }
    }

    // Spend a charge — `this` is already the item
    this.SpendCharge(1);
  }
}

@registerModifier('items/ts_items/item_hand_of_prosperity', 'modifier_item_hand_of_prosperity')
export class ModifierItemHandOfProsperity extends BaseItemModifier {
  override statsModifierName: string = '';

  private listenHandle?: EventListenerID;

  OnCreated(): void {
    super.OnCreated();
    if (IsServer()) {
      this.listenHandle = ListenToGameEvent(
        'entity_killed',
        (keys) => this.onEntityKilled(keys),
        this,
      );
    }
  }

  OnDestroy(): void {
    super.OnDestroy();
    if (IsServer() && this.listenHandle !== undefined) {
      StopListeningToGameEvent(this.listenHandle);
      this.listenHandle = undefined;
    }
  }

  private onEntityKilled(keys: GameEventProvidedProperties & EntityKilledEvent): void {
    if (!keys.entindex_killed || !keys.entindex_attacker) return;

    const killedUnit = EntIndexToHScript(keys.entindex_killed) as CDOTA_BaseNPC | undefined;
    if (!killedUnit?.IsRealHero()) return;

    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
    if (!caster) return;

    const attacker = EntIndexToHScript(keys.entindex_attacker) as CDOTA_BaseNPC | undefined;
    if (!attacker) return;

    const ownerID = caster.GetPlayerOwnerID();
    const attackerOwnerID = attacker.GetPlayerOwnerID();

    const isKiller = attackerOwnerID === ownerID;

    // For assists: must be on the killing team, alive, and within 1400 units of the kill
    const ASSIST_RANGE = 1400;
    const isAssist =
      !isKiller &&
      attacker.GetTeamNumber() === caster.GetTeamNumber() &&
      caster.IsAlive() &&
      ((killedUnit.GetAbsOrigin() - caster.GetAbsOrigin()) as Vector).Length2D() <= ASSIST_RANGE;

    if (!isKiller && !isAssist) return;

    const bounty = (killedUnit as CDOTA_BaseNPC_Hero).GetGoldBounty();
    const bonus = calculateProsperityBonus(bounty);
    if (bonus <= 0) return;

    caster.ModifyGold(bonus, true, ModifyGoldReason.UNSPECIFIED);
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT];
  }

  GetModifierAttackSpeedBonus_Constant(): number {
    return this.GetAbility()?.GetSpecialValueFor('attack_speed') ?? 0;
  }
}
