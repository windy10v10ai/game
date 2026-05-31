import { PlayerHelper } from '../../modules/helper/player-helper';
import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

@registerModifier('modifiers/global/modifier_treasure_chest')
export class modifier_treasure_chest extends BaseModifier {
  static readonly PROXIMITY_RADIUS = 150;
  static readonly PROXIMITY_INTERVAL = 0.2;

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetDisableHealthBar(): boolean {
    return true;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.NO_HEALTH_BAR]: true,
      [ModifierState.INVULNERABLE]: true,
      [ModifierState.UNSELECTABLE]: true,
    };
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ABSOLUTE_NO_DAMAGE_MAGICAL,
      ModifierFunction.ABSOLUTE_NO_DAMAGE_PHYSICAL,
      ModifierFunction.ABSOLUTE_NO_DAMAGE_PURE,
    ];
  }

  GetAbsoluteNoDamageMagical(): 0 | 1 {
    return 1;
  }

  GetAbsoluteNoDamagePhysical(): 0 | 1 {
    return 1;
  }

  GetAbsoluteNoDamagePure(): 0 | 1 {
    return 1;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.StartIntervalThink(modifier_treasure_chest.PROXIMITY_INTERVAL);
  }

  OnIntervalThink(): void {
    const chest = this.GetParent();
    const heroes = FindUnitsInRadius(
      chest.GetTeamNumber(),
      chest.GetAbsOrigin(),
      undefined,
      modifier_treasure_chest.PROXIMITY_RADIUS,
      UnitTargetTeam.BOTH,
      UnitTargetType.HERO,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.CLOSEST,
      false,
    );
    // 只有人类玩家能触发开箱，避免 bot 路过白白消耗掉宝箱
    const opener = heroes.find((hero) => PlayerHelper.IsHumanPlayer(hero));
    if (!opener) return;
    GameRules.Treasure.openChest(chest, opener);
  }
}
