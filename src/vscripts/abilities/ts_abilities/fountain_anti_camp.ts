import { PlayerHelper } from '../../modules/helper/player-helper';
import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const WATCHER_MODIFIER_NAME = 'modifier_fountain_anti_camp_watcher';
const STACK_MODIFIER_NAME = 'modifier_fountain_anti_camp_stack';
const LOCK_MODIFIER_NAME = 'modifier_fountain_anti_camp_lock';
const POLL_INTERVAL = 1;
const DEBUFF_DURATION = 3;
const LOCK_STACK_THRESHOLD = 3;

@registerAbility('fountain_anti_camp')
export class AbilityFountainAntiCamp extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return WATCHER_MODIFIER_NAME;
  }
}

@registerModifier('abilities/ts_abilities/fountain_anti_camp')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_fountain_anti_camp_watcher extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  // 泉水作为地图内置实体，生成时机早于真实对局中玩家连接完毕，人数判断需等状态到 PRE_GAME 后才可信
  private checked = false;

  OnCreated(): void {
    if (!IsServer()) return;
    if (this.GetParent().GetTeamNumber() !== DotaTeam.BADGUYS) return;
    this.StartIntervalThink(POLL_INTERVAL);
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    GameRules.FountainAntiCamp.Disable(this.GetParent());
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    if (!this.checked) {
      const state = GameRules.State_Get();
      if (state < GameState.PRE_GAME) return;

      this.checked = true;
      const humanCount = PlayerHelper.GetHumamPlayerCount();
      // 仅在多人游戏中生效 (开发模式下允许单人测试生效)
      const canRun = IsInToolsMode() || humanCount >= 2;
      print(
        `[FountainAntiCamp] check state=${state} toolsMode=${IsInToolsMode()} humanCount=${humanCount} canRun=${canRun}`,
      );
      if (!canRun) {
        this.StartIntervalThink(-1);
        return;
      }
    }

    const fountain = this.GetParent();
    const ability = this.GetAbility();
    if (!ability) return;

    const radius = ability.GetSpecialValueFor('radius');
    GameRules.FountainAntiCamp.Configure(fountain, ability, radius);

    const enemies = FindUnitsInRadius(
      fountain.GetTeamNumber(),
      fountain.GetAbsOrigin(),
      undefined,
      radius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.ANY,
      false,
    );

    for (const hero of enemies) {
      if (!hero.IsRealHero() || !PlayerHelper.IsHumanPlayer(hero)) continue;

      if (hero.HasModifier(LOCK_MODIFIER_NAME)) {
        hero.AddNewModifier(fountain, ability, LOCK_MODIFIER_NAME, { duration: DEBUFF_DURATION });
        continue;
      }

      const stackCount = (hero.FindModifierByName(STACK_MODIFIER_NAME)?.GetStackCount() ?? 0) + 1;

      if (stackCount >= LOCK_STACK_THRESHOLD) {
        hero.RemoveModifierByName(STACK_MODIFIER_NAME);
        hero.AddNewModifier(fountain, ability, LOCK_MODIFIER_NAME, { duration: DEBUFF_DURATION });
      } else {
        hero
          .AddNewModifier(fountain, ability, STACK_MODIFIER_NAME, { duration: DEBUFF_DURATION })
          .SetStackCount(stackCount);
      }
    }
  }
}

@registerModifier('abilities/ts_abilities/fountain_anti_camp')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_fountain_anti_camp_stack extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'action_lockenemytower';
  }
}

@registerModifier('abilities/ts_abilities/fountain_anti_camp')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_fountain_anti_camp_lock extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'action_lockenemytower';
  }

  OnCreated(): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    parent.Purge(true, false, false, false, true);
    parent.RemoveModifierByName('modifier_black_king_bar_immune');
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.MUTED]: true,
      [ModifierState.SILENCED]: true,
      [ModifierState.PASSIVES_DISABLED]: true,
      [ModifierState.DISARMED]: true,
    };
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.DISABLE_HEALING,
      ModifierFunction.DISABLE_MANA_GAIN,
      ModifierFunction.MOVESPEED_ABSOLUTE,
    ];
  }

  GetDisableHealing(): 0 | 1 {
    return 1;
  }

  GetDisableManaGain(): number {
    return 1;
  }

  GetModifierMoveSpeed_Absolute(): number {
    return this.GetAbility()?.GetSpecialValueFor('move_speed') ?? 400;
  }
}
