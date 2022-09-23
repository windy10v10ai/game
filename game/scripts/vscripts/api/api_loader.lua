local ____member = require("api.member")
local ____lualib = require("lualib_bundle")
local __TS__New = ____lualib.__TS__New

--------------------
-- Initial
--------------------
if Member == nil then
    print("Member initialize via Lua!")
    _G.Member = __TS__New(____member.Member)
end
