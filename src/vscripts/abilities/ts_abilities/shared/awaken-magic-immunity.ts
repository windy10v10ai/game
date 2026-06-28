/**
 * 觉醒技能加魔法免疫的 TS 实现，不顶替已有的更长魔免（真 BKB）。
 * 已有相等或更长的 modifier_black_king_bar_immune 时跳过并返回 undefined；
 * 否则施加并返回该 modifier 句柄——长时魔免须按句柄精确移除，不能凭剩余时间猜，否则误删真 BKB。
 */
export function applyAwakenMagicImmunity(
  unit: CDOTA_BaseNPC,
  ability: CDOTABaseAbility,
  duration: number,
): CDOTA_Buff | undefined {
  const existing = unit.FindModifierByName('modifier_black_king_bar_immune');
  if (existing && existing.GetRemainingTime() >= duration) {
    return undefined;
  }
  const mod = unit.AddNewModifier(unit, ability, 'modifier_black_king_bar_immune', { duration });
  unit.EmitSound('DOTA_Item.BlackKingBar.Activate');
  return mod;
}
