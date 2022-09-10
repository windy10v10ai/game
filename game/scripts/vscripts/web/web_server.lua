--[[ ============================================================================================================
	Author: Windy
	Date: April 16, 2022
================================================================================================================= ]]


--------------------
-- Initial
--------------------
if WebServer == nil then
  print("WebServer initialize!")
	_G.WebServer = class({}) -- put in the global scope
end


function WebServer:Initial()
  self.hostname = "https://windy10v10ai.web.app/api"
  if AIGameMode.DebugMode then
    self.hostname = "http://localhost:5000/api"
  end

  -- 会员
  WebServer.memberSteamAccountID = SetMember {
    -- 开发贡献者
    136407523,1194383041,143575444,314757913,385130282,967052298,1159610111,353885092,
    -- 测试
    916506173,
  }

  WebServer.getMemberInfoSuccess = false
  WebServer:GetMemberAll(0)
end

--------------------
-- Web functions
--------------------
function WebServer:RootAPI()
  local path = ""
  local key = GetDedicatedServerKeyV2("windy10v10ai")
  local url = self.hostname .. path .. "?key="..key
  print("[WEB]helloGET url: " .. url)
  local request = CreateHTTPRequest( "GET", url )
  -- request:SetHTTPRequestHeaderValue("apiKey", key)
  request:Send( function( result )
    if result.StatusCode == 200 then
      print( "[WEB]helloGET result: " .. result.Body )
      local data = json.decode(result.Body)
      PrintTable(data)
    else
      print( "[WEB]helloGET failed with error " .. result.StatusCode )
    end
  end )
end

-- function WebServer:GetMember()
--   local path = "/members"
--   local url = self.hostname .. path
--   local key = GetDedicatedServerKeyV2("windy10v10ai")
--   print("[WEB]members url: " .. url)
--   local request = CreateHTTPRequest( "GET", url )
--   request:Send( function( result )
--     if result.StatusCode == 200 then
--       if string.find(result.Body, "136407523") then
--         local data = json.decode(result.Body)
--         print("[WEB]members table: ")
--         PrintTable(data)
--         WebServer.memberSteamAccountID = Set(data)
--         print("[WEB]memberSteamAccountID: ")
--         PrintTable(WebServer.memberSteamAccountID)
--       else
--         print( "[WEB]getMember failed with error " .. result.StatusCode )
--       end
--     else
--       print( "[WEB]getMember failed with error " .. result.StatusCode )
--     end
--   end )
-- end


function WebServer:GetMemberAll(retryTime)
  if WebServer.getMemberInfoSuccess then
    return
  end
  local path = "/members/all"
  local steamIdQuery = ""
  for playerID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
    if PlayerResource:IsValidPlayerID(playerID) and PlayerResource:IsValidPlayer(playerID) then
      if string.len (steamIdQuery) > 0 then
        steamIdQuery = steamIdQuery .. ","
      end
      steamIdQuery = steamIdQuery .. tostring(PlayerResource:GetSteamAccountID(playerID))
    end
  end
  local url = self.hostname .. path .. "?retryTime="..retryTime.."&steamId="..steamIdQuery
  local key = GetDedicatedServerKeyV2("windy10v10ai")
  print("[WEB]members url: " .. url)
  local request = CreateHTTPRequest( "GET", url )
  -- send request
  request:Send( function( result )
    -- response
    if WebServer.getMemberInfoSuccess then
      return
    end

    if result.StatusCode == 200 then
      local data = json.decode(result.Body)
      print("[WEB]members table: ")
      PrintTable(data)
      for k,v in pairs(data) do
        WebServer.memberSteamAccountID[v.steamId] = v
      end
      print("[WEB]memberSteamAccountID: ")
      PrintTable(WebServer.memberSteamAccountID)
      WebServer.getMemberInfoSuccess = true
    else
      print( "[WEB]getMember failed with error " .. result.StatusCode )
    end
  end )

  -- retry after 5 seconds
  Timers:CreateTimer(5,function()
    if WebServer.getMemberInfoSuccess then
      return
    end
    if retryTime < 10 then
      WebServer:GetMemberAll(retryTime+1)
    end
  end)
end
