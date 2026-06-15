import { BaseAbility, BaseModifier, registerModifier } from '../../../utils/dota_ts_adapter';

/**
 * autocast 自动施放类技能的共享骨架：autocast 开关读取 + 低频 think。
 * 子类只实现 OnAutoCastThink（找目标 + 施放），骨架/施法距离/瞬发施放全复用。
 */
export abstract class AutoCastAbility extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return 'modifier_autocast_think';
  }

  getThinkInterval(): number {
    return 0.3;
  }

  abstract OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void;
}

@registerModifier('abilities/ts_abilities/shared/auto-cast-ability')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_autocast_think extends BaseModifier {
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
    const ability = this.GetAbility() as unknown as AutoCastAbility;
    this.StartIntervalThink(ability.getThinkInterval());
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    const caster = this.GetParent();
    if (!caster.IsAlive()) return;
    // 玩家正在持续释放（TP 等）时不抢操作，避免打断
    if (caster.IsChanneling()) return;
    const ability = this.GetAbility() as unknown as AutoCastAbility;
    if (!ability.GetAutoCastState()) return;
    ability.OnAutoCastThink(caster as CDOTA_BaseNPC_Hero);
  }
}

/** 技能的有效施法距离 = KV cast range + 施法者施法距离增强。 */
export function getFullCastRange(caster: CDOTA_BaseNPC, ability: CDOTABaseAbility): number {
  return ability.GetCastRange(caster.GetAbsOrigin(), undefined) + caster.GetCastRangeBonus();
}

/** 在 range 内找敌方单位（最近优先）。始终排除迷雾外/隐身单位；allowMagicImmune 时额外可命中魔免单位（如淘汰之刃）。 */
export function findEnemiesInRange(
  caster: CDOTA_BaseNPC,
  range: number,
  targetType: UnitTargetType,
  allowMagicImmune = false,
): CDOTA_BaseNPC[] {
  let flags = UnitTargetFlags.FOW_VISIBLE + UnitTargetFlags.NO_INVIS;
  if (allowMagicImmune) {
    flags = flags + UnitTargetFlags.MAGIC_IMMUNE_ENEMIES;
  }
  return FindUnitsInRadius(
    caster.GetTeamNumber(),
    caster.GetAbsOrigin(),
    undefined,
    range,
    UnitTargetTeam.ENEMY,
    targetType,
    flags,
    FindOrder.CLOSEST,
    false,
  );
}

/** 瞬发施放（不抢玩家操作）；ability / target 须有效。 */
export function castImmediatelyOnTarget(
  caster: CDOTA_BaseNPC,
  ability: CDOTABaseAbility,
  target: CDOTA_BaseNPC,
): void {
  caster.SetCursorCastTarget(target);
  caster.CastAbilityImmediately(ability, caster.GetPlayerOwnerID());
  caster.SetCursorCastTarget(undefined);
}
