import { useEffect, useRef, useState } from 'react';
import { PrimaryButton } from '../../../../shared/components';

interface Candidate {
  heroName: string;
  abilityName: string;
}

interface AwakenRandomCandidatesDialogProps {
  candidates: Candidate[];
  // 滚动时闪过的英雄池（觉醒英雄全集）
  rollPool: string[];
  onSelect: (heroName: string, abilityName: string) => void;
  onClose: () => void;
}

const SLOTS = [0, 1, 2];
// 每次轮播间隔（秒），递增实现减速，尾部放慢制造“临停”感；总时长约 3.6s
const ROLL_DELAYS = [0.05, 0.06, 0.07, 0.08, 0.1, 0.13, 0.16, 0.2, 0.25, 0.32, 0.4, 0.5, 0.6, 0.7];
// 跑完后若候选仍未到，按此（与尾部同档的慢速）继续闪等待，避免“慢下来又突然变快”
const ROLL_SLOW_DELAY = 0.6;
// 候选始终不到的兜底：超时直接关闭，避免无限滚动
const ROLL_MAX_WAIT = 8;

function pickHeroes(pool: string[], count: number): string[] {
  const copy = pool.slice();
  const out: string[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const index = Math.floor(Math.random() * copy.length);
    out.push(copy[index]);
    copy.splice(index, 1);
  }
  return out;
}

/**
 * 随机抽选候选层：点开即老虎机式轮播随机英雄、减速后定格到 API 返回的候选。
 * 纯 JS 驱动（只改 heroname），不依赖任何 CSS 动画；轮播天然盖住抽选请求的网络延迟。
 * 选 1 个进入确认，关闭/退出免费、无副作用。
 */
export function AwakenRandomCandidatesDialog({
  candidates,
  rollPool,
  onSelect,
  onClose,
}: AwakenRandomCandidatesDialogProps) {
  const [displayHeroes, setDisplayHeroes] = useState<string[]>(() =>
    pickHeroes(rollPool, SLOTS.length),
  );
  const [settled, setSettled] = useState(false);
  // 滚动 tick 异步读取最新候选与 onClose；ref 在 effect 中同步，避免 render 期间写 ref
  const candidatesRef = useRef(candidates);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    candidatesRef.current = candidates;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    let cancelled = false;
    let tickIndex = 0;
    let elapsed = 0;
    const tick = () => {
      if (cancelled) return;
      const ready = candidatesRef.current.length >= SLOTS.length;
      const rollDone = tickIndex >= ROLL_DELAYS.length;
      if (rollDone && ready) {
        setDisplayHeroes(candidatesRef.current.map((c) => c.heroName));
        setSettled(true);
        return;
      }
      if (elapsed >= ROLL_MAX_WAIT) {
        onCloseRef.current();
        return;
      }
      setDisplayHeroes(pickHeroes(rollPool, SLOTS.length));
      const delay = rollDone ? ROLL_SLOW_DELAY : ROLL_DELAYS[tickIndex];
      tickIndex++;
      elapsed += delay;
      $.Schedule(delay, tick);
    };
    tick();
    return () => {
      cancelled = true;
    };
    // 滚动仅在挂载时启动一次；rollPool 为稳定常量，不放依赖避免重启滚动
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Panel className="awaken-confirm-overlay" onactivate={onClose}>
      <Panel className="awaken-candidates-dialog" onactivate={() => {}}>
        <Label
          className="awaken-candidates-title"
          text={$.Localize('#awaken_random_candidates_title')}
        />
        <Label
          className="awaken-candidates-desc"
          html={true}
          text={$.Localize('#awaken_random_candidates_desc')}
        />
        <Panel className="awaken-candidates-row">
          {SLOTS.map((i) => {
            const heroName = displayHeroes[i] ?? '';
            const candidate = settled ? candidates[i] : undefined;
            return (
              <Panel key={i} className="awaken-card">
                <DOTAHeroImage
                  className="awaken-hero"
                  heroname={heroName}
                  heroimagestyle="portrait"
                />
                <Panel className="awaken-top-scrim" />
                <Label
                  className="awaken-hero-name-top"
                  style={{ visibility: settled ? 'visible' : 'collapse' }}
                  text={candidate ? $.Localize('#' + candidate.heroName) : ''}
                />
                <Panel className="awaken-scrim" />
                <Panel
                  className="awaken-bottom"
                  style={{ visibility: settled ? 'visible' : 'collapse' }}
                >
                  <DOTAAbilityImage
                    className="awaken-ability-icon"
                    abilityname={candidate ? candidate.abilityName : ''}
                    showtooltip={true}
                  />
                  <PrimaryButton
                    className="awaken-unlock-btn"
                    onClick={() => candidate && onSelect(candidate.heroName, candidate.abilityName)}
                    label={$.Localize('#awaken_random_select_button')}
                  />
                </Panel>
              </Panel>
            );
          })}
        </Panel>
      </Panel>
    </Panel>
  );
}
