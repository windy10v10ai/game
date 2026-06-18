import React from 'react';

/**
 * 觉醒 Tab：觉醒技能预览墙。
 * 列表与 src/common 无关，是 vscripts awaken-config 中 ABILITY_REPLACEMENTS 的展示副本，
 * 增删觉醒英雄时需同步此处。每张卡复用引擎现成资源（英雄头像 + 觉醒图标自带本地化 tooltip）。
 */
const AWAKEN_ABILITIES: { heroName: string; abilityName: string }[] = [
  { heroName: 'npc_dota_hero_pudge', abilityName: 'pudge_meat_hook_lua' },
  { heroName: 'npc_dota_hero_juggernaut', abilityName: 'juggernaut_blade_fury_custom' },
  { heroName: 'npc_dota_hero_sniper', abilityName: 'special_bonus_unique_sniper_assassinate_upgrade' },
  { heroName: 'npc_dota_hero_axe', abilityName: 'axe_auto_culling_blade' },
  { heroName: 'npc_dota_hero_necrolyte', abilityName: 'necrolyte_heartstopper_aura_datadriven' },
  { heroName: 'npc_dota_hero_zuus', abilityName: 'special_bonus_unique_zuus_upgrade' },
  {
    heroName: 'npc_dota_hero_phantom_assassin',
    abilityName: 'special_bonus_unique_phantom_assassin_upgrade',
  },
  {
    heroName: 'npc_dota_hero_witch_doctor',
    abilityName: 'special_bonus_unique_witch_doctor_upgrade',
  },
  { heroName: 'npc_dota_hero_nevermore', abilityName: 'special_bonus_unique_nevermore_upgrade' },
  {
    heroName: 'npc_dota_hero_drow_ranger',
    abilityName: 'special_bonus_unique_drow_ranger_upgrade',
  },
  {
    heroName: 'npc_dota_hero_bristleback',
    abilityName: 'special_bonus_unique_bristleback_upgrade',
  },
  { heroName: 'npc_dota_hero_lina', abilityName: 'special_bonus_unique_lina_upgrade' },
];

export function AwakenTab() {
  return (
    <Panel className="awaken-layout">
      <Panel className="awaken-intro">
        <DOTAItemImage className="awaken-intro-icon" itemname="item_awaken_stone" />
        <Label className="awaken-intro-text" html={true} text={$.Localize('#awaken_intro_desc')} />
      </Panel>
      <Panel className="awaken-grid">
        {AWAKEN_ABILITIES.map(({ heroName, abilityName }) => (
          <Panel key={abilityName} className="awaken-card">
            <DOTAHeroImage className="awaken-hero" heroname={heroName} heroimagestyle="portrait" />
            <Panel className="awaken-scrim" />
            <Panel className="awaken-bottom">
              <DOTAAbilityImage
                className="awaken-ability-icon"
                abilityname={abilityName}
                showtooltip={true}
              />
              <Label className="awaken-hero-name" text={$.Localize('#' + heroName)} />
            </Panel>
          </Panel>
        ))}
      </Panel>
    </Panel>
  );
}
