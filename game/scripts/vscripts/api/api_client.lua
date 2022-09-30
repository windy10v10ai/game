local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["6"] = 3,["7"] = 3,["8"] = 3,["10"] = 3,["11"] = 12,["12"] = 13,["13"] = 14,["14"] = 15,["15"] = 18,["16"] = 20,["17"] = 21,["18"] = 22,["19"] = 23,["20"] = 24,["22"] = 27,["23"] = 28,["24"] = 29,["25"] = 30,["26"] = 31,["28"] = 33,["29"] = 34,["31"] = 29,["32"] = 12,["33"] = 40,["34"] = 41,["35"] = 42,["36"] = 42,["37"] = 43,["38"] = 43,["39"] = 43,["40"] = 43,["41"] = 44,["42"] = 45,["43"] = 46,["44"] = 47,["45"] = 48,["48"] = 51,["50"] = 43,["51"] = 43,["52"] = 42,["53"] = 55,["54"] = 40,["55"] = 4,["56"] = 5,["57"] = 6,["58"] = 7,["59"] = 8,["60"] = 7});
local ____exports = {}
____exports.ApiClient = __TS__Class()
local ApiClient = ____exports.ApiClient
ApiClient.name = "ApiClient"
function ApiClient.prototype.____constructor(self)
end
function ApiClient.get(self, url, params, callback)
    print(((("[ApiClient] get " .. ____exports.ApiClient.HOST_NAME) .. url) .. " with ") .. json.encode(params))
    local request = CreateHTTPRequestScriptVM("GET", ____exports.ApiClient.HOST_NAME .. url)
    -- TODO remove later
    local matchId = GameRules:Script_GetMatchID()
    params.matchId = tostring(matchId)
    -- END TODO
    for key in pairs(params) do
        request:SetHTTPRequestGetOrPostParameter(key, params[key])
    end
    request:SetHTTPRequestNetworkActivityTimeout(____exports.ApiClient.TIMEOUT_SECONDS)
    local key = GetDedicatedServerKeyV2(____exports.ApiClient.VERSION)
    request:SetHTTPRequestHeaderValue("x-api-key", key)
    request:Send(function(result)
        if result.StatusCode == 200 then
            callback(nil, result.Body)
        else
            print("[ApiClient] get error: " .. tostring(result.StatusCode))
            callback(nil, "error")
        end
    end)
end
function ApiClient.getWithRetry(self, url, params, callback)
    local retryCount = 0
    local retry
    retry = function()
        self:get(
            url,
            params,
            function(____, data)
                if data == "error" then
                    retryCount = retryCount + 1
                    if retryCount < ____exports.ApiClient.RETRY_TIMES then
                        print("[ApiClient] getWithRetry retry " .. tostring(retryCount))
                        retry(nil)
                    end
                else
                    callback(nil, data)
                end
            end
        )
    end
    retry(nil)
end
ApiClient.TIMEOUT_SECONDS = 10
ApiClient.RETRY_TIMES = 6
ApiClient.VERSION = "v1.43"
ApiClient.HOST_NAME = (function()
    return IsInToolsMode() and "http://localhost:5000/api" or "https://windy10v10ai.web.app/api"
end)(nil)
return ____exports
