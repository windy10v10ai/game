# Skill wiring

`.agents/skills/` owns project skills. `.claude/skills` is a local directory link to it and is
ignored by Git, so the repository never stores a second copy or a machine-specific junction target.
After cloning or moving the checkout, create the link from the repository root:

```text
node scripts/link-skills.js
```

This creates a relative symlink. Windows requires Developer Mode or symlink privileges.
When those are unavailable, explicitly choose a local junction:

```text
node scripts/link-skills.js --junction
```

Junctions use an absolute target; recreate the link if the checkout is moved. The script refuses
to replace an existing directory or an incorrect link and never deletes skill contents.
To replace a stale junction, remove only the link, preserving `.agents/skills`, then rerun the script.
