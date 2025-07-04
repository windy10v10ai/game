// eslint-disable-next-line @typescript-eslint/no-unused-vars

export declare interface AIGameMode {
  InitGameMode(): void;
  InitEvents(): void;
  LinkLuaModifiers(): void;
  InitGlobalVariables(): void;
  PreGameOptions(): void;
  GetPlayerGoldXpMultiplier(iPlayerID: number): number;
  OnGameStateChanged(): void;
  OnNPCSpawned(event: any): void;
  OnEntityKilled(event: any): void;
  OnItemPickedUp(event: any): void;
  OnGetLoadingSetOptions(eventSourceIndex: number, args: any): void;
  SetUnitShareMask(keys: any): void;
}

declare global {
  var AIGameMode: AIGameMode;
  interface CDOTAGameRules {
    AIGameMode: AIGameMode;
  }
}

export {};
