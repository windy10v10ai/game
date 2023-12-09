local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["6"] = 3,["7"] = 4,["8"] = 5,["9"] = 6,["10"] = 7,["11"] = 20,["12"] = 20,["13"] = 20,["15"] = 20,["16"] = 36,["17"] = 37,["18"] = 38,["19"] = 39,["20"] = 50,["21"] = 51,["22"] = 52,["25"] = 55,["26"] = 56,["27"] = 57,["28"] = 58,["29"] = 58,["30"] = 58,["31"] = 58,["33"] = 60,["34"] = 61,["35"] = 60,["36"] = 36,["37"] = 65,["38"] = 66,["39"] = 67,["40"] = 68,["41"] = 68,["42"] = 69,["43"] = 69,["44"] = 69,["45"] = 69,["46"] = 69,["47"] = 69,["48"] = 72,["49"] = 73,["50"] = 74,["51"] = 75,["52"] = 76,["53"] = 77,["56"] = 80,["57"] = 81,["58"] = 82,["59"] = 83,["61"] = 85,["62"] = 86,["66"] = 69,["67"] = 69,["68"] = 68,["69"] = 92,["70"] = 65,["71"] = 22,["72"] = 23,["73"] = 24,["74"] = 26,["75"] = 27,["76"] = 28,["77"] = 30,["78"] = 34});
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
ApiClient.HOST_NAME = "https://windy10v10ai.web.app/api"
return ____exports
