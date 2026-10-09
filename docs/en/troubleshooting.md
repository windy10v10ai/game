# Troubleshooting

## Addon does not launch or changes do not appear

Check the Node version against `.nvmrc`, confirm Dota and Workshop Tools are installed, and review
`npm install` output for skipped linking. The checkout and Dota must be on the same partition.
Check both addon links and build errors before reinstalling dependencies; see [setup](development/setup.md).

If an existing addon directory blocks installation, back up its changes before approving replacement.
Do not delete linked `game/` or `content/` directories as a general repair.
After repair, run `npm run start` and verify that the addon loads.

## Particle resource errors

Example from the previous project documentation:

```text
Failed loading resource "particles/units/heroes/hero_skywrath_mage/skywrath_mage_mystic_flare_ambient.vpcf_c" (ERROR_BADREQUEST: Code error - bad request)
```

First confirm the failing resource and its origin. If it is a locally generated addon resource,
back it up outside the addon, rebuild that resource, and restart Dota.
Do not delete resources inside Valve's VPK archives. The old README suggested deletion; that alone
does not establish the cause or guarantee a fix. Verify that the error disappears and the effect renders.

## Reporting a bug

Include reproduction steps, expected and actual behavior, addon version, lobby settings,
and relevant VConsole logs or screenshots. Remove credentials and personal data.
Use the [contribution guidelines](../../.github/CONTRIBUTING.md) to choose the appropriate tracker.
