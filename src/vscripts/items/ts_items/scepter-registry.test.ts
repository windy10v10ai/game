import { AddScepterPassive, RemoveScepterPassive, ScepterPassive } from './scepter-registry';

function passive(ampPerInt: number): ScepterPassive & { effective: boolean } {
  return {
    ampPerInt,
    effective: false,
    SetEffective(effective: boolean) {
      this.effective = effective;
    },
  };
}

describe('scepter registry', () => {
  const unit = 1 as EntityIndex;

  it('only the highest coefficient is effective', () => {
    const low = passive(0.1);
    const high = passive(0.3);
    AddScepterPassive(unit, low);
    AddScepterPassive(unit, high);
    expect(low.effective).toBe(false);
    expect(high.effective).toBe(true);

    RemoveScepterPassive(unit, high);
    expect(low.effective).toBe(true);
    RemoveScepterPassive(unit, low);
  });

  it('a second copy takes over when the effective one is removed', () => {
    const first = passive(0.3);
    const second = passive(0.3);
    AddScepterPassive(unit, first);
    AddScepterPassive(unit, second);
    expect(first.effective).toBe(true);
    expect(second.effective).toBe(false);

    RemoveScepterPassive(unit, first);
    expect(second.effective).toBe(true);
    RemoveScepterPassive(unit, second);
  });

  it('units are tracked separately', () => {
    const a = passive(0.1);
    const b = passive(0.3);
    AddScepterPassive(unit, a);
    AddScepterPassive(2 as EntityIndex, b);
    expect(a.effective).toBe(true);
    expect(b.effective).toBe(true);
    RemoveScepterPassive(unit, a);
    RemoveScepterPassive(2 as EntityIndex, b);
  });
});
