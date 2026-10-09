---
name: dota-release-note
description: "Generate Chinese and English Steam Workshop release notes and optionally update an open PR. Use when a PR needs release notes; do not use for purely internal changes."
---

# Workshop release notes

Generate Chinese and English player-facing notes from explicit changes, a PR,
or an Issue. Resolve the repository from the supplied URL or intended PR;
do not silently write to the original upstream when working on a fork.
Internal-only changes need no notes or version lookup.

## Content

Use actual changed heroes for PR notes and completed heroes for Issue checklists.
When an Issue has a progress checklist, count checked/total and include that
progress in both languages. Do not fabricate progress without a checklist.
Resolve hero/item/ability/effect names from addon localization, then the
corresponding current vanilla keys; do not guess translations.

Combine changes to the same target, prioritize the player-visible effect,
and omit KV/file/maintenance terminology.
Bot-use notes describe the changed use behavior, not the item's existing effects.
Exclude changes to the awakening free-trial roster.
Major notes must not repeat already published or preserved patch entries.

## Version

Use the caller's chosen major/patch track without another track question.
Explicit version wins. Otherwise fetch the target Workshop changelog afresh,
then inspect the matching repository's open `release` PRs.
Original upstream Workshop item: `2307479570`; a fork's item must be resolved.
Do not assume a higher automatically generated release PR means the user chose
a major release. Ask which track/version applies if unresolved.

Patch progression is `v5.20 -> v5.20a -> v5.20b`.
An explicit "version +1" request removes the suffix and adds 0.01
(`v5.19b -> v5.20`); resolve disagreement with an open release PR.
Keep `GAME_VERSION` in `src/vscripts/modules/GameConfig.ts` synchronized
with the selected major version only, without patch letters.

## Delivery and PR editing

Workshop blocks use `[b]Gameplay update v<version>[/b]` and its Chinese
equivalent, followed by concise bullets. Deliver concrete versions and entries.
Publishing/editing requires the requested target; if the destination is
unspecified, offer feature PR, aggregate release PR, both, or text only.

Read the existing body and edit through UTF-8 `--body-file`.
For a feature PR, preserve content before `## Release Note`.
For aggregate release PRs, major blocks precede the first `---`;
patch blocks follow it.
Update only the selected version: append/merge a patch block or replace the
major blocks, retaining other patch blocks and user-maintained checklists.
When aggregation is part of the request, do not leave the entry only in the
feature PR.
