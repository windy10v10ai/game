-- 个性化测试环境
function AIGameMode:ApplyTestOptions()
    print('------------------------读取个性化测试环境------------------------')
    if self.DebugMode and PlayerResource:GetSteamAccountID(0) == 245559423 then
        self.iDesiredRadiant = 1
        self.iDesiredDire = 1
    end
end