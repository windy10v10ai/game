/**
 * Bot Build配置
 * 从 game/scripts/npc/npc_heroes_custom.txt 提取的Bot Build信息
 * 格式: { [level]: abilityName }
 * 注意：level键是字符串类型（因为从KV文件读取时是字符串）
 */
export type BotBuildConfig = Record<string, string>;

/**
 * 缓存已加载的Bot Build配置
 */
const botBuildCache: Map<string, BotBuildConfig | null> = new Map();

/**
 * 从KV文件读取英雄的Bot Build配置
 * @param heroName 英雄名称
 * @returns Bot Build配置，如果英雄没有配置则返回null
 */
export function GetBotBuildConfig(heroName: string): BotBuildConfig | null {
  // 检查缓存
  if (botBuildCache.has(heroName)) {
    return botBuildCache.get(heroName) || null;
  }

  // 从KV文件读取
  const heroesKV = LoadKeyValues('scripts/npc/npc_heroes_custom.txt') as {
    DOTAHeroes?: {
      [heroName: string]: {
        Bot?: {
          Build?: Record<string, string>;
        };
      };
    };
  } | null;

  if (!heroesKV?.DOTAHeroes?.[heroName]?.Bot?.Build) {
    // 缓存null值，表示该英雄没有配置
    botBuildCache.set(heroName, null);
    return null;
  }

  const buildConfig = heroesKV.DOTAHeroes[heroName].Bot!.Build!;
  // 缓存配置
  botBuildCache.set(heroName, buildConfig);
  return buildConfig;
}
