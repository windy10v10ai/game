'use strict';

/**
 * 抽选来的额外技能不在英雄自己的技能列表里，原生悬停提示会把阿哈利姆神杖栏显示成「未找到升级效果」、魔晶栏留空。
 * 这里在提示出现后，用原生的说明控件结构和本地化文案把两栏补上，样式沿用原生。
 */
(function () {
  var MAX_ABILITY_SLOTS = 35;
  var SHARD_BUFF = 'modifier_item_aghanims_shard';
  var SNIPPET = 'AghsScepterSnippet';
  var MARKER_CLASS = 'AghsTooltipFix';

  var KINDS = {
    scepter: {
      descriptionId: 'ScepterUpgradeDescription',
      statusId: 'AghsStatusScepterContainer',
      iconId: 'AghsStatusScepterIcon',
      ownedClass: 'HeroHasScepter',
      inlineClass: 'InlineScepterDescription',
      itemToken: '#DOTA_Tooltip_ability_item_ultimate_scepter',
    },
    shard: {
      descriptionId: 'ShardUpgradeDescription',
      statusId: 'AghsStatusShardContainer',
      iconId: 'AghsStatusShardIcon',
      ownedClass: 'HeroHasShard',
      inlineClass: 'InlineShardDescription',
      itemToken: '#DOTA_Tooltip_ability_item_aghanims_shard',
    },
  };

  var root = $.GetContextPanel();
  while (root.GetParent()) root = root.GetParent();

  // 热重载后旧实例的轮询要停掉，否则会按旧逻辑继续改提示
  var instance = ($.GetContextPanel().aghsFixInstance || 0) + 1;
  $.GetContextPanel().aghsFixInstance = instance;

  var tooltipPanel = null;
  var tooltipShown = false;
  var lastTitle = null;

  function localize(token) {
    var text = $.Localize(token);
    if (!text || text === token || text.indexOf('DOTA_Tooltip') >= 0) return null;
    return text;
  }

  function formatValue(value) {
    return String(parseFloat(value.toFixed(2)));
  }

  function fillPlaceholders(text, abilityEntity) {
    return text
      .replace(/%([A-Za-z0-9_]+)%/g, function (match, key) {
        var value = Abilities.GetSpecialValueFor(abilityEntity, key);
        return value === undefined || value === null ? match : formatValue(value);
      })
      .replace(/%%/g, '%');
  }

  function hasShard(unit) {
    for (var i = 0; i < Entities.GetNumBuffs(unit); i++) {
      if (Buffs.GetName(unit, Entities.GetBuff(unit, i)) === SHARD_BUFF) return true;
    }
    return false;
  }

  // 提示面板只给了本地化后的技能名，靠它在当前选中单位的技能里反查
  function findHoveredAbility(unit, title) {
    for (var i = 0; i < MAX_ABILITY_SLOTS; i++) {
      var ability = Entities.GetAbility(unit, i);
      if (ability === -1) continue;
      var name = Abilities.GetAbilityName(ability);
      if ($.Localize('#DOTA_Tooltip_ability_' + name) === title)
        return { entity: ability, name: name };
    }
    return null;
  }

  // 原生写法有 _description 与 _Description 两种大小写，本地化接口按原样匹配
  function upgradeText(name, kind, abilityEntity) {
    var base = '#DOTA_Tooltip_ability_' + name + '_' + kind + '_';
    var text = localize(base + 'description') || localize(base + 'Description');
    return text === null ? null : fillPlaceholders(text, abilityEntity);
  }

  // 原生已经有说明时最前面是标题行控件，没有时只有一行「未找到」
  function isNativeFilled(desc, kind) {
    return !!desc.FindChildTraverse(KINDS[kind].statusId);
  }

  function hideCosts(costs) {
    costs.AddClass('Hidden');
    costs.visible = false;
    for (var i = 0; i < costs.GetChildCount(); i++) costs.GetChild(i).AddClass('Hidden');
  }

  function buildDescription(desc, kind, text, owned) {
    var cfg = KINDS[kind];
    desc.RemoveAndDeleteChildren();

    var header = $.CreatePanel('Panel', desc, '');
    header.style.flowChildren = 'right';
    var status = $.CreatePanel('Panel', header, cfg.statusId);
    $.CreatePanel('Panel', status, cfg.iconId);
    var title = $.CreatePanel('Label', header, '');
    title.text = $.Localize(cfg.itemToken);
    title.style.fontSize = '20px';
    title.style.marginLeft = '10px';

    desc.BLoadLayoutSnippet(SNIPPET);
    var body = desc.GetChild(1);
    var inner = body.GetChild(1);
    body.GetChild(0).visible = false;
    inner.GetChild(0).visible = false;
    var label = inner.GetChild(1);
    label.html = true;
    label.text = text;

    hideCosts(inner.GetChild(3));
    desc.SetHasClass('NoUpgrade', false);
    desc.SetHasClass('Hidden', false);
    desc.SetHasClass(cfg.ownedClass, owned);
    desc.SetHasClass(cfg.inlineClass, true);
    desc.AddClass('AghsDescriptionContents');
    desc.AddClass(MARKER_CLASS);
    desc.visible = true;
  }

  function patchKind(tooltip, hovered, kind, owned) {
    var desc = tooltip.FindChildTraverse(KINDS[kind].descriptionId);
    if (!desc) return;
    var ours = desc.BHasClass(MARKER_CLASS);
    if (!ours && isNativeFilled(desc, kind)) return;
    var text = upgradeText(hovered.name, kind, hovered.entity);
    if (text !== null) {
      buildDescription(desc, kind, text, owned);
    } else if (ours) {
      // 上一个技能留下的补丁内容不能带到没有说明的技能上
      desc.RemoveAndDeleteChildren();
      desc.RemoveClass(MARKER_CLASS);
    }
  }

  function patch(tooltip) {
    var unit = Players.GetLocalPlayerPortraitUnit();
    var titleLabel = tooltip.FindChildTraverse('AbilityName');
    if (unit === -1 || !titleLabel) return;
    var hovered = findHoveredAbility(unit, titleLabel.text);
    if (!hovered) return;
    patchKind(tooltip, hovered, 'scepter', Entities.HasScepter(unit));
    patchKind(tooltip, hovered, 'shard', hasShard(unit));
  }

  function poll() {
    if ($.GetContextPanel().aghsFixInstance !== instance) return;
    if (!tooltipPanel) tooltipPanel = root.FindChildTraverse('DOTAAbilityTooltip');
    var tooltip = tooltipPanel;
    var shown = !!tooltip && tooltip.visible;
    var titleLabel = shown ? tooltip.FindChildTraverse('AbilityName') : null;
    var title = titleLabel ? titleLabel.text : null;
    if (shown && (!tooltipShown || title !== lastTitle)) {
      // 原生内容在显示后才填入，等一帧再改
      $.Schedule(0.1, function () {
        try {
          patch(tooltip);
        } catch (e) {
          // 游戏更新改了原生控件结构时，保持原生提示不报错
          $.Msg('[aghs_tooltip_fix] ' + e);
        }
      });
    }
    tooltipShown = shown;
    lastTitle = title;
    $.Schedule(0.2, poll);
  }
  poll();
})();
