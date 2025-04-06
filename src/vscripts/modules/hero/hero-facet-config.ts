export class HeroFacetConfig {
  // 英雄名称到facetID列表的映射
  private static readonly heroFacetMap: Map<string, number[]> = new Map([
    ['npc_dota_hero_tinker', [1, 2]], // 修补匠
    ['npc_dota_hero_abaddon', [1, 2]], // 亚巴顿
    ['npc_dota_hero_axe', [1, 2]], // 斧王
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
