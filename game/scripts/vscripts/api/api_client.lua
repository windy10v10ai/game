local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["6"] = 3,["7"] = 4,["8"] = 5,["9"] = 6,["10"] = 7,["11"] = 20,["12"] = 20,["13"] = 20,["15"] = 20,["16"] = 35,["17"] = 36,["18"] = 37,["19"] = 38,["20"] = 40,["21"] = 41,["24"] = 49,["25"] = 50,["26"] = 51,["29"] = 54,["30"] = 55,["31"] = 56,["32"] = 57,["33"] = 57,["34"] = 57,["35"] = 57,["37"] = 59,["38"] = 60,["39"] = 59,["40"] = 35,["41"] = 64,["42"] = 65,["43"] = 66,["44"] = 67,["45"] = 67,["46"] = 68,["47"] = 68,["48"] = 68,["49"] = 68,["50"] = 68,["51"] = 68,["52"] = 71,["53"] = 72,["54"] = 73,["55"] = 74,["56"] = 75,["57"] = 76,["60"] = 79,["61"] = 80,["62"] = 81,["63"] = 82,["65"] = 84,["66"] = 85,["70"] = 68,["71"] = 68,["72"] = 67,["73"] = 91,["74"] = 64,["75"] = 22,["76"] = 23,["77"] = 24,["78"] = 26,["79"] = 27,["80"] = 28,["81"] = 30,["82"] = 31,["83"] = 32,["84"] = 31});
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
    local key = GetDedicatedServerKeyV2(____exports.ApiClient.SERVER_KEY)
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
ApiClient.TIMEOUT_SECONDS = 15
ApiClient.RETRY_TIMES = 4
ApiClient.SERVER_KEY = "v1.43"
ApiClient.HOST_NAME = (function()
    return IsInToolsMode() and "http://localhost:5000/api" or "https://windy10v10ai.web.app/api"
end)(nil)
return ____exports
