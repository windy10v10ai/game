import { registerAbility } from '../../utils/dota_ts_adapter';
import { AutoCastAbility, findEnemiesInRange, getFullCastRange } from './shared/auto-cast-ability';

const NATIVE_TRACK = 'bounty_hunter_track';
const SHURIKEN_TOSS = 'bounty_hunter_shuriken_toss';
const TRACK_MODIFIER = 'modifier_bounty_hunter_track';

/**
 * 赏金猎人 追踪术-觉醒：占原技能槽位提供自动施法开关，追踪效果仍由隐藏保留的原生技能负责，
 * 每次追踪后对目标补一发投掷飞镖。
 */
@registerAbility('bounty_hunter_track_awaken')
export class BountyHunterTrackAwaken extends AutoCastAbility {
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
    const target = this.GetCursorTarget();
    if (target === undefined) return;
    this.trackTarget(target);
  }

  OnAutoCastThink(caster: CDOTA_BaseNPC_Hero): void {
    if (!this.IsFullyCastable()) return;

    const enemies = findEnemiesInRange(
      caster,
      getFullCastRange(caster, this),
      UnitTargetType.HERO,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES +
        UnitTargetFlags.NOT_CREEP_HERO +
        UnitTargetFlags.NOT_ILLUSIONS,
    );
    // 先标记还没被追踪的英雄；全员已被追踪时续最近的一个，让飞镖照常输出
    const target = enemies.find((enemy) => !enemy.HasModifier(TRACK_MODIFIER)) ?? enemies[0];
    if (target === undefined) return;

    // 自动触发不经过引擎原生施法管线，须用 UseResources 模拟正常施法扣蓝与启动冷却
    this.UseResources(true, false, false, true);
    this.trackTarget(target);
  }

  /** 原生技能只作为效果载体常驻在英雄身上，等级跟随壳技能，不占技能栏 */
  private ensureNativeAbility(): CDOTABaseAbility | undefined {
    const caster = this.GetCaster();
    const native = caster.FindAbilityByName(NATIVE_TRACK) ?? caster.AddAbility(NATIVE_TRACK);
    if (native === undefined) return undefined;

    native.SetLevel(Math.max(1, this.GetLevel()));
    native.SetHidden(true);
    return native;
  }

  private trackTarget(target: CDOTA_BaseNPC): void {
    const native = this.ensureNativeAbility();
    if (native === undefined) return;

    this.GetCaster().SetCursorCastTarget(target);
    native.OnSpellStart();
    this.tossShuriken();
  }

  /** 直接调用飞镖的施放效果：不查施法距离、不进冷却，只按飞镖当前等级扣蓝 */
  private tossShuriken(): void {
    const caster = this.GetCaster();
    const shuriken = caster.FindAbilityByName(SHURIKEN_TOSS);
    if (shuriken === undefined || shuriken.GetLevel() < 1) return;

    const manaCost = shuriken.GetManaCost(-1);
    if (caster.GetMana() < manaCost) return;

    caster.SpendMana(manaCost, shuriken);
    shuriken.OnSpellStart();
  }
}
