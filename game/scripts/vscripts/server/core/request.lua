local ____lualib = require("lualib_bundle")
local __TS__ArrayIsArray = ____lualib.__TS__ArrayIsArray
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
local __TS__ObjectEntries = ____lualib.__TS__ObjectEntries
local __TS__StringReplace = ____lualib.__TS__StringReplace
local __TS__ObjectAssign = ____lualib.__TS__ObjectAssign
local __TS__ArrayFilter = ____lualib.__TS__ArrayFilter
local __TS__ArrayReduce = ____lualib.__TS__ArrayReduce
local __TS__StringIncludes = ____lualib.__TS__StringIncludes
local __TS__Promise = ____lualib.__TS__Promise
local __TS__New = ____lualib.__TS__New
local __TS__AsyncAwaiter = ____lualib.__TS__AsyncAwaiter
local __TS__Await = ____lualib.__TS__Await
local __TS__ArrayIncludes = ____lualib.__TS__ArrayIncludes
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["18"] = 5,["19"] = 5,["20"] = 7,["21"] = 8,["22"] = 7,["23"] = 11,["24"] = 12,["25"] = 11,["26"] = 15,["27"] = 16,["28"] = 18,["29"] = 19,["30"] = 19,["31"] = 19,["32"] = 19,["33"] = 18,["34"] = 22,["35"] = 22,["36"] = 23,["37"] = 24,["38"] = 25,["39"] = 25,["40"] = 25,["41"] = 26,["42"] = 25,["43"] = 25,["44"] = 28,["45"] = 29,["46"] = 29,["47"] = 29,["48"] = 29,["49"] = 29,["50"] = 29,["51"] = 29,["52"] = 30,["53"] = 30,["54"] = 30,["55"] = 30,["56"] = 30,["57"] = 29,["58"] = 29,["60"] = 33,["63"] = 22,["64"] = 38,["65"] = 38,["66"] = 38,["67"] = 38,["68"] = 38,["69"] = 38,["70"] = 38,["71"] = 39,["72"] = 38,["73"] = 38,["74"] = 42,["75"] = 43,["77"] = 46,["78"] = 15,["79"] = 49,["80"] = 50,["81"] = 52,["82"] = 53,["83"] = 54,["85"] = 56,["86"] = 49,["87"] = 59,["88"] = 60,["89"] = 60,["90"] = 60,["91"] = 65,["92"] = 65,["93"] = 65,["94"] = 65,["95"] = 65,["96"] = 60,["97"] = 60,["98"] = 67,["99"] = 67,["100"] = 67,["101"] = 67,["102"] = 67,["103"] = 67,["104"] = 67,["105"] = 67,["106"] = 67,["107"] = 67,["108"] = 60,["109"] = 60,["110"] = 60,["111"] = 74,["112"] = 75,["113"] = 76,["114"] = 77,["115"] = 78,["118"] = 82,["119"] = 59,["120"] = 85,["121"] = 86,["122"] = 87,["123"] = 87,["124"] = 87,["126"] = 87,["127"] = 88,["128"] = 89,["129"] = 90,["131"] = 92,["134"] = 95,["135"] = 85,["136"] = 98,["137"] = 99,["138"] = 99,["139"] = 99,["140"] = 99,["141"] = 99,["142"] = 99,["143"] = 99,["144"] = 99,["145"] = 99,["146"] = 109,["147"] = 110,["148"] = 111,["150"] = 114,["152"] = 98,["153"] = 119,["155"] = 128,["156"] = 130,["157"] = 130,["158"] = 130,["159"] = 131,["161"] = 135,["162"] = 138,["164"] = 141,["165"] = 142,["167"] = 143,["168"] = 144,["169"] = 145,["170"] = 146,["171"] = 146,["172"] = 146,["173"] = 147,["174"] = 148,["175"] = 147,["176"] = 146,["177"] = 146,["178"] = 145,["181"] = 152,["184"] = 119,["191"] = 162,["192"] = 163,["193"] = 163,["194"] = 163,["197"] = 165,["198"] = 166,["199"] = 167,["200"] = 169,["201"] = 170,["202"] = 170,["203"] = 170,["204"] = 170,["205"] = 170,["206"] = 170,["207"] = 170,["208"] = 170,["209"] = 170,["210"] = 170,["211"] = 180,["212"] = 183,["214"] = 185,["215"] = 186,["216"] = 188,["217"] = 189,["218"] = 189,["219"] = 189,["221"] = 190,["222"] = 190,["223"] = 190,["225"] = 188,["227"] = 193,["228"] = 193,["232"] = 184,["235"] = 196,["237"] = 184,["240"] = 164,["243"] = 200,["245"] = 164,["247"] = 163,["248"] = 163,["249"] = 162});
local ____exports = {}
local ____OpenAPI = require("server.core.OpenAPI")
local NoSignatureURLs = ____OpenAPI.NoSignatureURLs
local function isDefined(____, value)
    return value ~= nil and value ~= nil
end
local function isString(____, value)
    return type(value) == "string"
end
local function getQueryString(____, params)
    local qs = {}
    local function append(____, key, value)
        qs[#qs + 1] = (encodeURIComponent(nil, key) .. "=") .. encodeURIComponent(
            nil,
            tostring(value)
        )
    end
    local process
    process = function(____, key, value)
        if isDefined(nil, value) then
            if __TS__ArrayIsArray(value) then
                __TS__ArrayForEach(
                    value,
                    function(____, v)
                        process(nil, key, v)
                    end
                )
            elseif type(value) == "table" then
                __TS__ArrayForEach(
                    __TS__ObjectEntries(value),
                    function(____, ____bindingPattern0)
                        local v
                        local k
                        k = ____bindingPattern0[1]
                        v = ____bindingPattern0[2]
                        process(
                            nil,
                            ((key .. "[") .. tostring(k)) .. "]",
                            v
                        )
                    end
                )
            else
                append(nil, key, value)
            end
        end
    end
    __TS__ArrayForEach(
        __TS__ObjectEntries(params),
        function(____, ____bindingPattern0)
            local value
            local key
            key = ____bindingPattern0[1]
            value = ____bindingPattern0[2]
            process(nil, key, value)
        end
    )
    if #qs > 0 then
        return "?" .. table.concat(qs, "&")
    end
    return ""
end
local function getUrl(____, config, options)
    local path = __TS__StringReplace(options.url, "{api-version}", config.VERSION)
    local url = config.BASE .. path
    if options.query then
        return url .. getQueryString(nil, options.query)
    end
    return url
end
local function getHeaders(____, config, options)
    local headers = __TS__ArrayReduce(
        __TS__ArrayFilter(
            __TS__ObjectEntries(__TS__ObjectAssign({Accept = "application/json"}, config.HEADERS, options.headers)),
            function(____, ____bindingPattern0)
                local value
                local _ = ____bindingPattern0[1]
                value = ____bindingPattern0[2]
                return isDefined(nil, value)
            end
        ),
        function(____, headers, ____bindingPattern0)
            local value
            local key
            key = ____bindingPattern0[1]
            value = ____bindingPattern0[2]
            return __TS__ObjectAssign(
                {},
                headers,
                {[key] = tostring(value)}
            )
        end,
        {}
    )
    if options.body then
        if options.mediaType then
            headers["Content-Type"] = options.mediaType
        elseif isString(nil, options.body) then
            headers["Content-Type"] = "text/plain"
        end
    end
    return headers
end
local function getRequestBody(____, options)
    if options.body then
        local ____options_mediaType_includes_result_0 = options.mediaType
        if ____options_mediaType_includes_result_0 ~= nil then
            ____options_mediaType_includes_result_0 = __TS__StringIncludes(options.mediaType, "/json")
        end
        if ____options_mediaType_includes_result_0 then
            return json.encode(options.body)
        elseif isString(nil, options.body) then
            return options.body
        else
            return json.encode(options.body)
        end
    end
    return nil
end
local function throwError(____, result)
    local errors = {
        [400] = "Bad Request",
        [401] = "Unauthorized",
        [403] = "Forbidden",
        [404] = "Not Found",
        [500] = "Internal Server Error",
        [502] = "Bad Gateway",
        [503] = "Service Unavailable"
    }
    local __error = errors[result.StatusCode]
    if __error ~= nil then
        error(__error)
    end
    if result.StatusCode ~= 200 then
    end
end
____exports.sendRequest = function(____, config, options, url, body, headers, sign, authKey)
    return __TS__AsyncAwaiter(function(____awaiter_resolve)
        local request = CreateHTTPRequestScriptVM(options.method, url)
        for ____, ____value in ipairs(__TS__ObjectEntries(headers)) do
            local k = ____value[1]
            local v = ____value[2]
            request:SetHTTPRequestHeaderValue(k, v)
        end
        if sign then
            request:SetHTTPRequestHeaderValue("dota-authKey", authKey)
        end
        if body ~= nil then
            request:SetHTTPRequestRawPostBody(options.mediaType or "application/json", body)
        end
        request:SetHTTPRequestAbsoluteTimeoutMS(config.ABSOLUTE_TIMEOUT)
        request:SetHTTPRequestNetworkActivityTimeout(config.NETWORK_ACTIVITY_TIMEOUT)
        local function send()
            return __TS__New(
                __TS__Promise,
                function(____, resolve, reject)
                    request:Send(function(result)
                        resolve(nil, result)
                    end)
                end
            )
        end
        return ____awaiter_resolve(
            nil,
            __TS__Await(send(nil))
        )
    end)
end
--- Request method
-- 
-- @param config The OpenAPI configuration object
-- @param options The request options from the service
-- @returns CancelablePromise<T>
-- @throws ApiError
____exports.request = function(____, config, options)
    return __TS__New(
        __TS__Promise,
        function(____, resolve, reject)
            return __TS__AsyncAwaiter(function(____awaiter_resolve)
                local ____try = __TS__AsyncAwaiter(function()
                    local url = getUrl(nil, config, options)
                    local body = getRequestBody(nil, options)
                    local headers = getHeaders(nil, config, options)
                    local should_sign = not __TS__ArrayIncludes(NoSignatureURLs, options.url)
                    local response = __TS__Await(____exports.sendRequest(
                        nil,
                        config,
                        options,
                        url,
                        body,
                        headers,
                        should_sign,
                        config.AUTHKEY
                    ))
                    throwError(nil, response)
                    if response.Body ~= nil then
                        local ____try = __TS__AsyncAwaiter(function()
                            local data = JSON:decode(response.Body)
                            if data and data.state == "ERROR" then
                                local ____reject_4 = reject
                                local ____data_errorCode_2 = data.errorCode
                                if ____data_errorCode_2 == nil then
                                    ____data_errorCode_2 = "UNKNOWN ERROR CODE"
                                end
                                local ____data_errorMessage_3 = data.errorMessage
                                if ____data_errorMessage_3 == nil then
                                    ____data_errorMessage_3 = "No Message"
                                end
                                ____reject_4(nil, {errorCode = ____data_errorCode_2, errorMessage = ____data_errorMessage_3})
                            else
                                if data ~= nil then
                                    resolve(nil, data)
                                end
                            end
                        end)
                        __TS__Await(____try.catch(
                            ____try,
                            function(____, e)
                                reject(nil, e)
                            end
                        ))
                    end
                end)
                __TS__Await(____try.catch(
                    ____try,
                    function(____, e)
                        reject(nil, e)
                    end
                ))
            end)
        end
    )
end
return ____exports
