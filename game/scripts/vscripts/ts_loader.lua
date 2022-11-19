local ____player = require("api.player")
local ____game = require("api.game")
local ____property = require("modifiers.property.property_controller")
local ____lualib = require("lualib_bundle")
local __TS__New = ____lualib.__TS__New

--------------------
-- Initial
--------------------
if PlayerController == nil then
    print("PlayerController initialize via Lua!")
    _G.PlayerController = __TS__New(____player.Player)
end

if GameController == nil then
    print("GameController initialize via Lua!")
    _G.GameController = __TS__New(____game.Game)
end
