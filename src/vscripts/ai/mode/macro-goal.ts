import { MacroGoal } from './mode-enum';
import { TeamCommander } from '../team/team-commander';

/**
 * Minimal interface for MacroGoalManager so it can live in the mode layer
 * without importing BotBaseAIModifier (which would create a circular dependency).
 * BotBaseAIModifier satisfies this interface structurally.
 */
interface HeroAIForGoal {
  macroGoal: MacroGoal;
  aroundEnemyHeroes: any[];
  GetHero(): {
    GetHealthPercent(): number;
    GetMana(): number;
    GetMaxMana(): number;
    GetTeamNumber(): DOTATeam_t;
    GetAbsOrigin(): { x: number; y: number };
    GetEntityIndex(): EntityIndex;
  };
}

/**
 * Evaluates the bot's current macro goal — the high-level directive that
 * sits above the FSA and directs behaviour between fights.
 *
 * Goals in priority order:
 *   1. HEAL   — bot is depleted and no enemies are visible: go to fountain.
 *   2. DEFEND — an allied tower is actively under attack: rotate to defend.
 *   3. GROUP  — 3+ allies are clustered (team fight forming): move to join them.
 *   4. FARM   — default: let the FSA run normally.
 *
 * Goal changes are suppressed while enemies are visible. The FSA (ATTACK/RETREAT)
 * still overrides the macro goal during combat — a bot healing will still dodge
 * and retreat if a fight breaks out, it just won't actively seek fights.
 */
export class MacroGoalManager {
  /** HP % below which the bot leaves lane to heal (only when no enemies present). */
  static readonly HEAL_HP_THRESHOLD = 35;
  /** Mana ratio below which a wounded bot (<70% HP) decides to heal. */
  static readonly HEAL_MANA_THRESHOLD = 0.2;
  /** HP % above which the bot considers itself healed enough to return to lane. */
  static readonly HEAL_DONE_HP = 85;
  /** Mana ratio above which the bot considers itself recovered. */
  static readonly HEAL_DONE_MANA = 0.65;
  /** Distance (units) below which the bot is considered "already at" a group — don't re-trigger GROUP. */
  private static readonly GROUP_ALREADY_THERE = 1500;

  static Evaluate(heroAI: HeroAIForGoal): MacroGoal {
    const hero = heroAI.GetHero();
    const hp = hero.GetHealthPercent();
    const maxMana = hero.GetMaxMana();
    const manaRatio = maxMana > 0 ? hero.GetMana() / maxMana : 1;
    const commander = TeamCommander.getInstance();

    // Persist HEAL until the bot is recovered or enemies force a response.
    if (heroAI.macroGoal === MacroGoal.HEAL) {
      if (heroAI.aroundEnemyHeroes.length > 0) {
        // Enemy appeared — drop HEAL and let FSA handle combat.
        return MacroGoal.FARM;
      }
      if (hp < MacroGoalManager.HEAL_DONE_HP || manaRatio < MacroGoalManager.HEAL_DONE_MANA) {
        return MacroGoal.HEAL;
      }
      // Fully recovered: fall through to normal evaluation.
    }

    // Macro goal changes only happen when there are no immediate threats nearby.
    if (heroAI.aroundEnemyHeroes.length === 0) {
      // 1. HEAL
      const needsHeal =
        hp < MacroGoalManager.HEAL_HP_THRESHOLD ||
        (hp < 70 && manaRatio < MacroGoalManager.HEAL_MANA_THRESHOLD);
      if (needsHeal) {
        return MacroGoal.HEAL;
      }

      const team = hero.GetTeamNumber();

      // 2. DEFEND: this bot is one of the 2 closest to a threatened allied tower
      const heroEntityIndex = hero.GetEntityIndex() as unknown as number;
      const defendPos = commander.GetDefendTarget(team, heroEntityIndex);
      if (defendPos !== undefined) {
        return MacroGoal.DEFEND;
      }

      // 3. GROUP: 3+ allies are clustered up — join them if the bot is far away
      const groupPos = commander.GetGroupTarget(team);
      if (groupPos !== undefined) {
        const heroPos = hero.GetAbsOrigin();
        const dx = heroPos.x - (groupPos as unknown as { x: number }).x;
        const dy = heroPos.y - (groupPos as unknown as { y: number }).y;
        if (
          dx * dx + dy * dy >
          MacroGoalManager.GROUP_ALREADY_THERE * MacroGoalManager.GROUP_ALREADY_THERE
        ) {
          return MacroGoal.GROUP;
        }
      }
    }

    return MacroGoal.FARM;
  }
}
