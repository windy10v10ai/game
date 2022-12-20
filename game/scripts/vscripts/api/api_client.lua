local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["6"] = 3,["7"] = 4,["8"] = 5,["9"] = 6,["10"] = 7,["11"] = 20,["12"] = 20,["13"] = 20,["15"] = 20,["16"] = 34,["17"] = 35,["18"] = 36,["19"] = 37,["20"] = 39,["21"] = 40,["24"] = 48,["25"] = 49,["26"] = 50,["29"] = 53,["30"] = 54,["31"] = 55,["32"] = 56,["33"] = 56,["34"] = 56,["35"] = 56,["37"] = 58,["38"] = 59,["39"] = 58,["40"] = 34,["41"] = 63,["42"] = 64,["43"] = 65,["44"] = 66,["45"] = 66,["46"] = 67,["47"] = 67,["48"] = 67,["49"] = 67,["50"] = 67,["51"] = 67,["52"] = 70,["53"] = 71,["54"] = 72,["55"] = 73,["56"] = 74,["57"] = 75,["60"] = 78,["61"] = 79,["62"] = 80,["63"] = 81,["65"] = 83,["66"] = 84,["70"] = 67,["71"] = 67,["72"] = 66,["73"] = 90,["74"] = 63,["75"] = 22,["76"] = 23,["77"] = 24,["78"] = 26,["79"] = 27,["80"] = 28,["81"] = 29,["82"] = 30,["83"] = 31,["84"] = 30});
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
function ApiClient.send(self, method, path, querys, body, callbackFunc)
    print(((((((("[ApiClient] " .. method) .. " ") .. ____exports.ApiClient.HOST_NAME) .. path) .. " with querys ") .. json.encode(querys)) .. " body ") .. json.encode(body))
    local request = CreateHTTPRequestScriptVM(method, ____exports.ApiClient.HOST_NAME .. path)
    local key = GetDedicatedServerKeyV2(____exports.ApiClient.VERSION)
    if key == ____exports.ApiClient.LOCAL_APIKEY and not IsInToolsMode() then
        callbackFunc(nil, {StatusCode = 401, Body = ____exports.ApiClient.LOCAL_APIKEY, Request = request})
        return
    end
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
        callbackFunc(nil, result)
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
            function(____, result)
                print("[ApiClient] return with status code: " .. tostring(result.StatusCode))
                if result.StatusCode >= 200 and result.StatusCode < 300 then
                    apiParameter:successFunc(result.Body)
                elseif result.StatusCode == 401 then
                    if apiParameter.failureFunc then
                        apiParameter:failureFunc(result.Body)
                    end
                else
                    retryCount = retryCount + 1
                    if retryCount < maxRetryTimes then
                        print("[ApiClient] getWithRetry retry " .. tostring(retryCount))
                        retry(nil)
                    else
                        if apiParameter.failureFunc then
                            apiParameter:failureFunc(result.Body)
                        end
                    end
                end
            end
        )
    end
    retry(nil)
end
ApiClient.GAME_START_URL = "/game/start"
ApiClient.ADD_PLAYER_PROPERTY_URL = "/game/addPlayerProperty"
ApiClient.POST_GAME_URL = "/game/end"
ApiClient.LOCAL_APIKEY = "Invalid_NotOnDedicatedServer"
ApiClient.TIMEOUT_SECONDS = 10
ApiClient.RETRY_TIMES = 3
ApiClient.VERSION = "v1.43"
ApiClient.HOST_NAME = (function()
    return IsInToolsMode() and "http://localhost:5000/api" or "https://windy10v10ai.web.app/api"
end)(nil)
return ____exports
