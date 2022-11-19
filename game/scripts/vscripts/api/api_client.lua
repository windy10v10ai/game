local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["6"] = 3,["7"] = 4,["8"] = 5,["9"] = 6,["10"] = 7,["11"] = 20,["12"] = 20,["13"] = 20,["15"] = 20,["16"] = 33,["17"] = 34,["18"] = 35,["19"] = 36,["20"] = 38,["21"] = 39,["22"] = 40,["25"] = 43,["26"] = 44,["27"] = 45,["28"] = 46,["29"] = 46,["30"] = 46,["31"] = 46,["33"] = 48,["34"] = 50,["35"] = 51,["37"] = 53,["38"] = 54,["40"] = 48,["41"] = 33,["42"] = 59,["43"] = 60,["44"] = 61,["45"] = 62,["46"] = 62,["47"] = 63,["48"] = 63,["49"] = 63,["50"] = 63,["51"] = 63,["52"] = 63,["53"] = 64,["54"] = 65,["55"] = 66,["56"] = 67,["57"] = 68,["59"] = 70,["60"] = 71,["64"] = 75,["66"] = 63,["67"] = 63,["68"] = 62,["69"] = 79,["70"] = 59,["71"] = 22,["72"] = 23,["73"] = 24,["74"] = 26,["75"] = 27,["76"] = 28,["77"] = 29,["78"] = 30,["79"] = 29});
local ____exports = {}
____exports.HttpMethod = HttpMethod or ({})
____exports.HttpMethod.GET = "GET"
____exports.HttpMethod.POST = "POST"
____exports.HttpMethod.PUT = "PUT"
____exports.HttpMethod.DELETE = "DELETE"
____exports.ApiClient = __TS__Class()
local ApiClient = ____exports.ApiClient
ApiClient.name = "ApiClient"
function ApiClient.prototype.____constructor(self)
end
function ApiClient.send(self, method, path, querys, body, successFunc)
    print(((((((("[ApiClient] " .. method) .. " ") .. ____exports.ApiClient.HOST_NAME) .. path) .. " with querys ") .. json.encode(querys)) .. " body ") .. json.encode(body))
    local request = CreateHTTPRequestScriptVM(method, ____exports.ApiClient.HOST_NAME .. path)
    local key = GetDedicatedServerKeyV2(____exports.ApiClient.VERSION)
    if querys then
        for key in pairs(querys) do
            request:SetHTTPRequestGetOrPostParameter(key, querys[key])
        end
    end
    request:SetHTTPRequestNetworkActivityTimeout(____exports.ApiClient.TIMEOUT_SECONDS)
    request:SetHTTPRequestHeaderValue("x-api-key", key)
    if body then
        request:SetHTTPRequestRawPostBody(
            "application/json",
            json.encode(body)
        )
    end
    request:Send(function(result)
        if result.StatusCode >= 200 and result.StatusCode < 300 then
            successFunc(nil, result.Body)
        else
            print("[ApiClient] get error: " .. tostring(result.StatusCode))
            successFunc(nil, "error")
        end
    end)
end
function ApiClient.sendWithRetry(self, apiParameter)
    local retryCount = 0
    local maxRetryTimes = apiParameter.retryTimes or ____exports.ApiClient.RETRY_TIMES
    local retry
    retry = function()
        self:send(
            apiParameter.method,
            apiParameter.path,
            apiParameter.querys,
            apiParameter.body,
            function(____, data)
                if data == "error" then
                    retryCount = retryCount + 1
                    if retryCount < maxRetryTimes then
                        print("[ApiClient] getWithRetry retry " .. tostring(retryCount))
                        retry(nil)
                    else
                        if apiParameter.failureFunc then
                            apiParameter:failureFunc(data)
                        end
                    end
                else
                    apiParameter:successFunc(data)
                end
            end
        )
    end
    retry(nil)
end
ApiClient.GAME_START_URL = "/game/start"
ApiClient.ADD_PLAYER_PROPERTY_URL = "/game/addPlayerProperty"
ApiClient.POST_GAME_URL = "/game/end"
ApiClient.TIMEOUT_SECONDS = 10
ApiClient.RETRY_TIMES = 6
ApiClient.VERSION = "v1.43"
ApiClient.HOST_NAME = (function()
    return IsInToolsMode() and "http://localhost:5000/api" or "https://windy10v10ai.web.app/api"
end)(nil)
return ____exports
