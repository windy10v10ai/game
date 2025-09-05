export function StartAbilityCooldown(ability: CDOTABaseAbility): void {
  ability.StartCooldown(ability.GetCooldown(-1) * ability.GetCaster().GetCooldownReduction());
}
