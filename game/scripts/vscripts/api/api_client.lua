local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["6"] = 2,["7"] = 3,["8"] = 4,["9"] = 5,["10"] = 6,["11"] = 19,["12"] = 19,["13"] = 19,["15"] = 19,["16"] = 34,["17"] = 41,["18"] = 46,["19"] = 50,["20"] = 61,["21"] = 62,["22"] = 63,["25"] = 66,["26"] = 67,["27"] = 68,["28"] = 69,["29"] = 69,["30"] = 69,["31"] = 69,["33"] = 71,["34"] = 72,["35"] = 71,["36"] = 34,["37"] = 76,["38"] = 77,["39"] = 78,["40"] = 79,["41"] = 79,["42"] = 80,["43"] = 80,["44"] = 80,["45"] = 80,["46"] = 80,["47"] = 85,["48"] = 87,["49"] = 88,["50"] = 89,["51"] = 90,["52"] = 91,["53"] = 92,["56"] = 95,["57"] = 96,["58"] = 97,["59"] = 98,["61"] = 100,["62"] = 101,["66"] = 80,["67"] = 80,["68"] = 79,["69"] = 108,["70"] = 76,["71"] = 20,["72"] = 21,["73"] = 22,["74"] = 24,["75"] = 25,["76"] = 26,["77"] = 28,["78"] = 32});
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
