local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["6"] = 3,["7"] = 4,["8"] = 5,["9"] = 6,["10"] = 7,["11"] = 20,["12"] = 20,["13"] = 20,["15"] = 20,["16"] = 35,["17"] = 36,["18"] = 37,["19"] = 38,["20"] = 49,["21"] = 50,["22"] = 51,["25"] = 54,["26"] = 55,["27"] = 56,["28"] = 57,["29"] = 57,["30"] = 57,["31"] = 57,["33"] = 59,["34"] = 60,["35"] = 59,["36"] = 35,["37"] = 64,["38"] = 65,["39"] = 66,["40"] = 67,["41"] = 67,["42"] = 68,["43"] = 68,["44"] = 68,["45"] = 68,["46"] = 68,["47"] = 68,["48"] = 71,["49"] = 72,["50"] = 73,["51"] = 74,["52"] = 75,["53"] = 76,["56"] = 79,["57"] = 80,["58"] = 81,["59"] = 82,["61"] = 84,["62"] = 85,["66"] = 68,["67"] = 68,["68"] = 67,["69"] = 91,["70"] = 64,["71"] = 22,["72"] = 23,["73"] = 24,["74"] = 26,["75"] = 27,["76"] = 28,["77"] = 30,["78"] = 31,["79"] = 32,["80"] = 31});
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
