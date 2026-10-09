---
name: deploy
description: "Publish the addon to Steam Workshop, defaulting to the beta item. Use when the user requests publishing, Workshop updates, or scheduled deployment."
---

# Publish to Steam Workshop

Publishing relies on Workshop Tools to package and upload it, and then add the Chinese update log on the web page. Workshop Tools packages the addon into a `<id>.vpk`; SteamCMD only transmits scattered files, Dota cannot read them, the map displays an error, and the command line upload has been evaluated and deprecated.

| Target                | Number       | Row in Workshop Manager                     |
| --------------------- | ------------ | ------------------------------------------- |
| Test server (default) | `2636824668` | 10v10 AI windy beta version (test)          |
| Official server       | `2307479570` | 10v10 AI by windy (Arcade Launch Supported) |

The update log takes the Release Note section of the current PR: fill in the English block when uploading, and the Chinese block on the web page.

## steps

1. **Target setting**: The user sends a test server without naming the official server. Before releasing the official server, repeat the full text of the log in Chinese and English to the user and wait for the user's confirmation.
   Completed: The target number and Chinese and English logs have been determined.

2. **Get permission**: `request_access` applies for two items `["Dota 2", "dota2.exe"]` once. The Workshop Tools window belongs to the latter. If you only apply for the former, it will pop up again.
   Complete: Both items are in the authorized list.

3. **Compile**: Confirm that the current branch is the content to be published, run `npm run build`. After changing the machine and cloning, use Dota tools to compile it completely, otherwise the package lacks Panorama pictures (see `add-image` skill).
   Completed: Compilation without error.

4. **Upload**: Run `game/bin/win64/dota2.exe -novid -tools -addon windy10v10ai` without Dota tools open, then use computer use:
   - Click the Steam icon in the Asset Browser toolbar to open the Workshop Manager
   - Select the target row and click the second button on the toolbar (up arrow)
   - Fill in the "Update Log" box at the top with the English log, and keep other fields as they are.
   - Click "Submit", wait for the pop-up window and click "OK"

   Completed: The pop-up window displays "The item has been successfully updated to the Steam Workshop".

5. **Complete Chinese log**: Complete it automatically with Claude in Chrome, without stopping to let the user log in or manually complete it:
   - Open `https://steamcommunity.com/sharedfiles/filedetails//changelog/<id>/` (double slashes in the path). This address carries the Steam login status in Chrome. Use `javascript_tool` to read the `id` of the latest text `<p>` (that is, the timestamp of this update). The `editchangelogentry` link in the page can also be directly obtained.
   - Enter `https://steamcommunity.com/sharedfiles/editchangelogentry/<id>/<timestamp>/` from this page. Do not click "Login": it will only jump to the community homepage and will not automatically log in.
   - Use `form_input` to select Simplified Chinese (value `6`) in the language drop-down box. After refreshing the page, use `read_page` to get the text box ref
   - replaces the entire text box with Chinese log, `javascript_tool` executes `SaveChanges()`

   completed: Add `?l=schinese` to the change description page to display the Chinese log, and add `?l=english` to display the English log.

6. **CHECK PACK**: See `C:\Program Files (x86)\Steam\steamapps\workshop\content\570\<id>\`. Steam may not have been re-downloaded when Dota is open. This is left to the user to check before restarting Steam or entering the game, and will be explained in the report.
   Complete: There are only `<id>.vpk` and `publish_data.txt` in the directory.

## scheduled release

At this point, no one can click on the authorization pop-up window, so **when setting up the scheduled task**, do step 2 to get the two Dota permissions, and confirm that Chrome has logged into Steam, and then create the task. The task content is steps 3 to 6. The target and Chinese and English logs are confirmed with the user when setting up.

## computer use pitfalls

The main window of Dota is always on the Workshop Manager. When you click on the main window, the mall advertisement will pop up. Click the Steam icon again in the Asset Browser to bring the Workshop Manager back to the front.

## Someone else’s bot is still an old version After

is successfully released, the Steam entry information on some bots will expire: the number `latest_manifest` in `appworkshop_570.acf` is still the old value. Deleting the image or resubscribing will only re-download the old version, and the launcher will still prompt that it is not the latest version. Ask the other party to close Dota, open `steam://open/console` in the browser, enter `workshop_download_item 570 <id>` and press Enter, Steam will directly pull the latest version; restart the launcher after downloading.
