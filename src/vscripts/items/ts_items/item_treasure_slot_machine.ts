import { BaseItem, registerAbility } from '../../utils/dota_ts_adapter';

const SLOT_MACHINE = 'item_treasure_slot_machine';
const GOLD_BAG = 'item_treasure_slot_machine_gold_bag';
const SPIN_PARTICLE =
  'particles/econ/items/ogre_magi/ogre_magi_jackpot/ogre_magi_jackpot_multicast.vpcf';

const cooldownEnds = new Map<PlayerID, number>();

function remainingCooldown(playerId: PlayerID): number {
  return Math.max(0, (cooldownEnds.get(playerId) ?? 0) - GameRules.GetGameTime());
}

@registerAbility(SLOT_MACHINE)
export class ItemTreasureSlotMachine extends BaseItem {
  IsRefreshable(): boolean {
    return false;
  }

  CastFilterResult(): UnitFilterResult {
    if (IsServer()) {
      const caster = this.GetCaster();
      if (!caster?.IsRealHero() || remainingCooldown(caster.GetPlayerOwnerID()) > 0) {
        return UnitFilterResult.FAIL_OTHER;
      }
    }
    return UnitFilterResult.SUCCESS;
  }

  OnInventoryContentsChanged(): void {
    if (IsServer()) {
      const caster = this.GetCaster();
      if (caster?.IsRealHero()) {
        this.syncCooldown(caster.GetPlayerOwnerID());
      }
    }
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    if (!caster?.IsRealHero()) {
      return;
    }

    const playerId = caster.GetPlayerOwnerID();
    if (remainingCooldown(playerId) > 0) {
      this.syncCooldown(playerId);
      return;
    }

    const bag = CreateItem(GOLD_BAG, undefined, undefined) as
      | ItemTreasureSlotMachineGoldBag
      | undefined;
    if (!bag) {
      this.EndCooldown();
      return;
    }
    bag.rewardGold = this.rollGold();
    bag.SetOnlyPlayerHeroPickup(true);

    cooldownEnds.set(playerId, GameRules.GetGameTime() + this.GetCooldown(-1));
    for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.STASH_6; slot++) {
      const copy = caster.GetItemInSlot(slot);
      if (copy && copy !== this && copy.GetAbilityName() === SLOT_MACHINE) {
        (copy as ItemTreasureSlotMachine).syncCooldown(playerId);
      }
    }

    CreateItemOnPositionSync(GetGroundPosition(caster.GetAbsOrigin(), caster), bag);
    EmitSoundOn('Hero_OgreMagi.Fireblast.x1', caster);
    const spin = ParticleManager.CreateParticle(
      SPIN_PARTICLE,
      ParticleAttachment.OVERHEAD_FOLLOW,
      caster,
    );
    ParticleManager.SetParticleControl(spin, 1, Vector(1, 1, 1));
    ParticleManager.ReleaseParticleIndex(spin);
    UTIL_Remove(this);
  }

  private syncCooldown(playerId: PlayerID): void {
    const remaining = remainingCooldown(playerId);
    if (Math.abs(this.GetCooldownTimeRemaining() - remaining) <= FrameTime()) {
      return;
    }
    this.EndCooldown();
    if (remaining > 0) {
      this.StartCooldown(remaining);
    }
  }

  private rollGold(): number {
    const prizes = [1, 2, 3, 4, 5].map((tier) => ({
      gold: this.GetSpecialValueFor(`gold_${tier}`),
      chance: this.GetSpecialValueFor(`chance_${tier}`),
    }));
    let roll = RandomInt(
      1,
      prizes.reduce((total, prize) => total + prize.chance, 0),
    );
    for (const prize of prizes) {
      roll -= prize.chance;
      if (roll <= 0) {
        return prize.gold;
      }
    }
    return 0;
  }
}

@registerAbility(GOLD_BAG)
export class ItemTreasureSlotMachineGoldBag extends BaseItem {
  rewardGold?: number;

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const gold = this.rewardGold;
    if (!caster?.IsRealHero() || !gold) {
      return;
    }

    this.rewardGold = undefined;
    caster.ModifyGold(gold, true, ModifyGoldReason.UNSPECIFIED);
    SendOverheadEventMessage(undefined, OverheadAlert.GOLD, caster, gold, undefined);
    UTIL_Remove(this);
  }
}
