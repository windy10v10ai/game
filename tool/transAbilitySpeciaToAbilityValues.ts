import { KeyValues } from "easy-keyvalues";

Start("npc/npc_abilities_custom.txt");

export async function Start(filePath: string): Promise<void> {
  const abilities = await KeyValues.Load(filePath);
  const DOTAAbilities: KeyValues[] = [
    abilities.FindKey("DOTAAbilities")!,
    ...abilities.GetBaseList().map((k) => k.FindKey("DOTAAbilities")!),
  ];
  for (const _DOTAAbilities of DOTAAbilities) {
    for (const ability of _DOTAAbilities.GetChildren()) {
      if (!ability.HasChildren()) {
        continue;
      }
      const AbilitySpecial = ability.FindKey("AbilitySpecial");
      if (!AbilitySpecial) {
        continue;
      }
      const AbilityValues = ability.CreateChild("AbilityValues", []);
      for (const speical of AbilitySpecial.GetChildren()) {
        for (const kv of speical.GetChildren()) {
          if (kv.Key !== "var_type") {
            AbilityValues.CreateChild(kv.Key, kv.GetValue());
          }
        }
      }
      ability.Delete("AbilitySpecial");
    }
  }
  await abilities.Save();
}
