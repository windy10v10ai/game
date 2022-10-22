local ____player = require("api.player")
local ____game = require("api.game")
local ____lualib = require("lualib_bundle")
local __TS__New = ____lualib.__TS__New

--------------------
-- Initial
--------------------
if Player == nil then
    print("Player initialize via Lua!")
    _G.Player = __TS__New(____player.Player)
end

if Game == nil then
    print("Game initialize via Lua!")
    _G.Game = __TS__New(____game.Game)
end
