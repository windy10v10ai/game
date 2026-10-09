# Dota API sources

Use the matching API surface rather than mixing server and Panorama signatures.

| Surface                    | Source                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Server Lua classes/methods | [ModDota VScripts](https://moddota.com/api/#/vscripts)                                                             |
| ListenToGameEvent payloads | [ModDota game events](https://moddota.com/api/#/events)                                                            |
| Panorama JS                | [ModDota Panorama API](https://moddota.com/api/#/panorama/api)                                                     |
| Panorama UI events         | [ModDota Panorama events](https://moddota.com/api/#/panorama/events)                                               |
| DataDriven KV/Actions      | [Valve DataDriven](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven) |
| UI/toolchain concepts      | [Valve Panorama](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Panorama)                          |
| Recent engine API changes  | [robincode.cn](https://www.robincode.cn/)                                                                          |

Prefer ModDota for signatures and events, Valve for concepts and declarative
semantics. Corroborate update-tracker claims with engine behavior/current types;
documentation can lag behind the running game.
When local `@moddota/dota-lua-types` disagrees with verified runtime behavior,
investigate the mismatch rather than assuming the type package is current.
