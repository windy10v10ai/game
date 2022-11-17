local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["6"] = 3,["7"] = 4,["8"] = 5,["9"] = 6,["10"] = 7,["11"] = 10,["12"] = 10,["13"] = 10,["15"] = 10,["16"] = 18,["17"] = 19,["18"] = 20,["19"] = 21,["20"] = 23,["21"] = 24,["22"] = 25,["25"] = 28,["26"] = 29,["27"] = 30,["28"] = 31,["29"] = 31,["30"] = 31,["31"] = 31,["33"] = 33,["34"] = 35,["35"] = 36,["37"] = 38,["38"] = 39,["40"] = 33,["41"] = 18,["42"] = 44,["43"] = 45,["44"] = 46,["45"] = 46,["46"] = 47,["47"] = 47,["48"] = 47,["49"] = 47,["50"] = 47,["51"] = 47,["52"] = 48,["53"] = 49,["54"] = 50,["55"] = 51,["56"] = 52,["58"] = 54,["61"] = 57,["63"] = 47,["64"] = 47,["65"] = 46,["66"] = 61,["67"] = 44,["68"] = 11,["69"] = 12,["70"] = 13,["71"] = 14,["72"] = 15,["73"] = 14});
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
function ApiClient.send(self, method, path, params, body, callback)
    print(((((((("[ApiClient] " .. method) .. " ") .. ____exports.ApiClient.HOST_NAME) .. path) .. " with params ") .. json.encode(params)) .. " body ") .. json.encode(body))
    local request = CreateHTTPRequestScriptVM(method, ____exports.ApiClient.HOST_NAME .. path)
    local key = GetDedicatedServerKeyV2(____exports.ApiClient.VERSION)
    if params then
        for key in pairs(params) do
            request:SetHTTPRequestGetOrPostParameter(key, params[key])
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
            callback(nil, result.Body)
        else
            print("[ApiClient] get error: " .. tostring(result.StatusCode))
            callback(nil, "error")
        end
    end)
end
function ApiClient.sendWithRetry(self, method, path, params, body, callback)
    local retryCount = 0
    local retry
    retry = function()
        self:send(
            method,
            path,
            params,
            body,
            function(____, data)
                if data == "error" then
                    retryCount = retryCount + 1
                    if retryCount < ____exports.ApiClient.RETRY_TIMES then
                        print("[ApiClient] getWithRetry retry " .. tostring(retryCount))
                        retry(nil)
                    else
                        CustomNetTables:SetTableValue("loading_status", "loading_status", {status = 3})
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
