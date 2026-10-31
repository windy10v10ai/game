import { BotHeroEntry, GetRoleCaps, HeroRole, PickBalancedHeroIndex } from './balanced-pick';
import { BOT_HERO_POOL } from './bot-hero-pool';

const { Control, Support, Tank, Carry } = HeroRole;

const randomInt = (max: number) => Math.floor(Math.random() * max);

function pickTeam(
  pool: BotHeroEntry[],
  size: number,
  isSinglePlayer: boolean,
  seed: HeroRole[][] = [],
) {
  const candidates = [...pool];
  const teamRoles = [...seed];
  const caps = GetRoleCaps(size, isSinglePlayer);
  while (teamRoles.length < size) {
    const [hero] = candidates.splice(
      PickBalancedHeroIndex(candidates, teamRoles, caps, randomInt),
      1,
    );
    teamRoles.push(hero.roles);
  }
  return teamRoles;
}

const countRole = (teamRoles: HeroRole[][], role: HeroRole) =>
  teamRoles.filter((roles) => roles.includes(role)).length;

describe('GetRoleCaps', () => {
  it('单人对局控制上限比多人更紧', () => {
    expect(GetRoleCaps(10, true)[Control]).toBe(3);
    expect(GetRoleCaps(10, false)[Control]).toBe(4);
  });

  it('按队伍人数缩放并向上取整', () => {
    expect(GetRoleCaps(5, true)).toEqual({ [Control]: 2, [Support]: 3, [Tank]: 2, [Carry]: 3 });
  });
});

describe('PickBalancedHeroIndex', () => {
  it('10 人队控制英雄不超过上限', () => {
    for (let i = 0; i < 200; i++) {
      expect(countRole(pickTeam(BOT_HERO_POOL, 10, true), Control)).toBeLessThanOrEqual(3);
      expect(countRole(pickTeam(BOT_HERO_POOL, 10, false), Control)).toBeLessThanOrEqual(4);
    }
  });

  it('已在队里的英雄计入上限', () => {
    const seed = [[Control], [Control], [Control]];
    for (let i = 0; i < 50; i++) {
      expect(countRole(pickTeam(BOT_HERO_POOL, 10, true, seed), Control)).toBe(3);
    }
  });

  it('所有候选都会超限时仍能选出，优先不超控制', () => {
    const candidates: BotHeroEntry[] = [
      { name: 'a', roles: [Control] },
      { name: 'b', roles: [Carry, Tank] },
    ];
    const caps = GetRoleCaps(10, true);
    const teamRoles = [
      [Control],
      [Control],
      [Control],
      [Carry, Tank],
      [Carry, Tank],
      [Carry, Tank],
      [Carry, Tank],
    ];
    for (let i = 0; i < 20; i++) {
      expect(PickBalancedHeroIndex(candidates, teamRoles, caps, randomInt)).toBe(1);
    }
  });
});
