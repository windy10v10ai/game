import {
  DailyChallengeOwnershipDependencies,
  DailyChallengeOwnedEntity,
  resolveDailyChallengeHumanPlayerId,
} from './daily-challenge-ownership';

const deps: DailyChallengeOwnershipDependencies = {
  isValidPlayerId: (playerId): playerId is PlayerID => playerId >= 0 && playerId < 24,
  isFakeClient: (playerId) => playerId === (8 as PlayerID),
  getSteamAccountId: (playerId) => (playerId === (3 as PlayerID) ? 483215844 : 0),
};

const entity = (
  playerId: number,
  owner?: DailyChallengeOwnedEntity,
): DailyChallengeOwnedEntity => ({
  GetPlayerOwnerID: () => playerId as PlayerID,
  GetOwnerEntity: () => owner,
});

describe('resolveDailyChallengeHumanPlayerId', () => {
  it('attributes heroes, summons and illusions through the reliable human owner chain', () => {
    const hero = entity(3);
    const summon = entity(-1, hero);
    const illusion = entity(3, hero);

    expect(resolveDailyChallengeHumanPlayerId(hero, undefined, deps)).toBe(3);
    expect(resolveDailyChallengeHumanPlayerId(summon, undefined, deps)).toBe(3);
    expect(resolveDailyChallengeHumanPlayerId(illusion, undefined, deps)).toBe(3);
  });

  it('uses the aura owner when the modifier caster has no reliable player owner', () => {
    expect(resolveDailyChallengeHumanPlayerId(entity(-1), entity(3), deps)).toBe(3);
  });

  it('excludes bots, map sources and cyclic ownership chains', () => {
    const bot = entity(8);
    const map = entity(-1);
    const first = entity(-1);
    const second = entity(-1, first);
    first.GetOwnerEntity = () => second;

    expect(resolveDailyChallengeHumanPlayerId(bot, undefined, deps)).toBeUndefined();
    expect(resolveDailyChallengeHumanPlayerId(map, undefined, deps)).toBeUndefined();
    expect(resolveDailyChallengeHumanPlayerId(first, undefined, deps)).toBeUndefined();
  });
});
