import { HeroUtil } from '../../../ai/hero/hero-util';
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
    return 0.5;
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
    if (HeroUtil.NotActionable(caster) || caster.IsSilenced()) return;
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

/** 在 range 内找敌方单位（最近优先）。始终排除迷雾外/隐身单位；extraFlags 可叠加额外过滤（如魔免单位可命中、排除幻象）。 */
export function findEnemiesInRange(
  caster: CDOTA_BaseNPC,
  range: number,
  targetType: UnitTargetType,
  extraFlags: UnitTargetFlags = UnitTargetFlags.NONE,
): CDOTA_BaseNPC[] {
  const flags = UnitTargetFlags.FOW_VISIBLE + UnitTargetFlags.NO_INVIS + extraFlags;
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

/** 英雄优先、无英雄时退而取最近的小兵。 */
export function findHeroOrCreepInRange(
  caster: CDOTA_BaseNPC,
  range: number,
  extraFlags: UnitTargetFlags = UnitTargetFlags.NONE,
  isExcluded: (unit: CDOTA_BaseNPC) => boolean = () => false,
): CDOTA_BaseNPC | undefined {
  const enemies = findEnemiesInRange(
    caster,
    range,
    UnitTargetType.HERO + UnitTargetType.BASIC,
    extraFlags,
  ).filter((enemy) => !isExcluded(enemy));
  return enemies.find((enemy) => enemy.IsHero()) ?? enemies[0];
}

/** 英雄优先；allowCreep 为 false 时只考虑英雄，不退而取小兵。 */
export function findAutoCastTarget(
  caster: CDOTA_BaseNPC,
  range: number,
  allowCreep: boolean,
  extraFlags: UnitTargetFlags = UnitTargetFlags.NONE,
  isExcluded: (unit: CDOTA_BaseNPC) => boolean = () => false,
): CDOTA_BaseNPC | undefined {
  if (allowCreep) return findHeroOrCreepInRange(caster, range, extraFlags, isExcluded);
  return findEnemiesInRange(caster, range, UnitTargetType.HERO, extraFlags).find(
    (enemy) => !isExcluded(enemy),
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

const LOTUS_MODIFIER = 'modifier_item_lotus_orb_active';
const MIRROR_SHIELD = 'item_mirror_shield';

/** 目标是否会反弹指向性技能（莲花球生效中，或中立栏里的镜盾已就绪）。只有指向性、被反弹有副作用的自动施放才调用。 */
export function willReflect(target: CDOTA_BaseNPC): boolean {
  if (target.HasModifier(LOTUS_MODIFIER)) return true;
  return [InventorySlot.NEUTRAL_ACTIVE_SLOT, InventorySlot.NEUTRAL_PASSIVE_SLOT].some((slot) => {
    const item = target.GetItemInSlot(slot);
    return item !== undefined && item.GetAbilityName() === MIRROR_SHIELD && item.IsCooldownReady();
  });
}

/** 先消耗目标的法术吸收（林肯），避免后续自动施放被格挡。 */
export function breakSpellAbsorb(target: CDOTA_BaseNPC, ability: CDOTABaseAbility): void {
  target.TriggerSpellAbsorb(ability);
}
