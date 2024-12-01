local ____lualib = require("lualib_bundle")
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["5"] = 6,["6"] = 12,["7"] = 19,["8"] = 36,["9"] = 36,["10"] = 36,["11"] = 36,["12"] = 36,["13"] = 36,["14"] = 36,["15"] = 36,["16"] = 36,["17"] = 36,["18"] = 36,["19"] = 36,["20"] = 36,["21"] = 36});
local ____exports = {}
local ServerAddress = IsInToolsMode() and "http://" or (ONLINE_TEST_MODE and "http://" or "http://")
____exports.ServerAuthKey = IsInToolsMode() and "Invalid_NotDedicatedServer" or (ONLINE_TEST_MODE and GetDedicatedServerKeyV3("server") or GetDedicatedServerKeyV3("server"))
____exports.NoSignatureURLs = {"/api/v1/game/statistic/saveStatisticData"}
____exports.OpenAPI = {
    NETWORK_ACTIVITY_TIMEOUT = 10000,
    ABSOLUTE_TIMEOUT = 10000,
    BASE = ServerAddress,
    VERSION = "1.0.0",
    WITH_CREDENTIALS = false,
    CREDENTIALS = "include",
    TOKEN = nil,
    USERNAME = nil,
    PASSWORD = nil,
    HEADERS = nil,
    ENCODE_PATH = nil,
    AUTHKEY = ____exports.ServerAuthKey
}
return ____exports
