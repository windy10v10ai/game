import { AddKeyBind, FindDotaHudElement } from '@utils/utils';

export function bindAbilityKey(abilityname: string, key: string, isQuickCast: boolean) {
  const heroID = Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID());
  const abilityID = Entities.GetAbilityByName(heroID, abilityname);
  // 绑定施法
  AddKeyBind(
    key,
    () => {
      if (GameUI.IsControlDown() === true) {
        // ctrl升级
        Abilities.AttemptToUpgrade(abilityID);
      } else if (GameUI.IsAltDown() === true) {
        // alt切换自动施法,待实现
        // console.log('Alt is down');
        // console.log('IsAutocast:', Abilities.IsAutocast(abilityID));
        // console.log('GetAutoCastState:', Abilities.GetAutoCastState(abilityID));
      } else {
        if (isQuickCast) {
          QuickCastAbility(abilityID, Abilities.GetBehavior(abilityID));
        } else {
          Abilities.ExecuteAbility(abilityID, heroID, true);
        }
      }
    },
    () => {},
  );

  saveInputKeyborard(abilityname, key);
}

function IsAbilityBehavior(behavior: DOTA_ABILITY_BEHAVIOR, judge: DOTA_ABILITY_BEHAVIOR) {
  return (behavior & judge) === judge;
}
/**
 * 快速施法
 * @param abilityID
 * @param behavior
 * @param worldPos
 */
function QuickCastAbility(abilityID: AbilityEntityIndex, behavior: DOTA_ABILITY_BEHAVIOR) {
  if (Abilities.GetLevel(abilityID) === 0) {
    GameUI.SendCustomHUDError('dota_hud_error_ability_not_learned', 'General.CastFail_NotLearned');
    return;
  }
  if (!Abilities.IsCooldownReady(abilityID)) {
    GameUI.SendCustomHUDError(
      'dota_hud_error_ability_in_cooldown',
      'General.CastFail_AbilityInCooldown',
    );
    return;
  }
  if (!Abilities.IsOwnersManaEnough(abilityID)) {
    GameUI.SendCustomHUDError('dota_hud_error_not_enough_mana', 'General.CastFail_NoMana');
    return;
  }
  const worldPos = GameUI.GetScreenWorldPosition(GameUI.GetCursorPosition()) ?? undefined;
  if (IsAbilityBehavior(behavior, DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_VECTOR_TARGETING)) {
    //矢量施法暂不支持
  } else {
    if (IsAbilityBehavior(behavior, DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_UNIT_TARGET)) {
      console.log('DOTA_ABILITY_BEHAVIOR_UNIT_TARGET');
      const targetType = Abilities.GetAbilityTargetType(abilityID);
      const hasTree =
        (targetType & DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_TREE) ===
        DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_TREE;
      const target = GetCursorEntity(abilityID);
      if (target === undefined) {
        // if not point and not no target
        if (
          !IsAbilityBehavior(behavior, DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_POINT) &&
          !IsAbilityBehavior(behavior, DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_NO_TARGET)
        ) {
          GameUI.SendCustomHUDError('dota_hud_error_no_target', 'General.CastFail_NoTarget');
          return;
        }
      } else {
        Game.PrepareUnitOrders({
          OrderType: hasTree
            ? dotaunitorder_t.DOTA_UNIT_ORDER_CAST_TARGET_TREE
            : dotaunitorder_t.DOTA_UNIT_ORDER_CAST_TARGET,
          TargetIndex: target?.entityIndex ?? -1,
          AbilityIndex: abilityID,
          ShowEffects: true,
        });
        return;
      }
    }
    if (IsAbilityBehavior(behavior, DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_POINT)) {
      console.log('DOTA_ABILITY_BEHAVIOR_POINT');
      Game.PrepareUnitOrders({
        OrderType: dotaunitorder_t.DOTA_UNIT_ORDER_CAST_POSITION,
        Position: worldPos,
        AbilityIndex: abilityID,
        ShowEffects: true,
      });
      return;
    }
    if (IsAbilityBehavior(behavior, DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_NO_TARGET)) {
      if (IsAbilityBehavior(behavior, DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_TOGGLE)) {
        Game.PrepareUnitOrders({
          OrderType: dotaunitorder_t.DOTA_UNIT_ORDER_CAST_TOGGLE,
          AbilityIndex: abilityID,
          ShowEffects: true,
        });
        return;
      } else {
        Game.PrepareUnitOrders({
          OrderType: dotaunitorder_t.DOTA_UNIT_ORDER_CAST_NO_TARGET,
          AbilityIndex: abilityID,
          ShowEffects: true,
        });
        return;
      }
    }
  }
}

/**
 * 获取鼠标下的单位
 * @param abilityID 技能ID
 * @param aPosition 鼠标位置
 * @returns
 */
function GetCursorEntity(_abilityID: AbilityEntityIndex, aPosition = GameUI.GetCursorPosition()) {
  //根据屏幕宽度计算判断距离
  const screenWidth = Game.GetScreenWidth();
  Game.GetScreenHeight();
  const judgeDistance = screenWidth / 20;
  let targets = FindRadiusScreenEntities(aPosition, judgeDistance);
  //优先精确碰撞的单位
  const targets1 = targets.filter((e) => {
    return e.accurateCollision;
  });
  const targets2 = targets.filter((e) => {
    return !e.accurateCollision;
  });
  targets = targets1;
  if (targets1.length === 0) {
    targets = targets2;
  }
  if (targets.length === 0) {
    return undefined;
  }
  targets.sort((a, b) => {
    const a_loc = GetEntScreenXY(a.entityIndex);
    const b_loc = GetEntScreenXY(b.entityIndex);
    const distance = ScreenLength(a_loc, aPosition) - ScreenLength(b_loc, aPosition);
    return distance;
  });
  return targets[0];
}

/**
 * 获取屏幕上指定半径内的单位
 * @param aPosition 中心点
 * @param radius 半径
 * @param pixel 像素间隔
 * @returns
 */
function FindRadiusScreenEntities(
  aPosition: [number, number],
  radius = 100,
  pixel = Math.ceil(radius / 2),
) {
  const targets: ScreenEntity[] = [];
  //以aPosition为中心，pixel为像素间隔，由内至外获取屏幕上的单位
  for (let i = 0; i <= radius; i += pixel) {
    for (let j = 0; j <= radius; j += pixel) {
      for (let k = 0; k <= 1; k++) {
        for (let l = 0; l <= 1; l++) {
          const x = k === 0 ? aPosition[0] + i : aPosition[0] - i;
          const y = l === 0 ? aPosition[1] + j : aPosition[1] - j;
          const screenEntities = GameUI.FindScreenEntities([x, y]);
          screenEntities.forEach((e) => {
            const exy = GetEntScreenXY(e.entityIndex);
            const screenLength = ScreenLength(exy, aPosition);
            if (screenLength < radius) {
              targets.push(e);
            }
          });
          if (targets.length > 0) {
            return targets;
          }
        }
      }
    }
  }
  return targets;
}

/**
 * 获取单位屏幕坐标
 * @param ent
 * @returns
 */
function GetEntScreenXY(ent: EntityIndex) {
  const pos = Entities.GetAbsOrigin(ent);
  //高度偏移为血条一半
  const offset = Entities.GetHealthBarOffset(ent);
  pos[2] += offset / 2;
  return WorldToScreenXY(pos);
}
/**
 * 屏幕坐标距离
 * @param pos1
 * @param pos2
 * @returns
 */
function ScreenLength(pos1: [number, number], pos2: [number, number]) {
  return Math.sqrt(Math.pow(pos1[0] - pos2[0], 2) + Math.pow(pos1[1] - pos2[1], 2));
}
/**
 * 世界坐标转换到屏幕坐标
 * @param pos
 * @returns
 */
function WorldToScreenXY(pos: [number, number, number]): [number, number] {
  let screenX = Game.WorldToScreenX(pos[0], pos[1], pos[2]);
  let screenY = Game.WorldToScreenY(pos[0], pos[1], pos[2]);
  if (screenX < 0) screenX = 0;
  if (screenX > Game.GetScreenWidth()) screenX = Game.GetScreenWidth();
  if (screenY < 0) screenY = 0;
  if (screenY > Game.GetScreenHeight()) screenY = Game.GetScreenHeight();
  return [screenX, screenY];
}

/**
 * 把玩家输入的键位显示在技能图标上
 */
export function saveInputKeyborard(abilityname: string | undefined, key: string) {
  if (!abilityname) {
    return;
  }
  if (key === '') {
    return;
  }
  const text = bindKeyToText(key);

  const heroID = Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID());
  const portraitUnitID = Players.GetLocalPlayerPortraitUnit();
  if (portraitUnitID !== heroID) {
    return;
  }
  //获取技能面板
  const abilities = FindDotaHudElement(`abilities`);
  if (!abilities) {
    return;
  }
  const abilityPanels = abilities.Children();

  // 查找改键技能面板
  const targetAbilityPanel = abilityPanels.find((abilityPanel) => {
    const abilityImage = abilityPanel.FindChildTraverse('AbilityImage') as AbilityImage | null;
    const currentAbilityName = abilityImage?.abilityname;
    return abilityname === currentAbilityName;
  });

  if (!targetAbilityPanel) {
    return;
  }

  const existingHotkey = findHotkeyTextCustomKey(targetAbilityPanel);
  if (existingHotkey !== text) {
    // 改键不同时才处理
    removeCustomHotkey(targetAbilityPanel);
    showCustomHotkey(targetAbilityPanel, text);
  }

  // 移除其他技能的改键（增减技能时，会错位）
  for (const abilityPanel of abilityPanels) {
    if (abilityPanel.BHasClass('Hidden')) {
      continue;
    }
    const abilityImage = abilityPanel.FindChildTraverse('AbilityImage') as AbilityImage | null;
    const currentAbilityName = abilityImage?.abilityname;
    if (abilityname === currentAbilityName) {
      continue;
    }
    removeCustomHotkey(abilityPanel);
  }
}

function findHotkeyTextCustomKey(abilityPanel: Panel) {
  const hotKeyLabelCustom = abilityPanel.FindChildTraverse(`HotkeyTextCustom`) as
    | LabelPanel
    | undefined;
  if (hotKeyLabelCustom) {
    return hotKeyLabelCustom.text;
  }
  return '';
}

function showCustomHotkey(abilityPanel: Panel, text: string) {
  const hotkey = abilityPanel.FindChildTraverse('Hotkey') as Panel | undefined;
  if (!hotkey) {
    return;
  }
  hotkey.style.visibility = 'visible';

  const hotKeyLabelCustom = $.CreatePanel('Label', hotkey, `HotkeyTextCustom`);
  hotKeyLabelCustom.text = text;
  hotKeyLabelCustom.style.fontSize = '12px';
  hotKeyLabelCustom.style.textShadow = '1px 1px 0px 2 #000000';
  hotKeyLabelCustom.style.margin = '0px 0px -2px 0px';
  hotKeyLabelCustom.style.horizontalAlign = 'center';
  hotKeyLabelCustom.style.textAlign = `center`;
  hotKeyLabelCustom.style.color = `#FFFFFF`;

  const hotKeyLabel = abilityPanel.FindChildTraverse('HotkeyText');
  if (hotKeyLabel) {
    hotKeyLabel.style.visibility = 'collapse';
  }
}

function removeCustomHotkey(abilityPanel: Panel) {
  const hotKeyLabelCustom = abilityPanel.FindChildTraverse(`HotkeyTextCustom`);
  if (hotKeyLabelCustom) {
    hotKeyLabelCustom.DeleteAsync(0);
  }

  const hotKeyLabel = abilityPanel.FindChildTraverse('HotkeyText');
  if (hotKeyLabel) {
    hotKeyLabel.style.visibility = 'visible';
  }
}

function bindKeyToText(key: string) {
  if (key === ' ') {
    return 'SPACE';
  }
  return key;
}
