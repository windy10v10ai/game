import { BaseItem, registerAbility } from '../../utils/dota_ts_adapter';

/** 被动技能书:使用后弹 4 选 1，按 premium 概率随机展示被动技能候选,每名玩家整局最多 2 次 */
@registerAbility('item_passive_skill_tome')
export class ItemPassiveSkillTome extends BaseItem {
  // 返回拦截用的错误文本 key(带 #),可使用则返回空字符串
  private castErrorKey(): string {
    const caster = this.GetCaster();
    if (caster === undefined || !caster.IsHero()) {
      return '';
    }
    if (GameRules.Lottery.PassiveTome.isUsageLimitReached(caster.GetPlayerOwnerID())) {
      return '#dota_hud_error_passive_skill_tome_max_usage';
    }
    return '';
  }

  CastFilterResult(): UnitFilterResult {
    return this.castErrorKey() !== '' ? UnitFilterResult.FAIL_CUSTOM : UnitFilterResult.SUCCESS;
  }

  GetCustomCastError(): string {
    return this.castErrorKey();
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    if (!caster || !caster.IsHero()) {
      return;
    }
    GameRules.Lottery.PassiveTome.onTriggered(caster as CDOTA_BaseNPC_Hero);
    UTIL_Remove(this);
  }
}
