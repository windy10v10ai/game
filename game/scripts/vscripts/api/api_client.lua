local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["6"] = 3,["7"] = 3,["8"] = 3,["10"] = 3,["11"] = 11,["12"] = 12,["13"] = 13,["14"] = 14,["15"] = 15,["17"] = 17,["18"] = 18,["19"] = 19,["20"] = 20,["22"] = 22,["23"] = 23,["25"] = 18,["26"] = 11,["27"] = 29,["28"] = 30,["29"] = 31,["30"] = 31,["31"] = 32,["32"] = 32,["33"] = 32,["34"] = 32,["35"] = 33,["36"] = 34,["37"] = 35,["38"] = 36,["39"] = 37,["42"] = 40,["44"] = 32,["45"] = 32,["46"] = 31,["47"] = 44,["48"] = 29,["49"] = 4,["50"] = 5,["51"] = 6,["52"] = 7,["53"] = 6});
local ____exports = {}
____exports.ApiClient = __TS__Class()
local ApiClient = ____exports.ApiClient
ApiClient.name = "ApiClient"
function ApiClient.prototype.____constructor(self)
end
function ApiClient.get(self, url, params, callback)
    print(((("[ApiClient] get " .. ____exports.ApiClient.HOST_NAME) .. url) .. " with ") .. json.encode(params))
    local request = CreateHTTPRequestScriptVM("GET", ____exports.ApiClient.HOST_NAME .. url)
    for key in pairs(params) do
        request:SetHTTPRequestGetOrPostParameter(key, params[key])
    end
    request:SetHTTPRequestNetworkActivityTimeout(____exports.ApiClient.TIMEOUT_SECONDS)
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
ApiClient.TIMEOUT_SECONDS = 30
ApiClient.RETRY_TIMES = 3
ApiClient.HOST_NAME = (function()
    return IsInToolsMode() and "http://localhost:5000/api" or "https://windy10v10ai.web.app/api"
end)(nil)
return ____exports
