
-- 注册测试人员id
local developerSteamAccountID = {}
developerSteamAccountID[136407523] = "windy"
developerSteamAccountID[1194383041] = "咸鱼"
developerSteamAccountID[143575444] = "茶神"
developerSteamAccountID[314757913] = "孤尘"
developerSteamAccountID[916506173] = "Arararara"
developerSteamAccountID[385130282] = "米米花"
developerSteamAccountID[353885092] = "76岁靠谱成年男性"
developerSteamAccountID[245559423] = "puck1609"

local luoshuHeroSteamAccountID = Set { 136668998, 138837968 }

function AIGameMode:OnPlayerChat(event)
    local iPlayerID = event.playerid
    local sChatMsg = event.text
    if not iPlayerID or not sChatMsg then
        return
    end
    local steamAccountID = PlayerResource:GetSteamAccountID(iPlayerID)

    if AIGameMode.DebugMode and developerSteamAccountID[steamAccountID] then
        if sChatMsg:find('^-greedisgood$') then
            -- give money to the player
            -- get hero
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            local iGold = 10000
            hHero:ModifyGold(iGold, true, DOTA_ModifyGold_CheatCommand)
            GameRules:SendCustomMessage("号外号外！开发者:" .. developerSteamAccountID[steamAccountID] ..
                    " 用自己的菊花交换了增加10000金币", DOTA_TEAM_GOODGUYS, 0)
            return
        end
        if sChatMsg:find('^-pos$') then
            -- get position
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            -- print position
            local pos = hHero:GetAbsOrigin()
            GameRules:SendCustomMessage("开发者:" .. developerSteamAccountID[steamAccountID] .. " 的位置是:" ..
                    pos.x .. "," .. pos.y .. "," .. pos.z, DOTA_TEAM_GOODGUYS, 0)
            print(
                    "开发者:" .. developerSteamAccountID[steamAccountID] .. " 的位置是:" .. pos.x .. "," .. pos.y ..
                            "," .. pos.z)
            return
        end

        if sChatMsg:find('^-modifier$') then
            -- get position
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            -- print all modifiers
            local modifiers = hHero:FindAllModifiers()
            for _, modifier in pairs(modifiers) do
                print("Get here modifiers: ", modifier:GetName())
            end
            return
        end

        if sChatMsg:find('^-kill$') then
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            hHero:ForceKill(true)
            return
        end

        if sChatMsg:find('^-refresh buyback$') then
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            hHero:SetBuybackCooldownTime(0)
            return
        end

        if sChatMsg:find('^-shard$') then
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            hHero:AddItemByName('item_aghanims_shard')
            return
        end
        if sChatMsg:find('^-item$') then
            AIGameMode.tIfItemChosen[iPlayerID] = false
            AIGameMode.tIfItemChooseInited[iPlayerID] = false
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            AIGameMode:SpecialItemAdd(hHero)
            return
        end
        if sChatMsg:find('^-playerinfo$') then
            print('playerid:')
            print(iPlayerID)
            print('steamid:')
            print(PlayerResource:GetSteamAccountID(iPlayerID))
            return
        end

        if sChatMsg:find('^-postgame$') then
            print("[AIGameMode] SendEndGameInfo POST_GAME")
            local endData = AIGameMode:EndScreenStats(2, true)
            Game:SendEndGameInfo(endData)
            return
        end

        if sChatMsg:find('^-g$') then
            local hero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            PlayerResource:ModifyGold(iPlayerID, 99999, true, DOTA_ModifyGold_CheatCommand)
            hero:AddExperience(49999, DOTA_ModifyXP_Unspecified, false, false)
            return
        end

        if sChatMsg:find('^-gall$') then
            local tAllHeroes = FindUnitsInRadius(DOTA_TEAM_NOTEAM, Vector(0, 0, 0), nil, 99999, DOTA_UNIT_TARGET_TEAM_BOTH, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
            for _, hero in pairs(tAllHeroes) do
                hero:ModifyGold(99999, true, DOTA_ModifyGold_CheatCommand)
                hero:AddExperience(999999, DOTA_ModifyXP_Unspecified, false, false)
            end
            return
        end

    end

    if Player:IsMember(steamAccountID) then
        local pszHeroClass

        if sChatMsg:find('-超级赛亚人') then
            pszHeroClass = "npc_dota_hero_chen"
        end
        if sChatMsg:find('-Goku') then
            pszHeroClass = "npc_dota_hero_chen"
        end

        if sChatMsg:find('-八云紫') then
            pszHeroClass = "npc_dota_hero_phantom_lancer"
        end
        if sChatMsg:find('-Yukari') then
            pszHeroClass = "npc_dota_hero_phantom_lancer"
        end
        if pszHeroClass ~= nil then
            if AIGameMode.tIfChangeHeroList[iPlayerID] then
                return
            end
            AIGameMode.tIfChangeHeroList[iPlayerID] = true
            AIGameMode.tIfItemChosen[iPlayerID] = false
            AIGameMode.tIfItemChooseInited[iPlayerID] = false
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            PlayerResource:ReplaceHeroWith(iPlayerID, pszHeroClass, hHero:GetGold(), hHero:GetCurrentXP())
            return
        end
    end
    if luoshuHeroSteamAccountID[steamAccountID] then
        local pszHeroClass
        if sChatMsg:find('-超级赛亚人') then
            pszHeroClass = "npc_dota_hero_chen"
        end
        if sChatMsg:find('-男妈妈来哩') then
            pszHeroClass = "npc_dota_hero_brewmaster"
        end
        if pszHeroClass ~= nil then
            if AIGameMode.tIfChangeHeroList[iPlayerID] then
                return
            end
            AIGameMode.tIfChangeHeroList[iPlayerID] = true
            AIGameMode.tIfItemChosen[iPlayerID] = false
            AIGameMode.tIfItemChooseInited[iPlayerID] = false
            local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
            PlayerResource:ReplaceHeroWith(iPlayerID, pszHeroClass, hHero:GetGold(), hHero:GetCurrentXP())
            return
        end
    end
end
