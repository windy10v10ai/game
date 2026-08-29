import { registerAbility } from '../../utils/dota_ts_adapter';
import { AutoCastAbility, findEnemiesInRange, getFullCastRange } from './shared/auto-cast-ability';

const NATIVE_WILD_AXES = 'beastmaster_wild_axes';

/**
 * 兽王 野性之斧-觉醒：占原技能槽位提供自动施法开关，弹道与伤害仍由隐藏保留的原生技能负责。
 * autocast 开启后，施法距离内有敌方单位就朝最远的敌方英雄投斧，没有英雄时改朝最远的敌方单位。
 */
@registerAbility('beastmaster_wild_axes_awaken')
export class BeastmasterWildAxesAwaken extends AutoCastAbility {
  OnUpgrade(): void {
    if (!IsServer()) return;
    this.ensureNativeAbility();
  }

  OnOwnerSpawned(): void {
    if (!IsServer()) return;
    this.ensureNativeAbility();
  }

  OnSpellStart(): void {
    if (!IsServer()) return;
    this.castNativeAt(this.GetCursorPosition());
  }

  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    if (!this.IsFullyCastable()) return;

    const range = getFullCastRange(caster, this);
    // 见到小兵也放，但优先朝最远的敌方英雄，让飞斧沿途尽量多穿人
    const enemies = findEnemiesInRange(caster, range, UnitTargetType.HERO + UnitTargetType.BASIC);
    const heroes = enemies.filter((enemy) => enemy.IsHero());
    const target = heroes[heroes.length - 1] ?? enemies[enemies.length - 1];
    if (target === undefined) return;

    // 自动触发不经过引擎原生施法管线，须用 UseResources 模拟正常施法扣蓝与启动冷却
    this.UseResources(true, false, false, true);
    this.castNativeAt(target.GetAbsOrigin());
  }

  private getNativeAbility(): CDOTABaseAbility | undefined {
    return this.GetCaster().FindAbilityByName(NATIVE_WILD_AXES);
  }

  /** 原生技能只作为效果载体常驻在英雄身上，等级跟随壳技能，不占技能栏 */
  private ensureNativeAbility(): CDOTABaseAbility | undefined {
    const caster = this.GetCaster();
    const native = this.getNativeAbility() ?? caster.AddAbility(NATIVE_WILD_AXES);
    if (native === undefined) return undefined;

    native.SetLevel(Math.max(1, this.GetLevel()));
    native.SetHidden(true);
    return native;
  }

  private castNativeAt(location: Vector): void {
    const native = this.ensureNativeAbility();
    if (native === undefined) return;

    native.SetActivated(true);
    this.GetCaster().SetCursorPosition(location);
    native.OnSpellStart();
  }
}
