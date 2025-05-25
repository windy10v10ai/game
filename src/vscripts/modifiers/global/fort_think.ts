import { GameEnd } from '../../modules/event/game-end/game-end';
import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

@registerModifier()
export class modifier_fort_think extends BaseModifier {
  private gameEndTriggered: boolean = false;
  private gameEndTimer?: string;
  private gameEndThresholdHealth: number = 5000;

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  AllowIllusionDuplicate(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.MIN_HEALTH, ModifierFunction.ON_TAKEDAMAGE];
  }

  GetMinHealth(): number {
    return 1;
  }

  OnCreated(): void {
    print('OnCreated modifier_fort_think', this.GetParent().GetUnitName());
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    // 检查是否是当前modifier的所有者受到伤害
    const parent = this.GetParent();
    if (event.unit !== parent) {
      return;
    }

    print('OnTakeDamage', event.unit, event.unit.GetHealth());
    // 检查HP是否小于等于阈值
    if (parent && parent.GetHealth() <= this.gameEndThresholdHealth) {
      // 确定获胜队伍（受到伤害的单位所在队伍的敌对队伍获胜）
      const parentTeam = parent.GetTeamNumber();
      const winnerTeamId = parentTeam === DotaTeam.GOODGUYS ? DotaTeam.BADGUYS : DotaTeam.GOODGUYS;

      this.TriggerGameEnd(winnerTeamId);
    }
  }

  /**
   * 触发薄葬效果
   * @param winnerTeamId 获胜队伍ID
   */
  TriggerGameEnd(winnerTeamId: DotaTeam): void {
    if (this.gameEndTriggered) {
      return; // 防止重复触发
    }

    this.gameEndTriggered = true;

    // 调用游戏结束逻辑
    GameEnd.OnGameEnd(winnerTeamId);

    // 游戏暂停
    PauseGame(true);

    // 10秒后杀死modifier的所有者
    this.gameEndTimer = Timers.CreateTimer(10.0, () => {
      const parent = this.GetParent();
      if (parent && IsValidEntity(parent) && parent.IsAlive()) {
        parent.Kill(undefined, parent);
      }
      return undefined;
    });
  }

  OnDestroy(): void {
    // 清理定时器
    if (this.gameEndTimer) {
      Timers.RemoveTimer(this.gameEndTimer);
      this.gameEndTimer = undefined;
    }
  }
}
