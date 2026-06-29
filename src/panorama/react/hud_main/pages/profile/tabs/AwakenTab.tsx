import React, { useEffect, useState } from 'react';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { useNetTable } from '../../../../shared/hooks/useNetTable';
import { AwakenHeroCard } from './AwakenHeroCard';
import { AwakenRandomCard } from './AwakenRandomCard';
import { AwakenRandomCandidatesDialog } from './AwakenRandomCandidatesDialog';
import { AwakenUnlockConfirmDialog } from './AwakenUnlockConfirmDialog';

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
  {
    heroName: 'npc_dota_hero_monkey_king',
    abilityName: 'special_bonus_unique_monkey_king_upgrade',
  },
  {
    heroName: 'npc_dota_hero_winter_wyvern',
    abilityName: 'special_bonus_unique_winter_wyvern_upgrade',
  },
  { heroName: 'npc_dota_hero_ogre_magi', abilityName: 'ogre_magi_multicast_lua' },
];

// 与后端 hero-awakening 接口保持一致（固定消耗，不分英雄）
const HERO_AWAKEN_UNLOCK_COST = 10000;
// 随机抽选半价，与 api 价格表一致
const HERO_AWAKEN_RANDOM_COST = 5000;
// 随机抽选开放所需的最少剩余可觉醒英雄数，与 api 候选数一致
const AWAKEN_RANDOM_MIN_POOL = 3;
// 兜底：ack 事件丢包时仍能解除按钮锁定
const UNLOCK_PENDING_TIMEOUT_S = 15;

const ABILITY_BY_HERO: Record<string, string> = {};
for (const { heroName, abilityName } of AWAKEN_ABILITIES) {
  ABILITY_BY_HERO[heroName] = abilityName;
}

interface ConfirmTarget {
  heroName: string;
  abilityName: string;
  isRandom: boolean;
}

export function AwakenTab() {
  const steamId = GetLocalPlayerSteamAccountID();
  const player = useNetTable('player_table', steamId);
  const awakenedHeroes = player?.awakenedHeroes ?? [];
  const useableSeasonPoint = player?.useableSeasonPoint ?? 0;

  const randomData = useNetTable('awaken_random', steamId);
  const candidateNames = randomData?.candidates ? Object.values(randomData.candidates) : [];

  const [isPending, setIsPending] = useState(false);
  const [confirmHero, setConfirmHero] = useState<ConfirmTarget | null>(null);
  // 关闭候选层但不清空候选集（净表仍保留，再次点随机卡会复现同一组）
  const [candidatesDismissed, setCandidatesDismissed] = useState(false);

  useEffect(() => {
    const listener = GameEvents.Subscribe('awaken_unlock_result', () => {
      setIsPending(false);
    });
    return () => {
      GameEvents.Unsubscribe(listener);
    };
  }, []);

  const canAffordDirect = useableSeasonPoint >= HERO_AWAKEN_UNLOCK_COST;
  const canAffordRandom = useableSeasonPoint >= HERO_AWAKEN_RANDOM_COST;
  const remainingPool = AWAKEN_ABILITIES.filter(
    ({ heroName }) => !awakenedHeroes.some((h) => h.heroName === heroName),
  ).length;
  const hasEnoughPool = remainingPool >= AWAKEN_RANDOM_MIN_POOL;

  const showCandidates = candidateNames.length > 0 && !candidatesDismissed && !confirmHero;
  const candidates = candidateNames.map((heroName) => ({
    heroName,
    abilityName: ABILITY_BY_HERO[heroName] ?? '',
  }));

  const handleUnlockClick = (heroName: string, abilityName: string) => {
    if (isPending || !canAffordDirect) return;
    setConfirmHero({ heroName, abilityName, isRandom: false });
  };

  const handleRandomClick = () => {
    if (isPending || !canAffordRandom || !hasEnoughPool) return;
    setCandidatesDismissed(false);
    GameEvents.SendCustomGameEventToServer('awaken_random_request', {});
  };

  const handleCandidateSelect = (heroName: string, abilityName: string) => {
    setConfirmHero({ heroName, abilityName, isRandom: true });
  };

  const handleConfirm = () => {
    if (!confirmHero) return;
    const { heroName, isRandom } = confirmHero;
    setConfirmHero(null);
    setIsPending(true);
    if (isRandom) {
      setCandidatesDismissed(true);
      GameEvents.SendCustomGameEventToServer('awaken_random_confirm', { heroName });
    } else {
      GameEvents.SendCustomGameEventToServer('awaken_unlock_hero', { heroName });
    }
    $.Schedule(UNLOCK_PENDING_TIMEOUT_S, () => setIsPending(false));
  };

  return (
    <Panel className="awaken-root">
      <Panel className="awaken-layout">
        <Panel className="awaken-intro">
          <DOTAItemImage className="awaken-intro-icon" itemname="item_awaken_stone" />
          <Label
            className="awaken-intro-text"
            html={true}
            text={$.Localize('#awaken_intro_desc')}
          />
        </Panel>
        <Panel className="awaken-intro">
          <Label
            className="awaken-intro-text"
            html={true}
            text={$.Localize('#awaken_unlock_intro_desc')}
          />
        </Panel>
        <Panel className="awaken-grid">
          <AwakenRandomCard
            enabled={!isPending && canAffordRandom && hasEnoughPool}
            canAfford={canAffordRandom}
            hasEnoughPool={hasEnoughPool}
            onClick={handleRandomClick}
          />
          {AWAKEN_ABILITIES.map(({ heroName, abilityName }) => (
            <AwakenHeroCard
              key={abilityName}
              heroName={heroName}
              abilityName={abilityName}
              isUnlocked={awakenedHeroes.some((h) => h.heroName === heroName)}
              enabled={!isPending && canAffordDirect}
              canAfford={canAffordDirect}
              onUnlockClick={handleUnlockClick}
            />
          ))}
        </Panel>
      </Panel>
      {showCandidates && (
        <AwakenRandomCandidatesDialog
          candidates={candidates}
          onSelect={handleCandidateSelect}
          onClose={() => setCandidatesDismissed(true)}
        />
      )}
      {confirmHero && (
        <AwakenUnlockConfirmDialog
          heroName={confirmHero.heroName}
          abilityName={confirmHero.abilityName}
          descKey={
            confirmHero.isRandom ? '#awaken_random_confirm_desc' : '#awaken_unlock_confirm_desc'
          }
          onConfirm={handleConfirm}
          onCancel={() => setConfirmHero(null)}
        />
      )}
    </Panel>
  );
}
