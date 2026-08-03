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
// 新加的英雄排在前面，旧的排在后面（随机卡固定第一个，不受此列表顺序影响）
// freeTrial 与 vscripts awaken-config 的 FREE_TRIAL_HEROES 对应，同样需手动同步
const AWAKEN_ABILITIES: { heroName: string; abilityName: string; freeTrial?: boolean }[] = [
  {
    heroName: 'npc_dota_hero_beastmaster',
    abilityName: 'beastmaster_wild_axes_awaken',
    freeTrial: true,
  },
  {
    heroName: 'npc_dota_hero_dazzle',
    abilityName: 'special_bonus_unique_dazzle_upgrade',
    freeTrial: true,
  },
  {
    heroName: 'npc_dota_hero_elder_titan',
    abilityName: 'elder_titan_ancestral_spirit_awaken',
    freeTrial: true,
  },
  {
    heroName: 'npc_dota_hero_techies',
    abilityName: 'techies_squees_scope',
    freeTrial: true,
  },
  {
    heroName: 'npc_dota_hero_undying',
    abilityName: 'special_bonus_unique_undying_upgrade',
    freeTrial: true,
  },
  {
    heroName: 'npc_dota_hero_lich',
    abilityName: 'special_bonus_unique_lich_upgrade',
    freeTrial: true,
  },
  {
    heroName: 'npc_dota_hero_doom_bringer',
    abilityName: 'doom_bringer_doom_awakened',
    freeTrial: true,
  },
  {
    heroName: 'npc_dota_hero_keeper_of_the_light',
    abilityName: 'special_bonus_unique_keeper_of_the_light_upgrade',
    freeTrial: true,
  },
  {
    heroName: 'npc_dota_hero_crystal_maiden',
    abilityName: 'special_bonus_unique_crystal_maiden_upgrade',
    freeTrial: true,
  },
  {
    heroName: 'npc_dota_hero_tiny',
    abilityName: 'special_bonus_unique_tiny_upgrade',
    freeTrial: true,
  },
  {
    heroName: 'npc_dota_hero_legion_commander',
    abilityName: 'legion_commander_auto_duel',
  },
  {
    heroName: 'npc_dota_hero_phoenix',
    abilityName: 'special_bonus_unique_phoenix_upgrade',
  },
  {
    heroName: 'npc_dota_hero_warlock',
    abilityName: 'special_bonus_unique_warlock_upgrade',
  },
  {
    heroName: 'npc_dota_hero_sven',
    abilityName: 'special_bonus_unique_sven_upgrade',
  },
  {
    heroName: 'npc_dota_hero_rattletrap',
    abilityName: 'special_bonus_unique_rattletrap_upgrade',
  },
  {
    heroName: 'npc_dota_hero_windrunner',
    abilityName: 'windrunner_whirlwind_custom',
  },
  { heroName: 'npc_dota_hero_kunkka', abilityName: 'kunkka_torrent_storm' },
  { heroName: 'npc_dota_hero_ogre_magi', abilityName: 'ogre_magi_multicast_lua' },
  {
    heroName: 'npc_dota_hero_winter_wyvern',
    abilityName: 'special_bonus_unique_winter_wyvern_upgrade',
  },
  {
    heroName: 'npc_dota_hero_monkey_king',
    abilityName: 'special_bonus_unique_monkey_king_upgrade',
  },
  { heroName: 'npc_dota_hero_lina', abilityName: 'special_bonus_unique_lina_upgrade' },
  {
    heroName: 'npc_dota_hero_bristleback',
    abilityName: 'special_bonus_unique_bristleback_upgrade',
  },
  {
    heroName: 'npc_dota_hero_drow_ranger',
    abilityName: 'special_bonus_unique_drow_ranger_upgrade',
  },
  { heroName: 'npc_dota_hero_nevermore', abilityName: 'special_bonus_unique_nevermore_upgrade' },
  {
    heroName: 'npc_dota_hero_witch_doctor',
    abilityName: 'special_bonus_unique_witch_doctor_upgrade',
  },
  {
    heroName: 'npc_dota_hero_phantom_assassin',
    abilityName: 'special_bonus_unique_phantom_assassin_upgrade',
  },
  { heroName: 'npc_dota_hero_zuus', abilityName: 'special_bonus_unique_zuus_upgrade' },
  { heroName: 'npc_dota_hero_necrolyte', abilityName: 'necrolyte_heartstopper_aura_datadriven' },
  { heroName: 'npc_dota_hero_axe', abilityName: 'axe_auto_culling_blade' },
  {
    heroName: 'npc_dota_hero_sniper',
    abilityName: 'special_bonus_unique_sniper_assassinate_upgrade',
  },
  { heroName: 'npc_dota_hero_juggernaut', abilityName: 'juggernaut_blade_fury_custom' },
  { heroName: 'npc_dota_hero_pudge', abilityName: 'pudge_meat_hook_lua' },
];

// 与后端 hero-awakening 接口保持一致（固定消耗，不分英雄）
const HERO_AWAKEN_UNLOCK_COST_SEASON = 10000;
// 随机抽选半价，与 api 价格表一致
const HERO_AWAKEN_RANDOM_COST_SEASON = 5000;
// 会员积分档，与 api 价格表一致
const HERO_AWAKEN_UNLOCK_COST_MEMBER = 4000;
const HERO_AWAKEN_RANDOM_COST_MEMBER = 2000;
// 随机抽选开放所需的最少剩余可觉醒英雄数，与 api 候选数一致
const AWAKEN_RANDOM_MIN_POOL = 3;
// 兜底：ack 事件丢包时仍能解除按钮锁定
const UNLOCK_PENDING_TIMEOUT_S = 15;

const ABILITY_BY_HERO: Record<string, string> = {};
for (const { heroName, abilityName } of AWAKEN_ABILITIES) {
  ABILITY_BY_HERO[heroName] = abilityName;
}
// 候选层滚动动画闪过的英雄池
const ROLL_POOL = AWAKEN_ABILITIES.map((a) => a.heroName);

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
  const useableMemberPoint = player?.useableMemberPoint ?? 0;

  const randomData = useNetTable('awaken_random', steamId);
  const candidateNames = randomData?.candidates ? Object.values(randomData.candidates) : [];

  const [isPending, setIsPending] = useState(false);
  const [confirmHero, setConfirmHero] = useState<ConfirmTarget | null>(null);
  // 候选层仅在本次点随机卡后显式打开，避免重开页面时凭净表残留候选自动弹出
  const [candidatesOpen, setCandidatesOpen] = useState(false);

  useEffect(() => {
    const listener = GameEvents.Subscribe('awaken_unlock_result', () => {
      setIsPending(false);
    });
    return () => {
      GameEvents.Unsubscribe(listener);
    };
  }, []);

  // 卡片可点判定：任一种积分够即可，具体花哪种在确认弹窗里选
  const canAffordDirect =
    useableSeasonPoint >= HERO_AWAKEN_UNLOCK_COST_SEASON ||
    useableMemberPoint >= HERO_AWAKEN_UNLOCK_COST_MEMBER;
  const canAffordRandom =
    useableSeasonPoint >= HERO_AWAKEN_RANDOM_COST_SEASON ||
    useableMemberPoint >= HERO_AWAKEN_RANDOM_COST_MEMBER;
  const remainingPool = AWAKEN_ABILITIES.filter(
    ({ heroName }) => !awakenedHeroes.some((h) => h.heroName === heroName),
  ).length;
  const hasEnoughPool = remainingPool >= AWAKEN_RANDOM_MIN_POOL;

  // 点开即显示（先滚动），候选到达后定格；确认弹窗叠在其上，故不因 confirmHero 卸载，避免取消后重新滚动
  const showCandidates = candidatesOpen;
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
    setCandidatesOpen(true);
    GameEvents.SendCustomGameEventToServer('awaken_random_request', {});
  };

  const handleCandidateSelect = (heroName: string, abilityName: string) => {
    setConfirmHero({ heroName, abilityName, isRandom: true });
  };

  const handleConfirm = (useMemberPoint: boolean) => {
    if (!confirmHero) return;
    const { heroName, isRandom } = confirmHero;
    setConfirmHero(null);
    setIsPending(true);
    // 随机认领与直购共用同一事件，半价由 API 按是否命中候选集派生；随机时先收起候选层
    if (isRandom) {
      setCandidatesOpen(false);
    }
    GameEvents.SendCustomGameEventToServer('awaken_unlock_hero', {
      heroName,
      useMemberPoint: useMemberPoint ? 1 : 0,
    });
    $.Schedule(UNLOCK_PENDING_TIMEOUT_S, () => setIsPending(false));
  };

  return (
    <Panel className="awaken-root">
      <Panel className="awaken-layout">
        <Panel className="awaken-intro">
          <Panel className="awaken-intro-col awaken-intro-col-left">
            <Panel className="awaken-intro-col-header">
              <DOTAItemImage className="awaken-intro-icon" itemname="item_awaken_stone" />
              <Label className="awaken-intro-title" text={$.Localize('#awaken_intro_title')} />
            </Panel>
            <Label
              className="awaken-intro-text"
              html={true}
              text={$.Localize('#awaken_intro_desc')}
            />
          </Panel>
          <Panel className="awaken-intro-divider" />
          <Panel className="awaken-intro-col">
            <Panel className="awaken-intro-col-header">
              <Label
                className="awaken-intro-title"
                text={$.Localize('#awaken_unlock_intro_title')}
              />
            </Panel>
            <Label
              className="awaken-intro-text"
              html={true}
              text={$.Localize('#awaken_unlock_intro_desc')}
            />
          </Panel>
        </Panel>
        <Panel className="awaken-grid">
          <AwakenRandomCard
            enabled={!isPending && canAffordRandom && hasEnoughPool}
            canAfford={canAffordRandom}
            hasEnoughPool={hasEnoughPool}
            onClick={handleRandomClick}
          />
          {AWAKEN_ABILITIES.map(({ heroName, abilityName, freeTrial }) => {
            const isUnlocked = awakenedHeroes.some((h) => h.heroName === heroName);
            return (
              <AwakenHeroCard
                key={abilityName}
                heroName={heroName}
                abilityName={abilityName}
                isUnlocked={isUnlocked}
                // 已买断的玩家不需要再看到限免提示
                isFreeTrial={freeTrial === true && !isUnlocked}
                enabled={!isPending && canAffordDirect}
                canAfford={canAffordDirect}
                onUnlockClick={handleUnlockClick}
              />
            );
          })}
        </Panel>
      </Panel>
      {showCandidates && (
        <AwakenRandomCandidatesDialog
          candidates={candidates}
          rollPool={ROLL_POOL}
          onSelect={handleCandidateSelect}
          onClose={() => setCandidatesOpen(false)}
        />
      )}
      {confirmHero && (
        <AwakenUnlockConfirmDialog
          heroName={confirmHero.heroName}
          abilityName={confirmHero.abilityName}
          descKey={
            confirmHero.isRandom ? '#awaken_random_confirm_desc' : '#awaken_unlock_confirm_desc'
          }
          seasonCost={
            confirmHero.isRandom ? HERO_AWAKEN_RANDOM_COST_SEASON : HERO_AWAKEN_UNLOCK_COST_SEASON
          }
          memberCost={
            confirmHero.isRandom ? HERO_AWAKEN_RANDOM_COST_MEMBER : HERO_AWAKEN_UNLOCK_COST_MEMBER
          }
          canAffordSeason={
            useableSeasonPoint >=
            (confirmHero.isRandom ? HERO_AWAKEN_RANDOM_COST_SEASON : HERO_AWAKEN_UNLOCK_COST_SEASON)
          }
          canAffordMember={
            useableMemberPoint >=
            (confirmHero.isRandom ? HERO_AWAKEN_RANDOM_COST_MEMBER : HERO_AWAKEN_UNLOCK_COST_MEMBER)
          }
          onConfirm={handleConfirm}
          onCancel={() => setConfirmHero(null)}
        />
      )}
    </Panel>
  );
}
