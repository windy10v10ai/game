import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

const BOUNDLESS_STRIKE = 'monkey_king_boundless_strike';
const DEFY_MODIFIER = 'modifier_monkey_king_defy';

@registerModifier('abilities/ts_abilities/monkey_king_defy_strike')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_monkey_king_defy_strike extends BaseModifier {
  private readonly triggeredRecords = new Set<number>();
  private readonly strikeState = { resolving: false };

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  AllowIllusionDuplicate(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ATTACK];
  }

  OnAttack(event: ModifierAttackEvent): void {
    if (!IsServer()) return;

    const caster = this.GetParent();
    const target = event.target;
    if (
      event.attacker !== caster ||
      event.no_attack_cooldown ||
      event.inflictor !== undefined ||
      this.strikeState.resolving ||
      this.triggeredRecords.has(event.record) ||
      !caster.IsAlive() ||
      !caster.HasModifier(DEFY_MODIFIER) ||
      !target ||
      target.IsNull() ||
      target.GetTeamNumber() === caster.GetTeamNumber()
    ) {
      return;
    }

    const strike = caster.FindAbilityByName(BOUNDLESS_STRIKE);
    if (!strike || strike.IsNull() || strike.IsHidden() || strike.GetLevel() === 0) return;

    this.triggeredRecords.add(event.record);
    const origin = caster.GetAbsOrigin();
    const position = target.GetAbsOrigin();
    const direction = Vector(position.x - origin.x, position.y - origin.y, 0);
    const state = this.strikeState;

    // The native strike can change attack buffs or kill targets during attack resolution.
    Timers.CreateTimer(0, () => {
      if (
        caster.IsNull() ||
        !caster.IsAlive() ||
        strike.IsNull() ||
        strike.IsHidden() ||
        strike.GetLevel() === 0 ||
        caster.FindAbilityByName(BOUNDLESS_STRIKE) !== strike
      ) {
        return;
      }

      state.resolving = true;
      strikeAt(caster, strike, position, direction);
      state.resolving = false;
    });
  }
}

function strikeAt(
  caster: CDOTA_BaseNPC,
  strike: CDOTABaseAbility,
  position: Vector,
  direction: Vector,
): void {
  const facing = caster.GetForwardVector();
  const cursor = caster.GetCursorPosition();
  const altCast = strike.GetAltCastState();

  const [ok, error] = pcall(() => {
    // Boundless Strike reads the caster's facing even with a valid cursor position.
    if (direction.Length2D() > 0) caster.SetForwardVector(direction.Normalized());
    caster.SetCursorPosition(position);
    if (altCast) strike.SetAltCastState(false);
    strike.OnSpellStart();
  });
  if (altCast && !strike.IsNull()) strike.SetAltCastState(true);
  if (!caster.IsNull()) {
    caster.SetCursorPosition(cursor);
    caster.SetForwardVector(facing);
  }

  if (!ok) print(`[monkey-king-defy] Boundless Strike failed: ${error}`);
}
