# Images and resources

Place runtime PNGs under [`content/panorama/images/`](../../../content/panorama/images/).
Images referenced by layout XML are compiled by Workshop Tools.
For standalone images, add a reference in
[`content/panorama/layout/custom_game/images.xml`](../../../content/panorama/layout/custom_game/images.xml),
then use the [development workflow](workflow.md).
Verify in Tools that the corresponding compiled resource loads and the image appears.

Keep editable art in `assets/sources/`; these files are not automatically deployed to the addon.
The retained `assets/compiled/gamemode.vxml_c` is separate from editable sources.

The legacy [resource compiler script](../../../scripts/compile-resources.bat) processes items,
custom images, hero images, and sound events. It contains absolute Steam paths and the addon spelling
`Windy10v10AI`; compare them with your installation and the package name `windy10v10ai` before use.
For PNGs, prefer the XML-reference workflow above.
