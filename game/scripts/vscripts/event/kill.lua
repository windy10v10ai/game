local dropTable = nil
-- 发言库定义
local TauntMessages = {
    -- Boss击杀玩家
    boss_kill_player = {
        "侥幸侥幸", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?",
        "哎哟,不小心",
        "队友呢,队友呢?",
        "有点轻松",
        "路过路过?",
        "嘎嘣脆",
        "太脆了吧",
        "不太行啊",
        "这就没了？",
        "差一点点哦",
        "跑快点啊",
        "啧啧啧",
        "就这反应？",
        "抓住一个", "呵呵!", "你们一起上吧",
        "我就散个步", "这就倒了?", "菜就多练啊", "还得练啊小老弟儿", "毫无压力", "继续来啊",
        "别送了"
    },

    -- Boss连杀玩家 (连续击杀3次以上)
    boss_rampage = {
        "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?",
        "?", "?", "?", "?", "?", "?", "?", "?", "?",
        "你不会急眼了把？", "大家看他好急啊，他好气呀", "撒一把米在你的键盘上，鸡都玩的比你溜", "你玩游戏的这个时间，还不如多看几集喜羊羊", "你比美团还能送", "哥哥上手吧，别用脚玩了",
        "你一直不杀人，是信佛吗？", "我要开直播", "两只耳朵中间夹着的是回族的禁忌吗", "逗？", "对面是人机吗？",
        "还有谁?", "就这?", "?", "送?", "送,接着送", "有点子寂寞哟", "太简单了", "哎哟，我以为减速带呢",
        "弟弟", "一个能打的都没有",
        "喜欢虐AI是吧？", "无聊", "没意思", "杀得我都累了", "排队送是吧", "能不能认真点？", "这就是你们的全部实力？", "跟挠痒一样",
        "再来十个也没用", "是不是没吃饭？", "打不动我啊", "放弃吧别挣扎了", "这波我血都没掉多少", "是不是没吃饭？", "打不动我啊", "放弃吧别挣扎了", "这波我血都没掉多少", "速通失败警告",
        "集体送福利？", "血皮掉了一点，好怕", "虐菜的感觉真不错", "优秀优秀", "再送超鬼了", "你还还手啊，这样搞得我很没有成就感知道吗", "是不是该充钱了？", "这伤害有点刮啊兄弟",
        "再来一波就通关了（我）", "还有高手？", "根本停不下来", "你不是很能打么？", "杀你们都嫌浪费时间",
        "建议直接投降省时间", "来多少送多少，不挑食",
        "这就是所谓的大佬？笑了", "刮痧都比你们疼", "再送下去我都满级了", "能不能换点新花样？", "下波我站着让你们打", "菜到我都不想动手",
        "排队送人头，服务真周到", "你们这是在给我挠痒痒吗", "连杀记录又刷新了，谢谢啊", "刮痧大队集合了？", "速通失败警告"
    },
    -- 玩家击杀Boss
    player_kill_boss = {
        "哦ho",
        "大意了，没有闪",
        "有点意思",
        "什么情况",
        "卧槽",
        "不是，我说",
        "什么鬼",
        "啥",
        "阴啊",
        "哎呀",
        "卡",
        "轻敌了轻敌了",
        "可以可以",
        "这波我的",
        "Hey!",
        "wtf",
        "！",
        "！",
        "wtf",
        "SHIT",
        "！",
        "不对不对",
        "翻了个车"
    },

    -- 玩家连杀Boss (同一玩家连续击杀Boss 3次以上)
    player_rampage_boss = {
        "不行不行,我得刷会儿野",
        "是不是啊,人都没看清就被秒了",
        "畜牲!", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?",
        "你特么",
        "后里希！",
        "马泽法克！",
        "我特么",
        "错了错了,别打了",
        "哥,别打了,哥",
        "好好好,这么玩是吧",
        "我服了",
        "大佬别充了，服了服了",
        "我真是",
        "哪天AI崛起了第一个干你",
        "真的服了",
        "别打了别打了",
        "投了投了",
        "打不过打不过",
        "这什么伤害",
        "离谱",
        "太离谱了",
        "这还怎么玩",
        "不讲武德是吧",
        "年轻人，讲讲武德啊",
        "耗子尾汁啊",
        "我劝你们耗子尾汁啊",
        "不玩了不玩了",
        "你这伤害开了吧",
        "见面就秒还玩个屁",
        "能不能给条活路",
        "我装备还没齐呢",
        "再杀我要报警了",
        "放过孩子吧",
        "这游戏平衡吗？",
        "我退群还不行吗",
        "停手吧",
        "狗东西",
        "*!",
        "啥啥啥这都是啥",
        "炸房吧毁灭吧",
        "你们这帮小老弟儿就看着大哥挨揍是吧",
        "停手吧",
        "再杀我删游戏了",
        "别杀了，给AI留点面子",
        "我怀疑你开了",
        "打不过就加入行不行",
        "再杀报警了",
        "我心态崩了，真的",
        "这游戏的Boss太难了（指我）",
        "给条活路行不行，大哥",
        "我怀疑你充了八万",
        "服了"
    }
}

-- 全局连杀计数器(不区分具体玩家)
local BossKillStreak = 0       -- Boss击杀玩家的总连杀数
local PlayerKillBossStreak = 0 -- 玩家击杀Boss的总连杀数

local function SendTauntMessage(messageType)
    local messages = TauntMessages[messageType]
    if messages and #messages > 0 then
        local randomIndex = RandomInt(1, #messages)
        local message = messages[randomIndex]

        -- 计算延迟时间:基于字数,0.5-3秒
        local messageLength = string.len(message)
        -- 假设每10个字符增加0.25秒,最小0.5秒,最大3秒
        local delay = math.min(math.max(0.8, messageLength * 0.2), 4.0)

        print("SendTauntMessage - Message length: " .. messageLength .. ", Delay: " .. delay .. "s")

        -- 延迟发送消息
        Timers:CreateTimer(delay, function()
            local formattedMessage = "<font color='#FF0000'>⚠️ BotBoss: " .. message .. "</font>"
            GameRules:SendCustomMessage(formattedMessage, 0, 0)
            print("Message sent: " .. message)
        end)
    end
end
local function CreateItemLocal(sItemName, hEntity)
    local item = CreateItem(sItemName, nil, nil)
    local pos = hEntity:GetAbsOrigin()
    CreateItemOnPositionSync(pos, item)
    local pos_launch = pos + RandomVector(RandomFloat(150, 200))
    item:LaunchLoot(false, 200, 0.75, pos_launch, nil)
end

local function RollDrops(hHero)
    if not dropTable then
        dropTable = LoadKeyValues("scripts/kv/item_drops.kv")
    end
    for item_name, chance in pairs(dropTable) do
        for i = 0, 8 do
            local hItem = hHero:GetItemInSlot(i)
            if hItem then
                local hItem_name = hItem:GetName()
                if item_name == hItem_name then
                    if RollPercentage(chance) then
                        -- Remove the item
                        -- hHero:RemoveItem(hItem)
                        UTIL_RemoveImmediate(hItem)
                        -- Create the item
                        if item_name == "item_excalibur" then
                            CreateItemLocal(item_name, hHero)
                        end
                    end
                end
            end
        end
    end
end

local function RecordBarrackKilled(hEntity)
    local team = hEntity:GetTeamNumber()
    if DOTA_TEAM_GOODGUYS == team then
        AIGameMode.barrackPushedBad = AIGameMode.barrackPushedBad + 1
        print("barrackPushedBad ", AIGameMode.barrackPushedBad)
    elseif DOTA_TEAM_BADGUYS == team then
        AIGameMode.barrackPushedGood = AIGameMode.barrackPushedGood + 1
        print("barrackPushedGood ", AIGameMode.barrackPushedGood)
    end
end

local function RecordTowerKilled(hEntity)
    local team = hEntity:GetTeamNumber()
    local sName = hEntity:GetUnitName()
    if string.find(sName, "tower1") then
        if DOTA_TEAM_GOODGUYS == team then
            AIGameMode.tower1PushedBad = AIGameMode.tower1PushedBad + 1
            print("tower1PushedBad ", AIGameMode.tower1PushedBad)
        elseif DOTA_TEAM_BADGUYS == team then
            AIGameMode.tower1PushedGood = AIGameMode.tower1PushedGood + 1
            print("tower1PushedGood ", AIGameMode.tower1PushedGood)
        end
    elseif string.find(sName, "tower2") then
        if DOTA_TEAM_GOODGUYS == team then
            AIGameMode.tower2PushedBad = AIGameMode.tower2PushedBad + 1
            print("tower2PushedBad ", AIGameMode.tower2PushedBad)
        elseif DOTA_TEAM_BADGUYS == team then
            AIGameMode.tower2PushedGood = AIGameMode.tower2PushedGood + 1
            print("tower2PushedGood ", AIGameMode.tower2PushedGood)
        end
    elseif string.find(sName, "tower3") then
        if DOTA_TEAM_GOODGUYS == team then
            AIGameMode.tower3PushedBad = AIGameMode.tower3PushedBad + 1
            print("tower3PushedBad ", AIGameMode.tower3PushedBad)
            -- 破高地后 给4塔 基地添加分裂箭
            if AIGameMode.tower3PushedBad == 1 then
                local towers = Entities:FindAllByClassname("npc_dota_tower")
                for _, tower in pairs(towers) do
                    if string.find(tower:GetUnitName(), "npc_dota_goodguys_tower4") then
                        local towerSplitShot = tower:AddAbility("tower_split_shot")
                        if towerSplitShot then
                            towerSplitShot:SetLevel(1)
                            towerSplitShot:ToggleAbility()
                        end
                    end
                end
                local forts = Entities:FindAllByClassname("npc_dota_fort")
                for _, fort in pairs(forts) do
                    if string.find(fort:GetUnitName(), "npc_dota_goodguys_fort") then
                        local towerSplitShot = fort:AddAbility("tower_split_shot")
                        if towerSplitShot then
                            towerSplitShot:SetLevel(3)
                            towerSplitShot:ToggleAbility()
                        end
                    end
                end
            end
        elseif DOTA_TEAM_BADGUYS == team then
            AIGameMode.tower3PushedGood = AIGameMode.tower3PushedGood + 1
            print("tower3PushedGood ", AIGameMode.tower3PushedGood)
            -- 破高地后 给4塔 基地添加分裂箭
            if AIGameMode.tower3PushedGood == 1 then
                local towers = Entities:FindAllByClassname("npc_dota_tower")
                for _, tower in pairs(towers) do
                    if string.find(tower:GetUnitName(), "npc_dota_badguys_tower4") then
                        local towerSplitShot = tower:AddAbility("tower_split_shot")
                        if towerSplitShot then
                            towerSplitShot:SetLevel(1)
                            towerSplitShot:ToggleAbility()
                        end
                    end
                end
                local forts = Entities:FindAllByClassname("npc_dota_fort")
                for _, fort in pairs(forts) do
                    if string.find(fort:GetUnitName(), "npc_dota_badguys_fort") then
                        local towerSplitShot = fort:AddAbility("tower_split_shot")
                        if towerSplitShot then
                            towerSplitShot:SetLevel(2)
                            towerSplitShot:ToggleAbility()
                        end
                    end
                end
            end
        end
    elseif string.find(sName, "tower4") then
        if DOTA_TEAM_GOODGUYS == team then
            AIGameMode.tower4PushedBad = AIGameMode.tower4PushedBad + 1
            print("tower4PushedBad ", AIGameMode.tower4PushedBad)
        elseif DOTA_TEAM_BADGUYS == team then
            AIGameMode.tower4PushedGood = AIGameMode.tower4PushedGood + 1
            print("tower4PushedGood ", AIGameMode.tower4PushedGood)
        end
    end
end

-- local tDOTARespawnTime = { 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 23, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64 }
local function HeroKilled(keys)
    local hHero = EntIndexToHScript(keys.entindex_killed)
    local attacker = EntIndexToHScript(keys.entindex_attacker)
    local playerId = hHero:GetPlayerID() -- 死亡玩家id
    local attackerPlayer = attacker:GetPlayerOwner()
    local attackerPlayerID = -1
    if attackerPlayer then
        attackerPlayerID = attackerPlayer:GetPlayerID()
    end
    local isBoss = hHero.isBoss or false
    local attackerIsBoss = attacker.isBoss or false
    -- Boss击杀玩家
    if attackerIsBoss and not isBoss then
        -- 增加Boss全局连杀计数
        BossKillStreak = BossKillStreak + 1
        -- 重置玩家击杀Boss的连杀
        PlayerKillBossStreak = 0
        -- ✅ Boss击杀玩家后模型增大
        if not attacker.bossKillCount then
            attacker.bossKillCount = 0
            attacker.bossBaseScale = attacker:GetModelScale() or 1.0
        end
        attacker.bossKillCount = attacker.bossKillCount + 1
        -- 计算发言概率:基础30% + 连杀数 * 10%,最高100%
        local speakProbability = math.min(20 + BossKillStreak * 10, 100)
        local randomValue = RandomInt(1, 100)

        print("Boss kill player - KillStreak: " ..
            BossKillStreak .. ", Probability: " .. speakProbability .. "%, Random: " .. randomValue)

        if randomValue <= speakProbability then
            print("Boss speak triggered")
            if BossKillStreak >= 2 then
                SendTauntMessage("boss_rampage")
            else
                SendTauntMessage("boss_kill_player")
            end
        else
            print("Boss speak skipped")
        end
    end

    -- 玩家击杀Boss
    if not attackerIsBoss and isBoss and attackerPlayer then
        -- 增加玩家全局击杀Boss计数
        PlayerKillBossStreak = PlayerKillBossStreak + 1
        -- 重置Boss的连杀
        BossKillStreak = 0

        -- ✅ Boss被击杀后模型减小
        if not hHero.bossDeathCount then
            hHero.bossDeathCount = 0
            hHero.bossBaseScale = hHero:GetModelScale() or 1.0
        end
        hHero.bossDeathCount = hHero.bossDeathCount + 1

        -- 减小模型，但不能小于基础大小的50%
        local scaleReduction = hHero.bossDeathCount * 0.05
        local newScale = math.max(hHero.bossBaseScale * 0.5, hHero.bossBaseScale - scaleReduction)
        hHero:SetModelScale(newScale)

        -- 每2次死亡升1级，最高30级
        local newLevel = math.min(math.floor(hHero.bossDeathCount / 2), 30)

        local bossAbility = hHero:FindAbilityByName("boss_death_power")
        if bossAbility then
            bossAbility:SetLevel(newLevel)
            print(string.format("[BotBoss] Boss %s death count: %d, ability level: %d",
                hHero:GetUnitName(), hHero.bossDeathCount, newLevel))
        end
        -- 计算发言概率:基础30% + 连杀数 * 10%,最高100%
        local speakProbability = math.min(20 + PlayerKillBossStreak * 10, 100)
        local randomValue = RandomInt(1, 100)

        print("Player kill Boss - KillStreak: " ..
            PlayerKillBossStreak .. ", Probability: " .. speakProbability .. "%, Random: " .. randomValue)

        if randomValue <= speakProbability then
            print("Player speak triggered")
            if PlayerKillBossStreak >= 2 then
                SendTauntMessage("player_rampage_boss")
            else
                SendTauntMessage("player_kill_boss")
            end
        else
            print("Player speak skipped")
        end
    end

    local iLevel = hHero:GetLevel()
    local GameTime = GameRules:GetDOTATime(false, false)

    -- ✅ 检查被击杀的英雄是否是Boss
    local bossMultiplier = 1

    if isBoss then
        -- 根据Bot经验金钱倍数决定奖励倍率
        local botMultiplier = AIGameMode.fBotGoldXpMultiplier or 1
        if botMultiplier >= 60 then
            bossMultiplier = 3
        elseif botMultiplier >= 20 then
            bossMultiplier = 2.5
        else
            bossMultiplier = 2
        end

        --print(string.format("[BotBoss] Boss %s was killed! Bot multiplier: %.0fx, Reward multiplier: %dx",
        --    hHero:GetUnitName(), botMultiplier, bossMultiplier))
    end
    -- 玩家团队奖励逻辑
    if attackerPlayer and IsGoodTeamPlayer(attackerPlayerID) and IsBadTeamPlayer(playerId) then
        -- 前期增长慢，电脑等级较高时，增长快
        local gold = 0
        if iLevel <= 30 then
            gold = 5 + iLevel * 0.5
        elseif iLevel <= 50 then
            gold = 20 + (iLevel - 30) * 1
        else
            gold = 40
        end
        -- ✅ 应用Boss倍率
        gold = math.ceil(gold * bossMultiplier)

        for playerID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
            if attackerPlayerID ~= playerID and PlayerResource:IsValidPlayerID(playerID) and
                PlayerResource:IsValidPlayer(playerID) and
                PlayerResource:GetSelectedHeroEntity(playerID) and IsGoodTeamPlayer(playerID) then
                GameRules:ModifyGoldFiltered(playerID, gold, true, DOTA_ModifyGold_HeroKill)
                local playerHero = PlayerResource:GetSelectedHeroEntity(playerID)
                SendOverheadEventMessage(playerHero, OVERHEAD_ALERT_GOLD, playerHero,
                    gold * AIGameMode:GetPlayerGoldXpMultiplier(playerID), playerHero)
            end
        end

        --if isBoss then
        --    print(string.format("[BotBoss] Team members received %d gold (%dx multiplier)", gold, bossMultiplier))
        --end
    end

    -- AI连续死亡记录
    if attackerPlayer and IsGoodTeamPlayer(attackerPlayerID) and IsBadTeamPlayer(playerId) then
        if AIGameMode.BotRecordSuccessiveDeathTable[playerId] then
            AIGameMode.BotRecordSuccessiveDeathTable[playerId] = AIGameMode.BotRecordSuccessiveDeathTable[playerId] + 1
        else
            AIGameMode.BotRecordSuccessiveDeathTable[playerId] = 1
        end
    end

    -- AI连续死亡记录清零
    if attackerPlayer and IsBadTeamPlayer(attackerPlayerID) and IsGoodTeamPlayer(playerId) then
        AIGameMode.BotRecordSuccessiveDeathTable[attackerPlayerID] = 0
    end

    -- AI连死补偿
    -- AI 50级后不再补偿
    if attackerPlayer and IsGoodTeamPlayer(attackerPlayerID) and IsBadTeamPlayer(playerId) and
        AIGameMode.BotRecordSuccessiveDeathTable[playerId] and AIGameMode.BotRecordSuccessiveDeathTable[playerId] >= 3 then
        -- 补偿的金钱和经验 设计上不应该超过AI通过击杀玩家获得的
        local deathCount = AIGameMode.BotRecordSuccessiveDeathTable[playerId]
        local gold = 0
        local xp = 0

        -- 基础值
        if GameTime <= 5 * 60 then
            gold = 20
            xp = 40
        elseif GameTime <= 10 * 60 then
            gold = 30
            xp = 60
        else
            gold = 40
            xp = 80
        end

        -- 击杀者等级加成
        local killerLevel = attacker:GetLevel()
        gold = gold + killerLevel * 6
        xp = xp + killerLevel * 4

        if iLevel >= 50 then
            xp = 0
        end

        -- 连死次数补正
        local extraFactor = math.max(1, deathCount - 2)

        -- 两边团队击杀数补正
        local playerTeamKill = PlayerResource:GetTeamKills(PlayerResource:GetTeam(attackerPlayerID))
        local AITeamKill = PlayerResource:GetTeamKills(PlayerResource:GetTeam(playerId))
        local teamKillFactor = playerTeamKill / (AITeamKill + 3) - 1

        -- 补正之和在0-10之间
        local totalFactor = extraFactor + teamKillFactor
        totalFactor = math.max(totalFactor, 0)
        totalFactor = math.min(totalFactor, 10)
        -- 玩家数量减少时降低倍率
        totalFactor = totalFactor * (AIGameMode.playerNumber) / 10


        gold = math.ceil(gold * totalFactor)
        xp = math.ceil(xp * AIGameMode:GetPlayerGoldXpMultiplier(playerId) * totalFactor)

        if PlayerResource:IsValidPlayerID(playerId) and PlayerResource:IsValidPlayer(playerId) and
            PlayerResource:GetSelectedHeroEntity(playerId) then
            GameRules:ModifyGoldFiltered(playerId, gold, true, DOTA_ModifyGold_CreepKill)
            hHero:AddExperience(xp, DOTA_ModifyXP_CreepKill, false, false)
        end
    end
end

--------------------------------------------------------------------------------
-- Killed event
--------------------------------------------------------------------------------

function AIGameMode:OnEntityKilled(keys)
    local hEntity = EntIndexToHScript(keys.entindex_killed)
    -- on hero killed
    if hEntity:IsRealHero() and hEntity:IsReincarnating() == false then
        HeroKilled(keys)
        -- drop items only when killed by hero
        -- if EntIndexToHScript(keys.entindex_attacker):GetPlayerOwner() then
        RollDrops(EntIndexToHScript(keys.entindex_killed))
        -- end
    end
    -- on barrack killed
    if hEntity:GetClassname() == "npc_dota_barracks" then
        RecordBarrackKilled(hEntity)
    end
    -- on tower killed
    if hEntity:GetClassname() == "npc_dota_tower" then
        RecordTowerKilled(hEntity)
    end
end
