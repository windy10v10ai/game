-- 个性化测试环境
function AIGameMode:ApplyTestOptions()
    print('------------------------读取个性化测试环境------------------------')
    if self.DebugMode and PlayerResource:GetSteamAccountID(0) == 245559423 then
        self.iDesiredRadiant = 2
        self.iDesiredDire = 3
    end
end