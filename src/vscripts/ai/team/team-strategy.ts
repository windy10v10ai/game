import { BaseModifier, registerModifier } from "../../utils/dota_ts_adapter";

@registerModifier()
export class TeamStrategy extends BaseModifier {
  protected readonly ThinkInterval: number = 2;

  // ---------------------------------------------------------
  // DotaModifierFunctions
  // ---------------------------------------------------------
  // modifier functions
  OnCreated() {
    if (IsClient()) {
      return;
    }

    const delay = 1;
    Timers.CreateTimer(delay, () => {
      this.StartIntervalThink(this.ThinkInterval);
    });
  }

  OnIntervalThink(): void {
    // TODO 团队策略
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  IsHidden(): boolean {
    return true;
  }
}
