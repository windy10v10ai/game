# 维护已有 DataDriven / 纯 Lua 技能

只用于改存量技能，从零新写走 TS。

DataDriven：KV 直接写 `Modifiers`，数值用 `%key` 引 `AbilityValues`；含逻辑时用 `OnAbilityExecuted` / `OnIntervalThink` 等事件块 `RunScript` 调一段 Lua。

```
"my_ability"
{
    "BaseClass"             "ability_datadriven"
    "AbilityBehavior"       "DOTA_ABILITY_BEHAVIOR_PASSIVE"
    "AbilityValues" { "bonus_armor" "10" }
    "Modifiers"
    {
        "modifier_my_ability"
        {
            "Passive"           "1"
            "IsHidden"          "1"
            "RemoveOnDeath"     "0"
            "Properties" { "MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS" "%bonus_armor" }
        }
    }
}
```

纯 Lua：实现放 `game/scripts/vscripts/abilities/<name>.lua`，`class({})` + `LinkLuaModifier`，**不经 TSTL**，改完 `script_reload` 热重载。KV `BaseClass` = `ability_lua`、`ScriptFile` = `abilities/<name>`。
