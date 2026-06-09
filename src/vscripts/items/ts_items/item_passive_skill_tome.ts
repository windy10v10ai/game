import { AbilityLotteryHelper } from '../../modules/lottery/ability/ability-lottery-helper';
import { abilityTiersPassive } from '../../modules/lottery/ability/lottery-abilities';
import { BaseItem, registerAbility } from '../../utils/dota_ts_adapter';

// 技能书抽奖排除列表,以后可按需扩充
const PASSIVE_TOME_BLACKLIST = [
  'medusa_mana_shield', // 魔法盾
];

/** 被动技能书:使用后按 premium 概率随机抽 1 个被动技能学到英雄身上,每名玩家整局最多 3 次 */
@registerAbility('item_passive_skill_tome')
export class ItemPassiveSkillTome extends BaseItem {
  private static readonly MAX_USAGE = 3;
  // 静态成员与物品实例无关,按 playerId 整局累计成功使用次数
  private static readonly usageCount = new Map<PlayerID, number>();

  // 返回拦截用的错误文本 key(带 #),可使用则返回空字符串
  private castErrorKey(): string {
    const caster = this.GetCaster();
    if (caster === undefined || !caster.IsHero()) {
      return '';
    }
    const playerId = caster.GetPlayerOwnerID();
    if ((ItemPassiveSkillTome.usageCount.get(playerId) ?? 0) >= ItemPassiveSkillTome.MAX_USAGE) {
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
    const hero = caster as CDOTA_BaseNPC_Hero;
    const playerId = hero.GetPlayerOwnerID();

    const [result] = AbilityLotteryHelper.getRandomAbilities(
      abilityTiersPassive,
      1,
      hero,
      PASSIVE_TOME_BLACKLIST.slice(),
      true,
    );
    if (!result) {
      return;
    }

    hero.AddAbility(result.name);
    ItemPassiveSkillTome.usageCount.set(
      playerId,
      (ItemPassiveSkillTome.usageCount.get(playerId) ?? 0) + 1,
    );
    UTIL_Remove(this);
  }
}
