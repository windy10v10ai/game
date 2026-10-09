---
name: dota-docs-lookup
description: "Find Dota 2 custom-game documentation for API signatures, events, modifier bindings, and recent engine changes. Use for Dota API or event lookup and choosing an authoritative source for engine behavior."
---

# Dota 2 Document View Route

## priority (must comply)

1. **Priority [ModDota API](https://moddota.com/api/)**: The community is organized from the client, **clearly classified and searchable**, suitable for quick verification of class names, method signatures, event names, and Panorama API.
2. **When ModDota information is still insufficient**, check the **Valve Developer Wiki** (concepts, processes, individual KV/Action details, official descriptions).
3. **When checking the API changes after the official version is updated** (such as "Has this function been changed recently?" "What changes have been made to the engine API in this update?"), check [robincode.cn](https://www.robincode.cn/)——This site tracks the latest API changes after official updates. ModDota/Wiki usually lags behind the latest version.

Still **only open the corresponding column** according to the task type, and do not search across sites without purpose.

---

## First priority: ModDota (select the entrance according to the task)

| What are you doing                                                                                                 | Entrance                                                       | Brief description of use                                                |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Server **Lua/VScripts**:`GameRules`、`CDOTA_*`etc. **Binding classes and methods**, number and types of parameters | [vscripts](https://moddota.com/api/#/vscripts)                 | Search by class name (such as`CDOTAGameRules`、`CDOTA_BaseNPC_Hero`）。 |
| **In-game events**,`ListenToGameEvent`, event payload structure                                                    | [events](https://moddota.com/api/#/events)                     | **Game events** index (separate from Panorama events).                  |
| **Panorama front end**`$`API, panel script callable **JS API**                                                     | [panorama / api](https://moddota.com/api/#/panorama/api)       | **Panorama JavaScript API** separate from VScripts.                     |
| **Panorama event** (UI layer event name and usage)                                                                 | [panorama / events](https://moddota.com/api/#/panorama/events) | **Panorama side events** index.                                         |

**ModDota Quick Operation**: Enter the page corresponding to `#/` → Search at the top or classify on the left → Open the entry to check the signature/field.

---

## Second priority: Valve official Wiki (supplementary)

Check again when ModDota **cannot be found, the semantics are unclear, and official tutorial-style instructions** are needed.

| What are you doing                                                                     | Link                                                                                                                     | Brief description of purpose                                                             |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **Panorama** Toolchain, XML/CSS, interface concept overview                            | [Workshop Tools / Panorama](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Panorama)                     | Official **UI layer** overview.                                                          |
| **Data Driven** ability KV、`ability_datadriven`, events and`RunScript`etc             | [Abilities: Data Driven](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven) | **Data-driven ability** KV details.                                                      |
| Official **Panorama JavaScript** document entry (comparable with ModDota panorama/api) | [Panorama / JavaScript API](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Panorama/Javascript/API)      | Wiki version description, **Search priority is still recommended ModDota panorama/api**. |
| **Scripting** Overview and Index                                                       | [Scripting / API](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/API)                          | Official script document navigation.                                                     |
| **Modifier Action**、`ApplyAction`etc. Declarative action list                         | [Actions and Modifiers](https://developer.valvesoftware.com/wiki/Dota_2_Actions_and_Modifiers)                           | **Action Reference**, often used with DataDriven/KV.                                     |

---

## Third priority: robincode.cn (version update API change tracking)

| What are you doing                                                                                                                                                                                     | Link                                      | Brief description of purpose                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Check whether a certain API/field/behavior has changed after the **official version update**, or whether it is uncertain whether a runtime error is caused by changes in the new version of the engine | [robincode.cn](https://www.robincode.cn/) | Tracking the **latest API changes** after the official Dota 2 update, the inclusion of the ModDota/Valve Wiki usually lags behind the latest version. |

## Other rules

- **TypeScript type**: If this repository `@moddota/dota-lua-types` is inconsistent with ModDota/actual machine, **ModDota + actual game measurement** shall prevail.
- **Valve Wiki**: Some pages may be intercepted during automated crawling; if the tool cannot read them, just open the link in the browser.
- **Changes in API behavior caused by version updates** (for example, the return value criteria of an engine method has changed in the new version). You should give priority to suspicion and check robincode.cn for confirmation, rather than assuming that it is a problem with your own code.

## Things not to do

- Don't skip ModDota and go directly to the Wiki **Look up Panorama JS or game event names** (should be `panorama/api`, `panorama/events` or `events` first).
- Do not use Panorama documentation to check **`GameRules` and other server Lua bindings** (should check ModDota **vscripts**).
- Don’t **look through** all Wiki chapters at the same time to find an API; lock the ModDota corresponding partition first, and then supplement the official documentation if it is not enough.
- When troubleshooting API changes caused by version updates, do not just check ModDota/Wiki and draw conclusions - the updates of these two are lagging behind, so you should check robincode.cn.
