/** 觉醒自动施法壳技能：左键与快捷键点击只翻转自动施法开关，不产生施法事件。 */
const AUTOCAST_SHELL_ABILITIES = [
  'legion_commander_auto_duel',
  'axe_auto_culling_blade',
  'special_bonus_unique_zuus_upgrade',
  'special_bonus_unique_bristleback_upgrade',
  'special_bonus_unique_skywrath_upgrade',
];

/** 命中壳技能的点击命令时翻转自动施法并返回 true，调用方应丢弃该命令。 */
export function interceptAutoCastShellClick(args: ExecuteOrderFilterEvent): boolean {
  if (args.order_type !== UnitOrder.CAST_NO_TARGET || !args.entindex_ability) return false;

  const ability = EntIndexToHScript(args.entindex_ability) as CDOTABaseAbility | undefined;
  if (!ability || !AUTOCAST_SHELL_ABILITIES.includes(ability.GetAbilityName())) return false;

  ability.ToggleAutoCast();
  return true;
}
