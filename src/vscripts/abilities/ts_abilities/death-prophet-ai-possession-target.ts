import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';
import { DEATH_PROPHET_POSSESSION_TARGET_MODIFIER } from './death-prophet-ai-possession-constants';
import { runBestEffortCleanup } from './death-prophet-ai-possession-logic';

const CONTROLLER_MODIFIER = 'modifier_death_prophet_exorcism_ai_possession_controller';
const POSSESSION_DAMAGE_TALENT_AWAKENED = 'special_bonus_unique_death_prophet_ai_possession_power';
const POSSESSION_VISION_REFRESH_INTERVAL = 0.5;
const POSSESSION_VISION_DURATION = 0.6;

interface PossessionController {
  finishPossession(killTarget: boolean): void;
  extendDurationForKill(attacker: CDOTA_BaseNPC, victim: CDOTA_BaseNPC): void;
}

interface PossessionAbility extends CDOTABaseAbility {
  tryLaunchScepterSpiritFromDamage?(
    event: ModifierInstanceEvent,
    source: CDOTA_BaseNPC_Hero,
    scepterEnabled: boolean,
  ): void;
}

interface PossessionTargetParams {
  death_prophet_entindex?: EntityIndex;
  original_owner_entindex?: EntityIndex;
  original_player_id?: PlayerID;
  original_team?: DOTATeam_t;
  had_scepter?: 0 | 1;
  had_shard?: 0 | 1;
  caster_had_scepter?: 0 | 1;
  cooldownPercentage?: number;
  castRangeBonus?: number;
  aoeBonus?: number;
  spellAmplifyPercentage?: number;
  statusResistance?: number;
  evasion?: number;
  magicalResistance?: number;
  incomingDamagePercentage?: number;
  attackRangeBonus?: number;
  physicalArmor?: number;
  preattackDamage?: number;
  attackSpeed?: number;
  strength?: number;
  agility?: number;
  intellect?: number;
  healthRegenPercentage?: number;
  manaRegenPercentage?: number;
  lifesteal?: number;
  spellLifesteal?: number;
  moveSpeed?: number;
  bonusVision?: number;
  ignoreMoveSpeedLimit?: 0 | 1;
  cannotMiss?: 0 | 1;
  slowImmune?: 0 | 1;
  flying?: 0 | 1;
}

type PossessionProgressionValues = Required<
  Omit<
    PossessionTargetParams,
    | 'death_prophet_entindex'
    | 'original_owner_entindex'
    | 'original_player_id'
    | 'original_team'
    | 'had_scepter'
    | 'had_shard'
    | 'caster_had_scepter'
    | 'ignoreMoveSpeedLimit'
    | 'cannotMiss'
    | 'slowImmune'
    | 'flying'
  >
> & {
  ignoreMoveSpeedLimit: number;
  cannotMiss: number;
  slowImmune: number;
  flying: number;
};

/** 可见标记兼作所有 Bot action owner 的统一暂停条件。 */
@registerModifier(
  'abilities/ts_abilities/death-prophet-ai-possession-target',
  DEATH_PROPHET_POSSESSION_TARGET_MODIFIER,
)
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_death_prophet_ai_possession_target extends BaseModifier {
  private resolvingLethalDamage = false;
  private preserveScepter = false;
  private preserveShard = false;
  private casterHadScepterAtCast = false;
  private deathProphetEntindex?: EntityIndex;
  private originalOwnerEntindex?: EntityIndex;
  private originalPlayerId?: PlayerID;
  private originalTeam?: DOTATeam_t;
  private progression: PossessionProgressionValues = {
    cooldownPercentage: 0,
    castRangeBonus: 0,
    aoeBonus: 0,
    spellAmplifyPercentage: 0,
    statusResistance: 0,
    evasion: 0,
    magicalResistance: 0,
    incomingDamagePercentage: 0,
    attackRangeBonus: 0,
    physicalArmor: 0,
    preattackDamage: 0,
    attackSpeed: 0,
    strength: 0,
    agility: 0,
    intellect: 0,
    healthRegenPercentage: 0,
    manaRegenPercentage: 0,
    lifesteal: 0,
    spellLifesteal: 0,
    moveSpeed: 0,
    bonusVision: 0,
    ignoreMoveSpeedLimit: 0,
    cannotMiss: 0,
    slowImmune: 0,
    flying: 0,
  };

  OnCreated(params: PossessionTargetParams): void {
    this.deathProphetEntindex = params.death_prophet_entindex;
    this.originalOwnerEntindex = params.original_owner_entindex;
    this.originalPlayerId = params.original_player_id;
    this.originalTeam = params.original_team;
    this.preserveScepter = params.had_scepter === 1;
    this.preserveShard = params.had_shard === 1;
    this.casterHadScepterAtCast = params.caster_had_scepter === 1;
    for (const [key, value] of Object.entries(params)) {
      if (key in this.progression && typeof value === 'number') {
        this.progression[key as keyof typeof this.progression] = value;
      }
    }
    if (IsServer()) {
      this.updateRemainingTimeStack();
      this.providePossessionVision();
      this.StartIntervalThink(POSSESSION_VISION_REFRESH_INTERVAL);
      print(
        `[DeathProphetPossession] target status created parent=${this.GetParent().GetUnitName()} duration=${this.GetRemainingTime()} caster_scepter=${this.casterHadScepterAtCast}`,
      );
    }
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    this.updateRemainingTimeStack();
    this.providePossessionVision();
  }

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'death_prophet_exorcism';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.MIN_HEALTH,
      ModifierFunction.ON_TAKEDAMAGE,
      ModifierFunction.ON_DEATH,
      ModifierFunction.TOTALDAMAGEOUTGOING_PERCENTAGE,
      ModifierFunction.IS_SCEPTER,
      ModifierFunction.IS_SHARD,
      ModifierFunction.TOOLTIP,
      ModifierFunction.COOLDOWN_PERCENTAGE,
      ModifierFunction.CAST_RANGE_BONUS_STACKING,
      ModifierFunction.AOE_BONUS_CONSTANT_STACKING,
      ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
      ModifierFunction.STATUS_RESISTANCE_STACKING,
      ModifierFunction.EVASION_CONSTANT,
      ModifierFunction.MAGICAL_RESISTANCE_BONUS,
      ModifierFunction.INCOMING_DAMAGE_PERCENTAGE,
      ModifierFunction.ATTACK_RANGE_BONUS,
      ModifierFunction.PHYSICAL_ARMOR_BONUS,
      ModifierFunction.PREATTACK_BONUS_DAMAGE,
      ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
      ModifierFunction.HEALTH_REGEN_PERCENTAGE,
      ModifierFunction.MANA_REGEN_TOTAL_PERCENTAGE,
      ModifierFunction.MOVESPEED_BONUS_CONSTANT,
      ModifierFunction.BONUS_DAY_VISION,
      ModifierFunction.BONUS_NIGHT_VISION,
      ModifierFunction.IGNORE_MOVESPEED_LIMIT,
    ];
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    const states: Partial<Record<ModifierState, boolean>> = {};
    if (this.progression.cannotMiss === 1) states[ModifierState.CANNOT_MISS] = true;
    if (this.progression.slowImmune === 1) states[ModifierState.UNSLOWABLE] = true;
    if (this.progression.flying === 1) {
      states[ModifierState.FLYING] = true;
      states[ModifierState.FORCED_FLYING_VISION] = true;
    }
    return states;
  }

  GetModifierPercentageCooldown(): number {
    return this.progression.cooldownPercentage;
  }

  GetModifierCastRangeBonusStacking(): number {
    return this.progression.castRangeBonus;
  }

  GetModifierAoEBonusConstantStacking(): number {
    return this.progression.aoeBonus;
  }

  GetModifierSpellAmplify_Percentage(): number {
    return this.progression.spellAmplifyPercentage;
  }

  GetModifierStatusResistanceStacking(): number {
    return this.progression.statusResistance;
  }

  GetModifierEvasion_Constant(): number {
    return this.progression.evasion;
  }

  GetModifierMagicalResistanceBonus(): number {
    return this.progression.magicalResistance;
  }

  GetModifierIncomingDamage_Percentage(): number {
    return this.progression.incomingDamagePercentage;
  }

  GetModifierAttackRangeBonus(): number {
    return this.GetParent().IsRangedAttacker() ? this.progression.attackRangeBonus : 0;
  }

  GetModifierPhysicalArmorBonus(): number {
    return this.progression.physicalArmor;
  }

  GetModifierPreAttack_BonusDamage(): number {
    return this.progression.preattackDamage;
  }

  GetModifierAttackSpeedBonus_Constant(): number {
    return this.progression.attackSpeed;
  }

  GetModifierBonusStats_Strength(): number {
    return this.progression.strength;
  }

  GetModifierBonusStats_Agility(): number {
    return this.progression.agility;
  }

  GetModifierBonusStats_Intellect(): number {
    return this.progression.intellect;
  }

  GetModifierHealthRegenPercentage(): number {
    return this.progression.healthRegenPercentage;
  }

  GetModifierTotalPercentageManaRegen(): number {
    return this.progression.manaRegenPercentage;
  }

  GetModifierMoveSpeedBonus_Constant(): number {
    return this.progression.moveSpeed;
  }

  GetModifierBonusDayVision(): number {
    return this.progression.bonusVision;
  }

  GetModifierBonusNightVision(): number {
    return this.progression.bonusVision;
  }

  GetModifierIgnoreMovespeedLimit(): 0 | 1 {
    return this.progression.ignoreMoveSpeedLimit === 1 ? 1 : 0;
  }

  GetModifierScepter(): 0 | 1 {
    return this.preserveScepter ? 1 : 0;
  }

  GetModifierShard(): 0 | 1 {
    return this.preserveShard ? 1 : 0;
  }

  GetModifierTotalDamageOutgoing_Percentage(event: ModifierAttackEvent): number {
    if (event.attacker !== this.GetParent()) return 0;

    const caster = this.getDeathProphet();
    const awakenedTalent = caster?.FindAbilityByName(POSSESSION_DAMAGE_TALENT_AWAKENED);
    return awakenedTalent && awakenedTalent.GetLevel() > 0
      ? awakenedTalent.GetSpecialValueFor('value')
      : 0;
  }

  OnTooltip(): number {
    return this.GetStackCount();
  }

  /**
   * 附身目标不会以死亡先知玩家的单位身份正常死亡。
   * 致命伤先保留 1 点生命，再交给 controller 恢复敌方身份并由死亡先知击杀。
   */
  GetMinHealth(): number {
    return 1;
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
    if (event.attacker === parent) {
      if (this.progression.lifesteal > 0) {
        TsLifeStealOnAttackLanded(event, this.progression.lifesteal, parent);
      }
      if (this.progression.spellLifesteal > 0) {
        TsSpellLifeSteal(event, this.progression.spellLifesteal, parent);
      }
      this.tryScepterStrike(event, parent);
    }

    if (this.resolvingLethalDamage) return;
    if (event.unit !== parent || parent.GetHealth() > 1) return;

    this.resolvingLethalDamage = true;
    const caster = this.getDeathProphet();
    const controller = caster?.FindModifierByName(CONTROLLER_MODIFIER) as
      | (CDOTA_Buff & PossessionController)
      | undefined;
    if (controller && !controller.IsNull()) {
      controller.finishPossession(true);
      return;
    }

    this.emergencyFinish(parent, caster);
  }

  OnDeath(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    const victim = event.unit;
    const attacker = event.attacker;
    if (!victim || victim.IsNull() || !attacker || attacker.IsNull()) return;

    const caster = this.getDeathProphet();
    const controller = caster?.FindModifierByName(CONTROLLER_MODIFIER) as
      | (CDOTA_Buff & PossessionController)
      | undefined;
    if (controller && !controller.IsNull()) {
      controller.extendDurationForKill(attacker, victim);
    }
  }

  private tryScepterStrike(event: ModifierInstanceEvent, parent: CDOTA_BaseNPC_Hero): void {
    const ability = this.GetAbility() as PossessionAbility | undefined;
    const caster = this.getDeathProphet();
    const casterHasScepter = this.casterHadScepterAtCast || (caster?.HasScepter() ?? false);
    ability?.tryLaunchScepterSpiritFromDamage?.(event, parent, casterHasScepter);
  }

  private updateRemainingTimeStack(): void {
    const remainingSeconds = Math.max(0, Math.ceil(this.GetRemainingTime()));
    if (this.GetStackCount() !== remainingSeconds) this.SetStackCount(remainingSeconds);
  }

  private providePossessionVision(): void {
    const parent = this.GetParent();
    const caster = this.getDeathProphet();
    if (!caster || caster.IsNull() || !parent.IsAlive()) return;

    AddFOWViewer(
      caster.GetTeamNumber(),
      parent.GetAbsOrigin(),
      Math.max(1, parent.GetCurrentVisionRange()),
      POSSESSION_VISION_DURATION,
      true,
    );
  }

  private getDeathProphet(): CDOTA_BaseNPC_Hero | undefined {
    if (this.deathProphetEntindex === undefined) return undefined;
    const entity = EntIndexToHScript(this.deathProphetEntindex);
    return entity && !entity.IsNull() ? (entity as CDOTA_BaseNPC_Hero) : undefined;
  }

  private emergencyFinish(
    parent: CDOTA_BaseNPC_Hero,
    caster: CDOTA_BaseNPC_Hero | undefined,
  ): void {
    print('[DeathProphetPossession] controller missing; running emergency identity cleanup');
    const originalOwner =
      this.originalOwnerEntindex !== undefined
        ? EntIndexToHScript(this.originalOwnerEntindex)
        : undefined;
    runBestEffortCleanup(
      [
        {
          name: 'emergency_team',
          run: () => {
            if (this.originalTeam !== undefined) parent.SetTeam(this.originalTeam);
          },
        },
        {
          name: 'emergency_owner',
          run: () => {
            if (originalOwner && !originalOwner.IsNull()) parent.SetOwner(originalOwner);
          },
        },
        {
          name: 'emergency_control',
          run: () => {
            if (this.originalPlayerId !== undefined) {
              parent.SetControllableByPlayer(this.originalPlayerId, false);
            }
          },
        },
        { name: 'emergency_status', run: () => parent.RemoveModifierByName(this.GetName()) },
        { name: 'emergency_kill', run: () => parent.Kill(this.GetAbility(), caster) },
      ],
      (stage, error) =>
        print(`[DeathProphetPossession] emergency cleanup failed stage=${stage} error=${error}`),
    );
  }

  OnDestroy(): void {
    if (IsServer()) {
      print(
        `[DeathProphetPossession] target status destroyed parent=${this.GetParent().GetUnitName()}`,
      );
    }
  }
}
