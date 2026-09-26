import { registerAbilitySpecsAToD } from './index-a-d';
import { registerAbilitySpecsEToL } from './index-e-l';
import { registerAbilitySpecsMToR } from './index-m-r';
import { registerAbilitySpecsSToZ } from './index-s-z';

/**
 * 技能 AI spec 聚合注册入口。
 *
 * 一个技能一个文件，不区分原生/lottery —— 技能就是技能，spec 跟着技能走。
 * 每个 import 在 Lua 里都是顶层局部变量，单文件超过 200 个会加载失败，所以按技能名首字母分文件注册。
 *
 * 不同技能之间的注册顺序不影响施放：同一英雄的多个技能由 dispatcher 按槽位顺序遍历；
 * 同名技能多条 spec 按各 SPECS 数组内顺序逐条尝试。
 */
export function registerAbilitySpecs(): void {
  registerAbilitySpecsAToD();
  registerAbilitySpecsEToL();
  registerAbilitySpecsMToR();
  registerAbilitySpecsSToZ();
}
