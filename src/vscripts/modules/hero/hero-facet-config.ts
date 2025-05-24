export class HeroFacetConfig {
  // 英雄名称到facetID列表的映射
  private static readonly heroFacetMap: Map<string, number[]> = new Map([
    ['npc_dota_hero_abaddon', [1, 3]],
    ['npc_dota_hero_axe', [1, 2]],
    ['npc_dota_hero_bane', [1, 2]],
    ['npc_dota_hero_bounty_hunter', [1, 2]],
    ['npc_dota_hero_bloodseeker', [1, 3]],
    ['npc_dota_hero_bristleback', [2, 3]],
    ['npc_dota_hero_chaos_knight', [2, 3, 4]],
    ['npc_dota_hero_crystal_maiden', [3, 4]],
    ['npc_dota_hero_dazzle', [1, 2]],
    ['npc_dota_hero_death_prophet', [2, 3]],
    ['npc_dota_hero_dragon_knight', [1, 2, 3]],
    ['npc_dota_hero_drow_ranger', [1, 2]],
    ['npc_dota_hero_earthshaker', [1, 3]],
    ['npc_dota_hero_jakiro', [3, 4]],
    ['npc_dota_hero_juggernaut', [1, 2]],
    ['npc_dota_hero_kunkka', [1, 2]],
    ['npc_dota_hero_lich', [1, 2]],
    ['npc_dota_hero_lina', [1, 2]],
    ['npc_dota_hero_lion', [1, 2]],
    ['npc_dota_hero_luna', [2, 3]],
    ['npc_dota_hero_medusa', [1, 3, 4]],
    ['npc_dota_hero_meepo', [0]],
    ['npc_dota_hero_necrolyte', [1, 2]],
    ['npc_dota_hero_nevermore', [1, 2]],
    ['npc_dota_hero_ogre_magi', [1, 2]],
    ['npc_dota_hero_omniknight', [1, 2]],
    ['npc_dota_hero_oracle', [1, 2]],
    ['npc_dota_hero_phantom_assassin', [2, 3]],
    ['npc_dota_hero_pudge', [1, 3]],
    ['npc_dota_hero_riki', [1, 2]],
    ['npc_dota_hero_sand_king', [3, 4]],
    ['npc_dota_hero_shadow_shaman', [2, 3]],
    ['npc_dota_hero_skywrath_mage', [1, 2]],
    ['npc_dota_hero_sniper', [1, 2]],
    ['npc_dota_hero_spectre', [1, 2]],
    ['npc_dota_hero_sven', [1, 2]],
    ['npc_dota_hero_tinker', [1, 2]],
    ['npc_dota_hero_tiny', [1, 2]],
    ['npc_dota_hero_vengefulspirit', [1, 2]],
    ['npc_dota_hero_viper', [1, 2]],
    ['npc_dota_hero_warlock', [1, 2]],
    ['npc_dota_hero_windrunner', [4, 5]],
    ['npc_dota_hero_witch_doctor', [3, 4]],
    ['npc_dota_hero_skeleton_king', [1, 2]],
    ['npc_dota_hero_zuus', [1, 2]],
  ]);

  // 获取英雄可用的facetID列表
  static getHeroFacetIds(heroName: string): number[] {
    return this.heroFacetMap.get(heroName) || [1]; // 默认返回[1]如果英雄没有配置
  }

  // 随机获取一个英雄的facetID
  static getRandomFacetId(heroName: string): number {
    const facetIds = this.getHeroFacetIds(heroName);
    const randomIndex = Math.floor(Math.random() * facetIds.length);
    const selectedFacetId = facetIds[randomIndex];
    return selectedFacetId;
  }
}
