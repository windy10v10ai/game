---
name: dota-deploy
description: "Publish the addon to Steam Workshop, defaulting to the beta item. Use when the user requests publishing, Workshop updates, or scheduled deployment."
---

# Workshop publishing

This workflow packages through Dota Workshop Tools, not a loose-file SteamCMD
upload. Resolve the target and access before building; forks do not inherit
the original author's Workshop permissions.

Original upstream targets:

- Beta: `2636824668`, "10v10 AI windy beta version (test)".
- Production: `2307479570`, "10v10 AI by windy (Arcade Launch Supported)".

For upstream publishing, beta is the default; production requires confirmation
of the target and complete Chinese/English notes.
For a fork, ask for its Workshop item instead of using upstream defaults.

Build the intended checkout with `npm run build`.
After cloning onto a new machine, also compile all Panorama images in Tools.
Launch Tools for addon `windy10v10ai`; in Asset Browser open Workshop Manager,
choose the exact item, and use its upload action.
Submit the English notes without changing unrelated metadata and verify the
successful-upload message.

Add the Chinese notes through the authenticated Steam changelog editor for the
same upload. Use the tools actually available; do not assume browser/native
automation or account login exists.
Verify both `?l=schinese` and `?l=english` descriptions.

Check the downloaded package under the Steam Workshop content directory
`570/<item-id>/`: expect the item VPK and `publish_data.txt`.
A running client may delay download; report that state rather than claiming
the installed copy updated.

For scheduled publishing, validate account access, UI automation capability,
target, and notes while the user is available.
If another client remains stale, inspect its Workshop manifest and, with Dota
closed, refresh using Steam console `workshop_download_item 570 <item-id>`.
