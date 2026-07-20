import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { PlayerHelper } from '../../modules/helper/player-helper';

const WATCHER_MODIFIER_NAME = 'modifier_fountain_anti_camp_watcher';
const LOCK_MODIFIER_NAME = 'modifier_fountain_anti_camp_lock';
const POLL_INTERVAL = 0.25;
const LOCK_DURATION = 0.75;
const LOCKED_MOVE_SPEED = 400;

@registerAbility('ability_fountain_anti_camp')
export class AbilityFountainAntiCamp extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return WATCHER_MODIFIER_NAME;
  }
}

@registerModifier('abilities/ts_abilities/fountain_anti_camp')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_fountain_anti_camp_watcher extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.StartIntervalThink(POLL_INTERVAL);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    const fountain = this.GetParent();
    const ability = this.GetAbility();
    const enemies = FindUnitsInRadius(
      fountain.GetTeamNumber(),
      fountain.GetAbsOrigin(),
      undefined,
      fountain.Script_GetAttackRange(),
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.ANY,
      false,
    );

    for (const hero of enemies) {
      if (!hero.IsRealHero() || !PlayerHelper.IsHumanPlayer(hero)) continue;
      hero.AddNewModifier(fountain, ability, LOCK_MODIFIER_NAME, { duration: LOCK_DURATION });
    }
  }
}

@registerModifier('abilities/ts_abilities/fountain_anti_camp')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_fountain_anti_camp_lock extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'shadow_shaman_shackles';
  }

  OnCreated(): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    parent.Purge(true, false, false, false, false);
    parent.RemoveModifierByName('modifier_black_king_bar_immune');
    parent.RemoveModifierByName('modifier_item_beast_shield_active');
    parent.RemoveModifierByName('modifier_item_withered_spring_active');
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.MUTED]: true,
      [ModifierState.SILENCED]: true,
      [ModifierState.PASSIVES_DISABLED]: true,
    };
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.DISABLE_HEALING,
      ModifierFunction.DISABLE_MANA_GAIN,
      ModifierFunction.MOVESPEED_ABSOLUTE,
    ];
  }

  GetDisableHealing(): 0 | 1 {
    return 1;
  }

  GetDisableManaGain(): number {
    return 1;
  }

  GetModifierMoveSpeed_Absolute(): number {
    return LOCKED_MOVE_SPEED;
  }
}
