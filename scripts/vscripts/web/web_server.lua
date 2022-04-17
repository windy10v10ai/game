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
  self.hostname = "https://asia-northeast1-windy10v10ai.cloudfunctions.net"

  -- 会员
  WebServer.memberSteamAccountID = Set {
    -- 开发贡献者
    136407523,1194383041,143575444,314757913,385130282,
    -- 初始会员
    108208968,
    128984820,
    136668998,
    107451500,
    141315077,
    303743871,
    117417953,
    319701690,
    142964279,
    125049949,
    -- 测试
    -- 916506173,
  }

  PrintTable(WebServer.memberSteamAccountID)

  WebServer:GetMember()
  WebServer:helloGET()
end

--------------------
-- Web functions
--------------------
function WebServer:helloGET()
  local path = "/helloGET"
  local url = self.hostname .. path
  local key = GetDedicatedServerKeyV2("helloGET")
  print("helloGET url: " .. url)
  print("helloGET key: " .. key)
  local request = CreateHTTPRequest( "POST", url )
  -- request:SetHTTPRequestHeaderValue("apiKey", key)
  request:SetHTTPRequestRawPostBody("application/json", json.encode({name=key}))
  request:Send( function( result )
    if result.StatusCode == 200 then
      print( "helloGET result: " .. result.Body )
      local data = json.decode(result.Body)
    else
      print( "helloGET failed with error " .. result.StatusCode )
    end
  end )
end

function WebServer:GetMember()
  local path = "/getMember"
  local url = self.hostname .. path
  local key = GetDedicatedServerKeyV2("helloGET")
  print("getMember url: " .. url)
  local request = CreateHTTPRequest( "POST", url )
  -- request:SetHTTPRequestHeaderValue("apiKey", key)
  request:SetHTTPRequestRawPostBody("application/json", json.encode({name=key}))
  request:Send( function( result )
    if result.StatusCode == 200 then
      if string.find(result.Body, "136407523") then
        local data = json.decode(result.Body)
        WebServer.memberSteamAccountID = Set(data)
        print("memberSteamAccountID: ")
        PrintTable(WebServer.memberSteamAccountID)
      else
        print( "getMember failed with error " .. result.StatusCode )
      end
    else
      print( "getMember failed with error " .. result.StatusCode )
    end
  end )
end
