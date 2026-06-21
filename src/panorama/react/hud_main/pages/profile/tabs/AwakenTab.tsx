import React, { useEffect, useState } from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { PrimaryButton } from '../../../../shared/components';
import { useNetTable } from '../../../../shared/hooks/useNetTable';

/**
 * 觉醒 Tab：觉醒技能预览墙 + 积分解锁入口。
 * 列表与 src/common 无关，是 vscripts awaken-config 中 ABILITY_REPLACEMENTS 的展示副本，
 * 增删觉醒英雄时需同步此处。每张卡复用引擎现成资源（英雄头像 + 觉醒图标自带本地化 tooltip）。
 */
const AWAKEN_ABILITIES: { heroName: string; abilityName: string }[] = [
  { heroName: 'npc_dota_hero_pudge', abilityName: 'pudge_meat_hook_lua' },
  { heroName: 'npc_dota_hero_juggernaut', abilityName: 'juggernaut_blade_fury_custom' },
  {
    heroName: 'npc_dota_hero_sniper',
    abilityName: 'special_bonus_unique_sniper_assassinate_upgrade',
  },
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

// 与后端 hero-awakening 接口保持一致（固定消耗，不分英雄）
const HERO_AWAKEN_UNLOCK_COST = 10000;
// 兜底：ack 事件丢包时仍能解除按钮锁定
const UNLOCK_PENDING_TIMEOUT_S = 15;

export function AwakenTab() {
  const steamId = GetLocalPlayerSteamAccountID();
  const player = useNetTable('player_table', steamId);
  const awakenedHeroes = player?.awakenedHeroes ?? [];
  const useableSeasonPoint = player?.useableSeasonPoint ?? 0;
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const listener = GameEvents.Subscribe('awaken_unlock_result', () => {
      setIsPending(false);
    });
    return () => {
      GameEvents.Unsubscribe(listener);
    };
  }, []);

  const canAfford = useableSeasonPoint >= HERO_AWAKEN_UNLOCK_COST;
  const unlockTooltipText = canAfford
    ? $.Localize('#awaken_unlock_tooltip_confirm').replace(
        '{cost}',
        HERO_AWAKEN_UNLOCK_COST.toString(),
      )
    : $.Localize('#awaken_unlock_tooltip_insufficient')
        .replace('{cost}', HERO_AWAKEN_UNLOCK_COST.toString())
        .replace('{current}', useableSeasonPoint.toString());

  const handleUnlockClick = (heroName: string) => {
    if (isPending || !canAfford) return;
    setIsPending(true);
    GameEvents.SendCustomGameEventToServer('awaken_unlock_hero', { heroName });
    $.Schedule(UNLOCK_PENDING_TIMEOUT_S, () => setIsPending(false));
  };

  return (
    <Panel className="awaken-layout">
      <Panel className="awaken-intro">
        <DOTAItemImage className="awaken-intro-icon" itemname="item_awaken_stone" />
        <Label className="awaken-intro-text" html={true} text={$.Localize('#awaken_intro_desc')} />
      </Panel>
      <Panel className="awaken-intro">
        <Label
          className="awaken-intro-text"
          html={true}
          text={$.Localize('#awaken_unlock_intro_desc')}
        />
      </Panel>
      <Panel className="awaken-grid">
        {AWAKEN_ABILITIES.map(({ heroName, abilityName }) => {
          const isUnlocked = awakenedHeroes.some((h) => h.heroName === heroName);

          return (
            <Panel key={abilityName} className="awaken-card">
              <DOTAHeroImage
                className="awaken-hero"
                heroname={heroName}
                heroimagestyle="portrait"
              />
              <Panel className="awaken-scrim" />
              <Panel className="awaken-bottom">
                <DOTAAbilityImage
                  className="awaken-ability-icon"
                  abilityname={abilityName}
                  showtooltip={true}
                />
                {isUnlocked ? (
                  <Label className="awaken-hero-name" text={$.Localize('#' + heroName)} />
                ) : (
                  <PrimaryButton
                    className="awaken-unlock-btn"
                    enabled={!isPending && canAfford}
                    onClick={() => handleUnlockClick(heroName)}
                    tooltipText={unlockTooltipText}
                    label={$.Localize('#awaken_unlock_button')}
                  />
                )}
              </Panel>
            </Panel>
          );
        })}
      </Panel>
    </Panel>
  );
}
