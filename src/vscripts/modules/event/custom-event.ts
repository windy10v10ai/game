export class CustomEvent {
  constructor() {
    CustomGameEventManager.RegisterListener("loading_set_options", (userId, args) =>
      this.OnGetLoadingSetOptions(userId, args),
    );
  }

  OnGetLoadingSetOptions(
    _: EntityIndex,
    args: NetworkedData<
      CCustomGameEventManager.InferEventType<LoadingSetOptionsEventData, object> & {
        PlayerID: PlayerID;
      }
    >,
  ) {
    if (args.host_privilege === 0) {
      return;
    }

    GameRules.Option.towerPower = Number(args.game_options.tower_power);
  }
}
