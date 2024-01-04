// eslint-disable-next-line @typescript-eslint/no-unused-vars

export declare interface AIGameMode {
  InitGameMode(): void;
}

declare global {
  var AIGameMode: AIGameMode;
  interface CDOTAGameRules {
    AIGameMode: AIGameMode;
  }
}

export {};
