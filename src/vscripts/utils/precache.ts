/** @noSelfInFile */

import { abilityModelNameList, heroNameListParticles, heroNameListSound } from './precache-data';

// 导出的预载入方法，用来给addon_game_mode.ts调用
export default function Precache(context: CScriptPrecacheContext) {
  print(`[Precache] Start precache...`);
  // 需要预载的所有资源
  precacheResource(
    [
      // '***.vpcf',
      // 'soundevents/game_sounds_heroes/game_sounds_queenofpain.vsndevts',
      // '***.vmdl',
    ],
    context,
  );
  // 需要预载入的kv文件，会自动解析KV文件中的所有vpcf资源等等
  precacheEveryResourceInKV(
    [
      // kv文件路径
      'scripts/npc/npc_items_custom.txt',
      'scripts/npc/npc_abilities_custom.txt',
      'scripts/npc/npc_abilities_custom_lottery.txt',
    ],
    context,
  );
  // 需要预载入的单位
  precacheUnits(
    [
      // 单位名称
      // 'npc_dota_hero_***',
    ],
    context,
  );
  // 需要预载入的物品
  precacheItems(
    [
      // 物品名称
      // 'item_***',
    ],
    context,
  );

  precacheHeroAbilities(context);
  print(`[Precache] Precache finished.`);
}

// 预载入KV文件中的所有资源
function precacheEveryResourceInKV(kvFileList: string[], context: CScriptPrecacheContext) {
  kvFileList.forEach((file) => {
    const kvTable = LoadKeyValues(file) as object | null;
    if (kvTable) {
      precacheEverythingFromTable(kvTable, context);
    } else {
      print(`[Precache] Error: Failed to load KV file: ${file}`);
    }
  });
}
// 预载入资源列表
function precacheResource(resourceList: string[], context: CScriptPrecacheContext) {
  resourceList.forEach((resource) => {
    precacheResString(resource, context);
  });
}
function precacheResString(res: string, context: CScriptPrecacheContext) {
  if (res.endsWith('.vpcf')) {
    PrecacheResource('particle', res, context);
  } else if (res.endsWith('.vsndevts')) {
    PrecacheResource('soundfile', res, context);
  } else if (res.endsWith('.vmdl')) {
    PrecacheResource('model', res, context);
  }
}

// 预载入单位列表
function precacheUnits(unitNamesList: string[], context?: CScriptPrecacheContext) {
  if (context != null) {
    unitNamesList.forEach((unitName) => {
      PrecacheUnitByNameSync(unitName, context);
    });
  } else {
    unitNamesList.forEach((unitName) => {
      PrecacheUnitByNameAsync(unitName, () => {});
    });
  }
}
// 预载入物品列表
function precacheItems(itemList: string[], context: CScriptPrecacheContext) {
  itemList.forEach((itemName) => {
    PrecacheItemByNameSync(itemName, context);
  });
}

// 一个辅助的，从KV表中解析出所有资源并预载入的方法
function precacheEverythingFromTable(kvTable: any, context: CScriptPrecacheContext) {
  for (const [k, v] of pairs(kvTable)) {
    if (type(v) === 'table') {
      precacheEverythingFromTable(v, context);
    } else if (type(v) === 'string') {
      precacheResString(v, context);
    }
  }
}

// 预载入抽选技能
function precacheHeroAbilities(context: CScriptPrecacheContext) {
  // 技能特效
  heroNameListParticles.forEach((heroName) => {
    PrecacheResource('particle_folder', `particles/units/heroes/${heroName}`, context);
  });
  // 技能音效
  heroNameListSound.forEach((heroName) => {
    const hero = heroName.replace('npc_dota_hero_', '');
    PrecacheResource(
      'soundfile',
      `soundevents/game_sounds_heroes/game_sounds_${hero}.vsndevts`,
      context,
    );
  });
  // 技能模型
  abilityModelNameList.forEach((modelName) => {
    PrecacheResource('model', modelName, context);
  });
}
