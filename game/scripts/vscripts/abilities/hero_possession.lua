-- 做一个技能，拥有这个技能的英雄，每隔一分钟，会向服务器发送该英雄的当前属性，装备，吃书/银月数量，玩家id等；然后服务器端会对这个发送过来的信息进行比对，如果比服务器已存的三个该英雄的装备/书总价高，则存入，成为最强英雄。然后拥有这个技能的英雄，在基地旁的两个塔均被破的时候，可以从服务器读取三个历史上最强英雄附身，获取全部的属性，装备，吃书/银月数量等，并向屏幕发送消息，获得某玩家id附身。持续最长10s钟，然后恢复英雄本来的装备和属性状态；请先假设已经从服务器端获取了数据快照（包括六个格子的装备，吃的智力力量敏捷书的数量，人物等级，额外的几个lottery技能等），请撰写代码，将这些移植到自己身上，并在持续时间到了之后恢复原样。

--暂不实装，可能改成一个装备，至尊会员专享，基地门牙塔破一个可以使用；

LinkLuaModifier("modifier_hero_possession", "abilities/hero_possession", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_hero_possession_item_lock", "abilities/hero_possession", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_hero_possession_stats", "abilities/hero_possession", LUA_MODIFIER_MOTION_NONE)

hero_possession = hero_possession or class({})
modifier_hero_possession = modifier_hero_possession or class({})
modifier_hero_possession_item_lock = modifier_hero_possession_item_lock or class({})
modifier_hero_possession_stats = modifier_hero_possession_stats or class({})

function hero_possession:DebugLog(message)
    print("[HeroPossession] " .. message)
end

function hero_possession:OnSpellStart()
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("duration")

    self:DebugLog("=== 开始施放附身技能 ===")

    if not self:CheckTowerCondition() then
        self:DebugLog("错误: 塔条件未满足")
        self:EndCooldown()
        return
    end
    -- 生成唯一ID
    local uniqueId = DoUniqueString("possession_" .. caster:GetEntityIndex() .. "_" .. GameRules:GetGameTime())

    self:FetchAndApplySnapshot(caster, duration, uniqueId)
end

function hero_possession:CheckTowerCondition()
    local caster = self:GetCaster()
    local team = caster:GetTeamNumber()

    -- 使用全局变量检查己方4塔被摧毁数量
    local tower4_destroyed = 0
    if team == DOTA_TEAM_GOODGUYS then
        -- 玩家是天辉,检查天辉的4塔
        tower4_destroyed = AIGameMode.tower4PushedBad or 0
    else
        -- 玩家是夜魇,检查夜魇的4塔
        tower4_destroyed = AIGameMode.tower4PushedGood or 0
    end

    self:DebugLog("己方被摧毁的4塔数量: " .. tower4_destroyed)
    return tower4_destroyed >= 1
end

function hero_possession:FetchAndApplySnapshot(caster, duration, uniqueId)
    self:DebugLog("=== 获取并应用快照 === ID: " .. uniqueId)

    local snapshot = {
        items = { "item_magic_crit_blade", "item_ten_thousand_swords", "item_time_gem", "item_hawkeye_fighter", "item_beast_armor", "item_beast_shield" },
        strTomes = 5,
        agiTomes = 5,
        intTomes = 15,
        moonShards = 2,
        hasLuoshu = true,
        luoshuAllStats = 100,
        lotteryAbilities = {
            { name = "elder_titan_natural_order", level = 4 },
            { name = "ability_trigger_on_move",   level = 4 }
        },
        playerId = "RENO"
    }

    local savedState = self:SaveHeroState(caster)
    self:ApplySnapshot(caster, snapshot, duration, uniqueId)

    local modifier = caster:AddNewModifier(caster, self, "modifier_hero_possession", {
        duration = duration,
        unique_id = uniqueId -- 传递唯一ID
    })

    if modifier then
        modifier.savedState = savedState
        modifier.addedAbilities = {}
        modifier.uniqueId = uniqueId -- 保存唯一ID

        for _, abilityData in pairs(snapshot.lotteryAbilities) do
            table.insert(modifier.addedAbilities, abilityData.name)
        end

        self:DebugLog("Modifier创建成功, 持续时间: " .. duration .. "秒, ID: " .. uniqueId)
    end

    GameRules:SendCustomMessage(
        "巅峰时刻的玩家 --" .. snapshot.playerId .. "-- 前来支援!", 0, 0)
end

function hero_possession:SaveHeroState(hero)
    local state = {
        items = {},
        strTomes = 0,
        agiTomes = 0,
        intTomes = 0,
        moonShards = 0,
        hasLuoshu = false,
        baseStr = hero:GetBaseStrength(),
        baseAgi = hero:GetBaseAgility(),
        baseInt = hero:GetBaseIntellect()
    }

    self:DebugLog("保存装备:")
    for item_slot = DOTA_ITEM_SLOT_1, DOTA_ITEM_SLOT_9 do
        local item = hero:GetItemInSlot(item_slot)
        if item then
            table.insert(state.items, item:GetName())
            self:DebugLog("  槽位" .. item_slot .. ": " .. item:GetName())
        end
    end

    for item_slot = DOTA_STASH_SLOT_1, DOTA_STASH_SLOT_6 do
        local item = hero:GetItemInSlot(item_slot)
        if item then
            table.insert(state.items, item:GetName())
            self:DebugLog("  储藏处" .. item_slot .. ": " .. item:GetName())
        end
    end

    local unitName = hero:GetUnitName()
    local strTable = CustomNetTables:GetTableValue("player_tome_table", "str_tome_" .. unitName)
    state.strTomes = strTable and strTable.str or 0
    self:DebugLog("力量书数量: " .. state.strTomes)

    local agiTable = CustomNetTables:GetTableValue("player_tome_table", "agi_tome_" .. unitName)
    state.agiTomes = agiTable and agiTable.agi or 0
    self:DebugLog("敏捷书数量: " .. state.agiTomes)

    local intTable = CustomNetTables:GetTableValue("player_tome_table", "int_tome_" .. unitName)
    state.intTomes = intTable and intTable.int or 0
    self:DebugLog("智力书数量: " .. state.intTomes)

    local moonMods = hero:FindAllModifiersByName("modifier_item_moon_shard_datadriven_consumed")
    state.moonShards = #moonMods
    self:DebugLog("银月数量: " .. state.moonShards)

    state.hasLuoshu = hero:HasModifier("modifier_luoshu_tome")
    self:DebugLog("洛书状态: " .. tostring(state.hasLuoshu))

    return state
end

function hero_possession:ApplySnapshot(hero, snapshot, duration, uniqueId)
    if not hero or not IsValidEntity(hero) then
        self:DebugLog("错误: hero对象无效,无法应用快照")
        return false
    end

    -- 1. 统计当前装备数量
    local currentItemCounts = {}
    for item_slot = DOTA_ITEM_SLOT_1, DOTA_ITEM_SLOT_9 do
        local item = hero:GetItemInSlot(item_slot)
        if item then
            local itemName = item:GetName()
            currentItemCounts[itemName] = (currentItemCounts[itemName] or 0) + 1
        end
    end

    -- 2. 统计快照装备数量
    local snapshotItemCounts = {}
    for _, itemName in pairs(snapshot.items) do
        snapshotItemCounts[itemName] = (snapshotItemCounts[itemName] or 0) + 1
    end

    -- 3. 只移除需要替换的装备(快照中没有或数量更少的)
    self:DebugLog("移除需要替换的装备:")
    for item_slot = DOTA_ITEM_SLOT_1, DOTA_ITEM_SLOT_9 do
        local item = hero:GetItemInSlot(item_slot)
        if item then
            local itemName = item:GetName()
            local currentCount = currentItemCounts[itemName] or 0
            local snapshotCount = snapshotItemCounts[itemName] or 0

            -- 如果快照中这个装备数量更少,则移除
            if snapshotCount < currentCount then
                self:DebugLog("  移除槽位" .. item_slot .. ": " .. itemName)
                UTIL_RemoveImmediate(item)
                currentItemCounts[itemName] = currentCount - 1
            end
        end
    end

    -- 4. 添加快照装备(只添加新增的)
    self:DebugLog("添加快照装备:")
    for _, itemName in pairs(snapshot.items) do
        local currentCount = currentItemCounts[itemName] or 0
        local snapshotCount = snapshotItemCounts[itemName] or 0

        -- 只添加快照中多出来的装备
        if currentCount < snapshotCount then
            local item = hero:AddItemByName(itemName)
            if item then
                self:DebugLog("  添加: " .. itemName)
                currentItemCounts[itemName] = currentCount + 1
            end
        end
    end
    -- 保存快照装备信息到modifier,使用唯一ID
    local itemLockMod = hero:AddNewModifier(hero, self, "modifier_hero_possession_item_lock", {
        duration = duration,
        unique_id = uniqueId
    })
    if itemLockMod then
        itemLockMod.snapshotItems = snapshotItemCounts
        itemLockMod.originalItems = {}
        itemLockMod.uniqueId = uniqueId -- 保存唯一ID
        for k, v in pairs(currentItemCounts) do
            itemLockMod.originalItems[k] = v
        end
    end

    -- 应用属性加成,使用唯一ID
    self:ApplyAttributeBonus(hero, snapshot, duration, uniqueId)

    -- 添加lottery技能,并标记所属
    self:DebugLog("添加Lottery技能:")
    for _, abilityData in pairs(snapshot.lotteryAbilities) do
        local abilityName = abilityData.name
        local existingAbility = hero:FindAbilityByName(abilityName)
        if not existingAbility then
            hero:AddAbility(abilityName)
            local ability = hero:FindAbilityByName(abilityName)
            if ability then
                ability:SetLevel(abilityData.level)
                ability.possessionUniqueId = uniqueId
                self:DebugLog("  添加: " .. abilityName .. " (等级" .. abilityData.level .. ") ID: " .. uniqueId)
            end
        else
            -- ✅ 修复: 也要标记 uniqueId
            existingAbility:SetLevel(math.max(existingAbility:GetLevel(), abilityData.level))
            existingAbility.possessionUniqueId = uniqueId -- 添加这行
            self:DebugLog("  技能已存在,更新等级和标记: " .. abilityName)
        end
    end

    local particle = ParticleManager:CreateParticle("particles/units/heroes/hero_morphling/morphling_morph.vpcf",
        PATTACH_ABSORIGIN_FOLLOW, hero)
    ParticleManager:ReleaseParticleIndex(particle)
    hero:EmitSound("Hero_Morphling.Morph")

    return true
end

function hero_possession:ApplyAttributeBonus(hero, snapshot, duration, uniqueId)
    if not hero or not IsValidEntity(hero) then
        self:DebugLog("错误: hero对象无效")
        return
    end

    local TOME_BONUS = 100
    local MOON_SHARD_ATTACK_SPEED = 100

    local bonusStr = snapshot.strTomes * TOME_BONUS
    local bonusAgi = snapshot.agiTomes * TOME_BONUS
    local bonusInt = snapshot.intTomes * TOME_BONUS
    local bonusAttackSpeed = snapshot.moonShards * MOON_SHARD_ATTACK_SPEED

    local luoshuAllStats = 0
    local luoshuSpellAmp = 0
    local luoshuStatusResist = 0

    if snapshot.hasLuoshu then
        luoshuAllStats = snapshot.luoshuAllStats or 100
        luoshuSpellAmp = 50
        luoshuStatusResist = 30

        bonusStr = bonusStr + luoshuAllStats
        bonusAgi = bonusAgi + luoshuAllStats
        bonusInt = bonusInt + luoshuAllStats

        self:DebugLog("  洛书全属性: " .. luoshuAllStats)
        self:DebugLog("  洛书技能增强: " .. luoshuSpellAmp .. "%")
        self:DebugLog("  洛书状态抗性: " .. luoshuStatusResist .. "%")
    end

    if not self or not self.GetSpecialValueFor then
        self:DebugLog("错误: ability对象无效")
        return
    end

    local modifier = hero:AddNewModifier(hero, self, "modifier_hero_possession_stats", {
        duration = duration,
        bonus_str = bonusStr,
        bonus_agi = bonusAgi,
        bonus_int = bonusInt,
        bonus_attack_speed = bonusAttackSpeed,
        spell_amp = luoshuSpellAmp,
        status_resistance = luoshuStatusResist,
        unique_id = uniqueId -- 传递唯一ID
    })

    if modifier then
        modifier.uniqueId = uniqueId -- 保存唯一ID
        self:DebugLog("  属性加成modifier创建成功, ID: " .. uniqueId)
    end
end

-- Modifier实现
function modifier_hero_possession:IsHidden()
    return false
end

function modifier_hero_possession:IsPurgable()
    return false
end

function modifier_hero_possession:GetEffectName()
    return "particles/units/heroes/hero_morphling/morphling_morph.vpcf"
end

function modifier_hero_possession:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end

function modifier_hero_possession:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_DEATH
    }
end

-- function modifier_hero_possession:OnDeath(params)
--     if not IsServer() then return end

--     local parent = self:GetParent()
--     if params.unit == parent then
--         local ability = self:GetAbility()

--         -- 记录剩余时间
--         self.remainingDuration = self:GetRemainingTime()
--         ability:DebugLog("=== 英雄死亡,暂停附身 === 剩余时间: " .. self.remainingDuration .. "秒")

--         -- 暂停主 modifier
--         self:SetDuration(-1, true)

--         -- ✅ 同步暂停 item_lock modifier
--         local itemLockMods = parent:FindAllModifiersByName("modifier_hero_possession_item_lock")
--         for _, mod in pairs(itemLockMods) do
--             if mod.uniqueId == self.uniqueId then
--                 mod:SetDuration(-1, true)
--                 break
--             end
--         end

--         -- ✅ 同步暂停 stats modifier
--         local statsMods = parent:FindAllModifiersByName("modifier_hero_possession_stats")
--         for _, mod in pairs(statsMods) do
--             if mod.uniqueId == self.uniqueId then
--                 mod:SetDuration(-1, true)
--                 break
--             end
--         end
--     end
-- end

-- function modifier_hero_possession:OnIntervalThink()
--     if not IsServer() then return end

--     local parent = self:GetParent()
--     if not parent or not IsValidEntity(parent) then return end

--     local isAlive = parent:IsAlive()

--     -- 检测到从死亡到重生
--     if not self.wasAlive and isAlive and self.remainingDuration then
--         self:GetAbility():DebugLog("=== 英雄重生,恢复附身 === 剩余时间: " .. self.remainingDuration .. "秒")

--         -- 恢复主 modifier
--         self:SetDuration(self.remainingDuration, true)

--         -- ✅ 同步恢复 item_lock modifier
--         local itemLockMods = parent:FindAllModifiersByName("modifier_hero_possession_item_lock")
--         for _, mod in pairs(itemLockMods) do
--             if mod.uniqueId == self.uniqueId then
--                 mod:SetDuration(self.remainingDuration, true)
--                 break
--             end
--         end

--         -- ✅ 同步恢复 stats modifier
--         local statsMods = parent:FindAllModifiersByName("modifier_hero_possession_stats")
--         for _, mod in pairs(statsMods) do
--             if mod.uniqueId == self.uniqueId then
--                 mod:SetDuration(self.remainingDuration, true)
--                 break
--             end
--         end

--         self.remainingDuration = nil
--     end

--     self.wasAlive = isAlive
-- end

function modifier_hero_possession:OnCreated(params)
    if not IsServer() then return end

    self.uniqueId = params.unique_id or ""
    self.remainingDuration = nil
    self.wasAlive = true

    -- 开始监控英雄状态
    --self:StartIntervalThink(0.5)
end

function modifier_hero_possession:OnDestroy()
    if not IsServer() then return end

    local parent = self:GetParent()
    local ability = self:GetAbility()

    if not parent or not IsValidEntity(parent) then
        ability:DebugLog("警告: 英雄实体无效")
        return
    end

    ability:DebugLog("=== 附身效果结束，开始恢复 === ID: " .. (self.uniqueId or "unknown"))

    -- ✅ 修复: 无论死活都要清理装备和modifier
    if self.savedState and self.uniqueId then
        ability:RestoreHeroState(parent, self.savedState, self.addedAbilities, self.uniqueId)
        -- 如果英雄死亡,只清理装备和modifier,不恢复原装备
        -- if not parent:IsAlive() then
        --     ability:DebugLog("英雄已死亡,仅清理快照装备和modifier")
        --     ability:CleanupSnapshotState(parent, self.uniqueId)
        -- else
        --     -- 英雄存活,完整恢复
        --     ability:RestoreHeroState(parent, self.savedState, self.addedAbilities, self.uniqueId)
        -- end
    end
end

-- function hero_possession:CleanupSnapshotState(hero, uniqueId)
--     self:DebugLog("=== 清理快照状态(不恢复原装备) === ID: " .. uniqueId)

--     -- 1. 移除快照装备
--     local itemLockMods = hero:FindAllModifiersByName("modifier_hero_possession_item_lock")
--     local targetItemLockMod = nil

--     for _, mod in pairs(itemLockMods) do
--         if mod.uniqueId == uniqueId then
--             targetItemLockMod = mod
--             break
--         end
--     end

--     if targetItemLockMod and targetItemLockMod.snapshotItems then
--         local snapshotItems = {}
--         for k, v in pairs(targetItemLockMod.snapshotItems) do
--             snapshotItems[k] = v
--         end

--         self:DebugLog("移除快照装备:")
--         for item_slot = DOTA_ITEM_SLOT_1, DOTA_ITEM_SLOT_9 do
--             local item = hero:GetItemInSlot(item_slot)
--             if item then
--                 local itemName = item:GetName()
--                 if snapshotItems[itemName] and snapshotItems[itemName] > 0 then
--                     self:DebugLog("  移除槽位" .. item_slot .. ": " .. itemName)
--                     UTIL_RemoveImmediate(item)
--                     snapshotItems[itemName] = snapshotItems[itemName] - 1
--                 end
--             end
--         end

--         for item_slot = DOTA_STASH_SLOT_1, DOTA_STASH_SLOT_6 do
--             local item = hero:GetItemInSlot(item_slot)
--             if item then
--                 local itemName = item:GetName()
--                 if snapshotItems[itemName] and snapshotItems[itemName] > 0 then
--                     self:DebugLog("  移除储藏处" .. item_slot .. ": " .. itemName)
--                     UTIL_RemoveImmediate(item)
--                     snapshotItems[itemName] = snapshotItems[itemName] - 1
--                 end
--             end
--         end
--     end

--     -- 2. 移除stats modifier
--     local statsMods = hero:FindAllModifiersByName("modifier_hero_possession_stats")
--     for _, mod in pairs(statsMods) do
--         if mod.uniqueId == uniqueId then
--             mod:Destroy()
--             self:DebugLog("移除属性加成modifier, ID: " .. uniqueId)
--             break
--         end
--     end

--     -- 3. 移除lottery技能
--     self:DebugLog("移除Lottery技能:")
--     for i = 0, hero:GetAbilityCount() - 1 do
--         local ability = hero:GetAbilityByIndex(i)
--         if ability and ability.possessionUniqueId == uniqueId then
--             local abilityName = ability:GetAbilityName()
--             hero:RemoveAbility(abilityName)
--             self:DebugLog("  移除: " .. abilityName .. " ID: " .. uniqueId)
--         end
--     end

--     -- 4. 移除item_lock modifier
--     if targetItemLockMod then
--         targetItemLockMod:Destroy()
--         self:DebugLog("移除item_lock modifier, ID: " .. uniqueId)
--     end
-- end

function hero_possession:RestoreHeroState(hero, savedState, addedAbilities, uniqueId)
    self:DebugLog("=== 恢复英雄状态 === ID: " .. uniqueId)

    -- 1. 找到对应的item_lock modifier并移除快照装备
    local itemLockMods = hero:FindAllModifiersByName("modifier_hero_possession_item_lock")
    local targetItemLockMod = nil

    for _, mod in pairs(itemLockMods) do
        if mod.uniqueId == uniqueId then
            targetItemLockMod = mod
            break
        end
    end

    if targetItemLockMod and targetItemLockMod.snapshotItems then
        local snapshotItems = {}
        -- 深拷贝,避免修改原始数据
        for k, v in pairs(targetItemLockMod.snapshotItems) do
            snapshotItems[k] = v
        end

        self:DebugLog("移除快照装备:")
        for item_slot = DOTA_ITEM_SLOT_1, DOTA_ITEM_SLOT_9 do
            local item = hero:GetItemInSlot(item_slot)
            if item then
                local itemName = item:GetName()
                if snapshotItems[itemName] and snapshotItems[itemName] > 0 then
                    self:DebugLog("  移除槽位" .. item_slot .. ": " .. itemName)
                    UTIL_RemoveImmediate(item)
                    snapshotItems[itemName] = snapshotItems[itemName] - 1
                end
            end
        end

        for item_slot = DOTA_STASH_SLOT_1, DOTA_STASH_SLOT_6 do
            local item = hero:GetItemInSlot(item_slot)
            if item then
                local itemName = item:GetName()
                if snapshotItems[itemName] and snapshotItems[itemName] > 0 then
                    self:DebugLog("  移除储藏处" .. item_slot .. ": " .. itemName)
                    UTIL_RemoveImmediate(item)
                    snapshotItems[itemName] = snapshotItems[itemName] - 1
                end
            end
        end
    end

    -- 2. 恢复原装备
    self:DebugLog("恢复原装备:")
    for _, itemName in pairs(savedState.items) do
        local item = hero:AddItemByName(itemName)
        if item then
            self:DebugLog("  恢复: " .. itemName)
        end
    end

    -- 3. 移除对应的stats modifier
    local statsMods = hero:FindAllModifiersByName("modifier_hero_possession_stats")
    for _, mod in pairs(statsMods) do
        if mod.uniqueId == uniqueId then
            mod:Destroy()
            self:DebugLog("移除属性加成modifier, ID: " .. uniqueId)
            break
        end
    end

    -- 4. 移除添加的lottery技能(只移除属于这个附身实例的)
    self:DebugLog("移除Lottery技能:")
    if addedAbilities then
        for _, abilityName in pairs(addedAbilities) do
            local ability = hero:FindAbilityByName(abilityName)
            if ability and ability.possessionUniqueId == uniqueId then
                hero:RemoveAbility(abilityName)
                self:DebugLog("  移除: " .. abilityName .. " ID: " .. uniqueId)
            else
                self:DebugLog("  跳过: " .. abilityName .. " (属于其他附身实例)")
            end
        end
    end

    -- 5. 移除对应的item_lock modifier
    if targetItemLockMod then
        targetItemLockMod:Destroy()
        self:DebugLog("移除item_lock modifier, ID: " .. uniqueId)
    end

    -- 6. 特效
    local particle = ParticleManager:CreateParticle("particles/units/heroes/hero_morphling/morphling_morph.vpcf",
        PATTACH_ABSORIGIN_FOLLOW, hero)
    ParticleManager:ReleaseParticleIndex(particle)
    hero:EmitSound("Hero_Morphling.Morph")
    self:DebugLog("播放恢复特效和音效")
end

-- 属性加成modifier实现
function modifier_hero_possession_stats:IsHidden()
    return false -- 改为false以便调试查看
end

function modifier_hero_possession_stats:IsPurgable()
    return false
end

function modifier_hero_possession_stats:GetTexture()
    return "hero_possession"
end

function modifier_hero_possession_stats:OnCreated(params)
    if IsServer() then
        self.bonus_str = params.bonus_str or 0
        self.bonus_agi = params.bonus_agi or 0
        self.bonus_int = params.bonus_int or 0
        self.bonus_attack_speed = params.bonus_attack_speed or 0
        self.spell_amp = params.spell_amp or 0
        self.status_resistance = params.status_resistance or 0
        self.uniqueId = params.unique_id or "" -- 接收唯一ID

        -- 启用自定义网络数据传输
        self:SetHasCustomTransmitterData(true)

        --print("[HeroPossession] - OnCreated (Server)", self.spell_amp, self.status_resistance)
    end
end

-- 添加网络数据传输函数
function modifier_hero_possession_stats:AddCustomTransmitterData()
    return {
        bonus_str = self.bonus_str,
        bonus_agi = self.bonus_agi,
        bonus_int = self.bonus_int,
        bonus_attack_speed = self.bonus_attack_speed,
        spell_amp = self.spell_amp,
        status_resistance = self.status_resistance
    }
end

function modifier_hero_possession_stats:HandleCustomTransmitterData(data)
    self.bonus_str = data.bonus_str
    self.bonus_agi = data.bonus_agi
    self.bonus_int = data.bonus_int
    self.bonus_attack_speed = data.bonus_attack_speed
    self.spell_amp = data.spell_amp
    self.status_resistance = data.status_resistance

    --print("[HeroPossession] - HandleCustomTransmitterData (Client)", self.spell_amp, self.status_resistance)
end

function modifier_hero_possession_stats:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
        MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
        MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING, -- 使用STACKING版本
    }
end

function modifier_hero_possession_stats:GetModifierBonusStats_Strength()
    return self.bonus_str or 0
end

function modifier_hero_possession_stats:GetModifierBonusStats_Agility()
    return self.bonus_agi or 0
end

function modifier_hero_possession_stats:GetModifierBonusStats_Intellect()
    return self.bonus_int or 0
end

function modifier_hero_possession_stats:GetModifierAttackSpeedBonus_Constant()
    return self.bonus_attack_speed or 0
end

function modifier_hero_possession_stats:GetModifierSpellAmplify_Percentage()
    -- print("[HeroPossession] - GetModifierSpellAmplify_Percentage", self.spell_amp)
    return self.spell_amp or 0
end

function modifier_hero_possession_stats:GetModifierStatusResistanceStacking()
    -- print("[HeroPossession] - GetModifierStatusResistanceStacking", self.status_resistance)
    return self.status_resistance or 0
end

-- 修复Bug1和Bug2: 物品锁定modifier添加到英雄上
function modifier_hero_possession_item_lock:IsHidden()
    return true
end

function modifier_hero_possession_item_lock:IsPurgable()
    return false
end

function modifier_hero_possession_item_lock:GetAttributes()
    return MODIFIER_ATTRIBUTE_MULTIPLE
end

function modifier_hero_possession_item_lock:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_ORDER
    }
end

function modifier_hero_possession_item_lock:OnCreated(params)
    if not IsServer() then return end

    self.uniqueId = params.unique_id or "" -- ✅ 正确
    local hero = self:GetParent()
    if not hero or not IsValidEntity(hero) then return end

    -- 记录初始金币
    self.initialGold = hero:GetGold()

    -- 开始监控金币变化
    self:StartIntervalThink(1.0)
end

function modifier_hero_possession_item_lock:OnIntervalThink()
    if not IsServer() then return end

    local hero = self:GetParent()
    if not hero or not IsValidEntity(hero) then return end

    local currentGold = hero:GetGold()
    local goldDiff = currentGold - self.initialGold

    -- 如果金币增加了,检查是否是出售物品导致的
    if goldDiff > 1000 then
        -- 检查是否有快照装备被出售
        for itemName, count in pairs(self.snapshotItems or {}) do
            -- 检查这个快照装备是否还在英雄身上
            local item = hero:FindItemInInventory(itemName)
            if not item then
                -- 装备不见了,被出售了
                -- 扣除实际获得的金币
                hero:ModifyGold(-goldDiff, false, DOTA_ModifyGold_Unspecified)

                --print("[HeroPossession] 检测到出售快照装备: " .. itemName .. ", 扣除金币: " .. goldDiff)

                GameRules:SendCustomMessage(
                    "大胆，竟然有人试图出售英灵的装备，没收违法所得" .. goldDiff .. "金币，所出售装备不予返还", 0, 0)

                -- ✅ 关键修复: 从跟踪表中移除已出售的装备
                self.snapshotItems[itemName] = nil

                -- ✅ 关键修复: 立即更新金币记录并返回
                self.initialGold = hero:GetGold()
                return -- 立即返回,避免继续检测
            end
        end
    end

    -- 更新金币记录
    self.initialGold = currentGold
end

function modifier_hero_possession_item_lock:OnOrder(params)
    if not IsServer() then return end

    local hero = self:GetParent()
    if not hero or not IsValidEntity(hero) then return end

    local order = params.order_type
    local ability = params.ability

    -- 检查是否是物品操作
    if not ability or not ability.GetAbilityName then return end

    -- 阻止丢弃附身装备
    if order == DOTA_UNIT_ORDER_DROP_ITEM then
        -- 检查是否是附身期间添加的装备
        local itemName = ability:GetAbilityName()
        self:GetAbility():DebugLog("尝试丢弃物品: " .. itemName)

        -- 立即删除被丢弃的物品
        Timers:CreateTimer(0.01, function()
            if ability and IsValidEntity(ability) and ability:GetContainer() == nil then
                UTIL_RemoveImmediate(ability)
                self:GetAbility():DebugLog("删除被丢弃的附身装备: " .. itemName)
            end
        end)
        return
    end

    -- 阻止出售附身装备
    if order == DOTA_UNIT_ORDER_SELL_ITEM then
        local itemName = ability:GetAbilityName()
        self:GetAbility():DebugLog("阻止出售附身装备: " .. itemName)
        DisplayError(hero:GetPlayerID(), "#dota_hud_error_cant_sell_item")
        return
    end
end

function modifier_hero_possession_item_lock:OnDestroy()
    if not IsServer() then return end
    local hero = self:GetParent()
    if not hero or not IsValidEntity(hero) then return end

    Timers:CreateTimer(0.1, function()
        if not hero or not IsValidEntity(hero) then return end

        -- 查找所有掉落的物品实体
        local droppedItems = Entities:FindAllByClassname("dota_item_drop")
        for _, itemDrop in pairs(droppedItems) do
            if itemDrop and IsValidEntity(itemDrop) then
                local item = itemDrop:GetContainedItem()
                if item and IsValidEntity(item) then
                    local itemName = item:GetName()

                    -- 只处理快照装备
                    if self.snapshotItems and self.snapshotItems[itemName] then
                        UTIL_RemoveImmediate(item)
                        itemDrop:RemoveSelf()
                        --print("[HeroPossession] 清理被丢弃的快照装备: " .. itemName)
                    end
                end
            end
        end
    end)
end
