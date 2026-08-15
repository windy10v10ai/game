export interface DailyChallengeOwnedEntity {
  GetPlayerOwnerID?: () => PlayerID;
  GetOwnerEntity?: () => DailyChallengeOwnedEntity | undefined;
  IsNull?: () => boolean;
}

export interface DailyChallengeOwnershipDependencies {
  isValidPlayerId: (playerId: number) => playerId is PlayerID;
  isFakeClient: (playerId: PlayerID) => boolean;
  getSteamAccountId: (playerId: PlayerID) => number;
}

const createDefaultDependencies = (): DailyChallengeOwnershipDependencies => ({
  isValidPlayerId: (playerId): playerId is PlayerID => PlayerResource.IsValidPlayerID(playerId),
  isFakeClient: (playerId) => PlayerResource.IsFakeClient(playerId),
  getSteamAccountId: (playerId) => PlayerResource.GetSteamAccountID(playerId),
});

function isLiveEntity(
  entity: DailyChallengeOwnedEntity | undefined,
): entity is DailyChallengeOwnedEntity {
  return !!entity && (!entity.IsNull || !entity.IsNull());
}

export function resolveDailyChallengeHumanPlayerId(
  source: DailyChallengeOwnedEntity | undefined,
  auraOwner?: DailyChallengeOwnedEntity,
  deps: DailyChallengeOwnershipDependencies = createDefaultDependencies(),
  maxDepth = 6,
): PlayerID | undefined {
  const pending: Array<{ entity: DailyChallengeOwnedEntity; depth: number }> = [];
  if (isLiveEntity(source)) pending.push({ entity: source, depth: 0 });
  if (isLiveEntity(auraOwner)) pending.push({ entity: auraOwner, depth: 0 });
  const visited = new Set<DailyChallengeOwnedEntity>();

  while (pending.length > 0) {
    const current = pending.shift();
    if (!current || current.depth > maxDepth || visited.has(current.entity)) {
      continue;
    }
    visited.add(current.entity);

    const playerId = current.entity.GetPlayerOwnerID?.();
    if (
      playerId !== undefined &&
      deps.isValidPlayerId(playerId) &&
      !deps.isFakeClient(playerId) &&
      deps.getSteamAccountId(playerId) > 0
    ) {
      return playerId;
    }

    if (current.depth === maxDepth) {
      continue;
    }
    const owner = current.entity.GetOwnerEntity?.();
    if (isLiveEntity(owner) && !visited.has(owner)) {
      pending.push({ entity: owner, depth: current.depth + 1 });
    }
  }

  return undefined;
}
