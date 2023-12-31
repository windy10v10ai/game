local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["6"] = 2,["7"] = 3,["8"] = 4,["9"] = 5,["10"] = 6,["11"] = 19,["12"] = 19,["13"] = 19,["15"] = 19,["16"] = 34,["17"] = 41,["18"] = 46,["19"] = 47,["20"] = 58,["21"] = 59,["22"] = 60,["25"] = 63,["26"] = 64,["27"] = 65,["28"] = 66,["29"] = 66,["30"] = 66,["31"] = 66,["33"] = 68,["34"] = 69,["35"] = 68,["36"] = 34,["37"] = 73,["38"] = 74,["39"] = 75,["40"] = 76,["41"] = 76,["42"] = 77,["43"] = 77,["44"] = 77,["45"] = 77,["46"] = 77,["47"] = 82,["48"] = 84,["49"] = 85,["50"] = 86,["51"] = 87,["52"] = 88,["53"] = 89,["56"] = 92,["57"] = 93,["58"] = 94,["59"] = 95,["61"] = 97,["62"] = 98,["66"] = 77,["67"] = 77,["68"] = 76,["69"] = 105,["70"] = 73,["71"] = 20,["72"] = 21,["73"] = 22,["74"] = 24,["75"] = 25,["76"] = 26,["77"] = 28,["78"] = 32});
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
