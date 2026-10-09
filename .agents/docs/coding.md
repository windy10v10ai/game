# Coding

## Development

- Keep the checkout on the same disk partition as Dota 2. `npm install` links `game/` and `content/` to the addon directories.
- Reuse string events instead of adding custom events.

## Comments

- Ability/item effects and numerical descriptions belong in localization, not comments. Configuration comments may identify the hero or ability system name.
- Comments must not copy discussion examples, edge cases, migration origins, change history, or excluded options. Describe design intent and non-obvious exceptions. Public methods get one functional sentence without file/function/API names; boundary details go beside the code. Use at most one short file-level JSDoc without sections or bullets.
