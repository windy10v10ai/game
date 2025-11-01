local dropTable = nil
-- 发言库定义
local TauntMessages = {
    -- Boss击杀玩家
    boss_kill_player = {
        schinese = {
            "侥幸侥幸", "哎哟,不小心", "队友呢,队友呢?", "有点轻松",
            "路过路过?", "嘎嘣脆", "找踢呢", "你瞅啥", "让你看了吗",
            "这就没了？", "差一点点哦", "跑快点啊", "啧啧啧",
            "你看你m呢", "欸，你不要似啊", "你怎么好像有点似了",
            "抓住一个", "呵呵!", "我就散个步", "这就倒了?",
            "菜就多练啊", "还得练啊小老弟儿", "毫无压力", "别送了"
        },
        english = {
            "Lucky shot", "Oops, my bad", "Where's your team?",
            "Too easy", "Just passing by", "Crispy", "Looking for trouble?",
            "What are you looking at", "Did I say you could watch?",
            "That's it?", "So close", "Run faster", "Tsk tsk tsk",
            "Caught one", "Hehe!", "Just taking a walk", "Already down?",
            "Practice more", "Still need practice, buddy", "No pressure",
            "Stop feeding"
        }
    },

    boss_rampage = {
        schinese = {
            "你不会急眼了把？", "大家看他好急啊，他好气呀",
            "撒一把米在键盘上，鸡都玩的比你溜",
            "你玩游戏的这个时间，还不如多看几集喜羊羊",
            "你比美团还能送", "哥哥上手吧，别用脚玩了",
            "还有谁?", "就这?", "送,接着送", "有点子寂寞哟",
            "太简单了", "弟弟", "一个能打的都没有",
            "喜欢虐AI是吧？", "无聊", "没意思", "杀得我都累了",
            "排队送是吧", "能不能认真点？", "这就是你们的全部实力？",
            "再来十个也没用", "是不是没吃饭？", "打不动我啊",
            "放弃吧别蹦跶了", "集体送福利？", "血皮掉了一点，好怕",
            "优秀优秀", "再送超鬼了", "是不是该充钱了？",
            "再来一波就通关了（我）", "还有高手？", "根本停不下来",
            "建议直接投降省时间", "来多少杀多少，不挑食",
            "这就是所谓的大佬？笑了", "再送下去我都满级了",
            "排队送人头，服务真周到", "连杀记录又刷新了，谢谢啊"
        },
        english = {
            "Getting mad?", "Look how angry they are",
            "Even a chicken on the keyboard plays better",
            "You deliver better than food delivery",
            "Use your hands, not your feet",
            "Who's next?", "Is that all?", "Keep feeding",
            "Getting lonely here", "Too easy", "Noob",
            "No one can fight", "Like bullying AI?", "Boring",
            "Getting tired of killing", "Lining up to feed?",
            "Can you be serious?", "Is this your full power?",
            "Ten more won't help", "Did you eat?", "Can't hurt me",
            "Give up already", "Group feeding?", "Lost a bit of HP, scary",
            "Excellent", "Keep feeding for beyond godlike",
            "Should you pay to win?", "One more wave and I win",
            "Any pros?", "Can't stop", "Just surrender to save time",
            "Kill as many as you send", "So-called pros? LOL",
            "Keep feeding and I'll max level",
            "Queueing to feed, nice service", "New kill streak record, thanks"
        }
    },

    player_kill_boss = {
        schinese = {
            "哦ho", "大意了，没有闪", "有点意思", "什么情况",
            "卧槽", "不是，我说", "什么鬼", "啥", "阴啊", "哎呀",
            "卡", "轻敌了轻敌了", "可以可以", "这波我的",
            "Hey!", "fk", "wtf", "SHIT", "不对不对", "翻了个车"
        },
        english = {
            "Oh ho", "Careless, no flash", "Interesting",
            "What happened", "WTF", "Wait, I mean", "What the",
            "Huh", "Sneaky", "Ouch", "Lag", "Underestimated",
            "Nice nice", "My bad", "Hey!", "fk", "wtf",
            "SHIT", "Wait wait", "Messed up"
        }
    },

    player_rampage_boss = {
        schinese = {
            "不行不行,我得刷会儿野", "是不是啊,人都没看清就被秒了",
            "畜牲!", "你特么", "后里希！", "马泽法克！", "我特么",
            "错了错了,别打了", "哥,别打了,哥", "好好好,这么玩是吧",
            "我服了", "大佬别充了，服了服了", "我真是",
            "哪天AI崛起了第一个干你", "真的服了", "别打了别打了",
            "投了投了", "我不服！", "我一定要杀了你", "巴噶！",
            "你这狗东西", "他妈的我好气啊！", "打不过打不过",
            "这什么伤害", "离谱", "这尼玛", "太离谱了",
            "这还怎么玩", "不讲武德是吧", "年轻人，讲讲武德啊",
            "不玩了不玩了", "你这伤害开了吧", "见面就秒还玩个屁",
            "能不能给条活路", "我装备还没齐呢", "报警了",
            "放过孩子吧", "这游戏平衡吗？", "我退群还不行吗",
            "停手吧", "狗东西", "喂，110吗", "炸房吧毁灭吧",
            "再杀我删游戏了", "别杀了，给AI留点面子",
            "有种你就杀我一百次", "我怀疑你开了",
            "打不过就加入行不行", "再杀报警了", "我心态崩了，真的",
            "这游戏的Boss太难了（指我）", "给条活路行不行，大哥",
            "我怀疑你充了八万", "服了"
        },
        english = {
            "No no, I need to farm", "Instant kill before I see anything",
            "Beast!", "You damn", "Holy sh*t!", "WTF!", "I swear",
            "Wrong wrong, stop hitting", "Bro, stop, bro",
            "OK OK, playing like this huh", "I give up",
            "Stop paying to win, I surrender", "I really",
            "When AI rises, you're first", "Really give up",
            "Stop stop", "I surrender", "I won't accept this!",
            "I'll kill you", "Baka!", "You bastard",
            "I'm so angry!", "Can't win", "What damage is this",
            "Ridiculous", "WTF", "Too ridiculous", "How to play this",
            "No honor", "Young man, show some honor",
            "Not playing anymore", "You're cheating right",
            "Instant kill, can't play", "Give me a chance",
            "My items aren't ready", "Calling the police",
            "Leave the kid alone", "Is this game balanced?",
            "I quit", "Stop it", "Bastard", "Hello, 911?",
            "Just destroy the game", "Kill me again and I uninstall",
            "Stop, give AI some face", "Kill me 100 times if you dare",
            "I think you're cheating", "Can't beat them, join them?",
            "Kill again and I report", "My mental is broken, really",
            "This game's Boss is too hard (me)", "Give me a chance, bro",
            "I think you paid 80k", "Give up"
        }
    }
}
-- 全局连杀计数器(不区分具体玩家)
local BossKillStreak = 0       -- Boss击杀玩家的总连杀数
local PlayerKillBossStreak = 0 -- 玩家击杀Boss的总连杀数
local function SendTauntMessage(messageType, playerID)
    -- 获取玩家语言设置
    local language = "schinese" -- 默认中文
    if playerID then
        local languageData = CustomNetTables:GetTableValue("player_language", tostring(playerID))
        if languageData and languageData.lang then
            language = languageData.lang
        end
    end

    -- 获取对应语言的消息列表
    local messages = TauntMessages[messageType] and TauntMessages[messageType][language]

    -- 如果没有对应语言,回退到中文
    if not messages or #messages == 0 then
        messages = TauntMessages[messageType] and TauntMessages[messageType]["schinese"]
    end

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
