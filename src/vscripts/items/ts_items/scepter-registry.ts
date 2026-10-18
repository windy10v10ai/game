/**
 * 每个单位身上的法杖被动登记表，只让系数最高的一件按智力给技能增强。
 * 带 @registerModifier 的文件在引擎创建 modifier 时会重新执行，登记表放在那里会分裂成多份，所以单独成文件。
 */
export interface ScepterPassive {
  readonly ampPerInt: number;
  SetEffective(effective: boolean): void;
}

const byUnit = new Map<EntityIndex, ScepterPassive[]>();

export function AddScepterPassive(unit: EntityIndex, passive: ScepterPassive): void {
  let passives = byUnit.get(unit);
  if (passives === undefined) {
    passives = [];
    byUnit.set(unit, passives);
  }
  passives.push(passive);
  pickEffective(passives);
}

export function RemoveScepterPassive(unit: EntityIndex, passive: ScepterPassive): void {
  const passives = byUnit.get(unit);
  if (passives === undefined) return;
  const index = passives.indexOf(passive);
  if (index >= 0) passives.splice(index, 1);
  if (passives.length === 0) {
    byUnit.delete(unit);
    return;
  }
  pickEffective(passives);
}

// 系数相同时先登记的生效
function pickEffective(passives: ScepterPassive[]): void {
  let best = passives[0];
  for (const passive of passives) {
    if (passive.ampPerInt > best.ampPerInt) best = passive;
  }
  for (const passive of passives) {
    passive.SetEffective(passive === best);
  }
}
