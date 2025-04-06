export class HeroFacetConfig {
  // 英雄名称到facetID列表的映射
  private static readonly heroFacetMap: Map<string, number[]> = new Map([
    ['npc_dota_hero_tinker', [1, 2]],
    ['npc_dota_hero_abaddon', [1, 2]],
    ['npc_dota_hero_axe', [1, 2]],
    ['npc_dota_hero_bane', [1, 2]],
    ['npc_dota_hero_bounty_hunter', [1, 2]],
    ['npc_dota_hero_bristleback', [2, 3]],
    ['npc_dota_hero_chaos_knight', [2, 3, 4]],
    ['npc_dota_hero_crystal_maiden', [3, 4]],
    ['npc_dota_hero_dazzle', [1, 2]],
    ['npc_dota_hero_death_prophet', [2, 3]],
    ['npc_dota_hero_dragon_knight', [1, 2]],
    ['npc_dota_hero_drow_ranger', [1, 2]],
    ['npc_dota_hero_earthshaker', [1, 2]],
    ['npc_dota_hero_jakiro', [3, 4]],
    ['npc_dota_hero_juggernaut', [1, 2]],
    ['npc_dota_hero_kunkka', [1, 2]],
    ['npc_dota_hero_lich', [1, 2]],
    ['npc_dota_hero_lina', [1, 2]],

    // ... 其他英雄配置
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
