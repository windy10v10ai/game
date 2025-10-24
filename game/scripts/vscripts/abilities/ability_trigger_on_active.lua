-- 引入共享黑名单
require("abilities/ability_blacklist_butterfly")

LinkLuaModifier("modifier_ability_trigger_on_active", "abilities/ability_trigger_on_active.lua", LUA_MODIFIER_MOTION_NONE)

ability_trigger_on_active = class({})

function ability_trigger_on_active:OnSpellStart()
    local caster = self:GetCaster()
    local point = self:GetCursorPosition()
    local duration = self:GetSpecialValueFor("duration") -- 【新增】获取持续时间

    --print("[ability_trigger_on_active1332] OnSpellStart")

    -- 添加modifier,设置持续时间
    caster:AddNewModifier(caster, self, "modifier_ability_trigger_on_active", {
        duration = duration, -- 【新增】设置持续时间
        target_x = point.x,
        target_y = point.y,
        target_z = point.z
    })

    -- 音效
    EmitSoundOn("Hero_Invoker.SunStrike.Ignite", caster)
end

-- ========================================
-- Modifier
-- ========================================
modifier_ability_trigger_on_active = class({})

function modifier_ability_trigger_on_active:IsHidden() return false end

function modifier_ability_trigger_on_active:IsPurgable() return false end

function modifier_ability_trigger_on_active:RemoveOnDeath() return true end

function modifier_ability_trigger_on_active:CheckState()
    return {
        [MODIFIER_STATE_ROOTED] = true,
        [MODIFIER_STATE_COMMAND_RESTRICTED] = false, -- 【新增】允许接收命令
    }
end

function modifier_ability_trigger_on_active:OnCreated(params)
    if not IsServer() then return end

    --print("[ability_trigger_on_active1332] OnCreated")

    self.caster = self:GetCaster()
    self.ability = self:GetAbility()
    self.target_point = Vector(params.target_x, params.target_y, params.target_z)
    self.auto_cast_interval = self.ability:GetSpecialValueFor("auto_cast_interval")
    --print("[ability_trigger_on_active1332] EXCLUDED_ABILITIES_ALLBUTTER")
    -- 【直接使用全局黑名单】
    self.no_support_abilities = EXCLUDED_ABILITIES_ALLBUTTER
    --print("[ability_trigger_on_active1332] EXCLUDED_ABILITIES_ALLBUTTER")

    -- 添加本技能自身到黑名单
    self.no_support_abilities[self.ability:GetName()] = true
    --print("[ability_trigger_on_active1332] self")
    self.no_support_items = EXCLUDED_ITEMS or {}
    --print("[ability_trigger_on_active1332] EXCLUDED_ITEMS")
    self.no_support_substrings = {
        "mango",
        "faerie_fire",
        "item_ward",
        "item_tango",
        "tome",
        "blink",
        "black_king_bar",
        "item_manta",
    }
    --print("[ability_trigger_on_active1332] no_support_substrings")

    --print("[ability_trigger_on_active1332] OnStartThink")
    -- 开始自动施法循环
    self:StartIntervalThink(self.auto_cast_interval)

    -- 特效
    self.particle = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_invoker/invoker_sun_strike_team.vpcf",
        PATTACH_ABSORIGIN,
        self.caster
    )
    ParticleManager:SetParticleControl(self.particle, 0, self.target_point)
end

function modifier_ability_trigger_on_active:OnDestroy()
    if not IsServer() then return end

    --print("[ability_trigger_on_active1332] OnDestroy")

    if self.particle then
        ParticleManager:DestroyParticle(self.particle, false)
        ParticleManager:ReleaseParticleIndex(self.particle)
    end

    StopSoundOn("Hero_Invoker.SunStrike.Ignite", self.caster)
end

function modifier_ability_trigger_on_active:OnIntervalThink()
    if not IsServer() then return end

    --print("[ability_trigger_on_active1332] OnIntervalThink")
    -- 自动施放所有可用技能
    self:AutoCastAbilities()
end

function modifier_ability_trigger_on_active:AutoCastAbilities()
    --print("[ability_trigger_on_active1332] AutoCastAbilities - Start")


    -- 【新增】先检查并释放大招
    for i = 0, self.caster:GetAbilityCount() - 1 do
        local ability = self.caster:GetAbilityByIndex(i)
        if ability and ability:GetAbilityType() == DOTA_ABILITY_TYPE_ULTIMATE then
            if self:CanCastAbility(ability) then
                --print("[ability_trigger_on_active1332] AutoCastAbilities - Casting ULTIMATE:", ability:GetName())
                self:TryCastAbility(ability)
            end
        end
    end
    -- 【新增】检查物品
    for i = 0, 8 do
        local item = self.caster:GetItemInSlot(i)
        if item and self:CanCastAbility(item) then
            --print("[ability_trigger_on_active1332] AutoCastAbilities - Casting item:", item:GetName())
            self:TryCastAbility(item)
        end
    end
    -- 然后释放其他技能
    for i = 0, self.caster:GetAbilityCount() - 1 do
        local ability = self.caster:GetAbilityByIndex(i)
        if ability and ability:GetAbilityType() ~= DOTA_ABILITY_TYPE_ULTIMATE then
            if self:CanCastAbility(ability) then
                --print("[ability_trigger_on_active1332] AutoCastAbilities - Casting:", ability:GetName())
                self:TryCastAbility(ability)
            end
        end
    end


    --print("[ability_trigger_on_active1332] AutoCastAbilities - End")
end

function modifier_ability_trigger_on_active:CanCastAbility(ability)
    local ability_name = ability:GetName()

    if not ability or ability:IsHidden() or ability:IsPassive() then
        return false
    end

    -- 【使用共享黑名单检查】
    if self.no_support_abilities[ability_name] then
        --print("[ability_trigger_on_active1332] CanCast:", ability_name, "- In blacklist")
        return false
    end
    -- 【新增】物品特殊检查:如果是对自己施法的物品,跳过
    if ability:IsItem() then
        -- 检查物品黑名单
        if self.no_support_items[ability_name] then
            return false
        end

        local behavior = ability:GetBehavior()
        local target_team = ability:GetAbilityTargetTeam()
        -- 【新增】点金手特殊处理
        if ability_name == "item_hand_of_midas" or
            ability_name == "item_hand_of_group" then
            return false
        end
        -- 如果物品只能对友方释放(包括自己),跳过
        if bit.band(target_team, DOTA_UNIT_TARGET_TEAM_FRIENDLY) ~= 0 and
            bit.band(target_team, DOTA_UNIT_TARGET_TEAM_ENEMY) == 0 then
            --print("[ability_trigger_on_active] CanCast:", ability_name, "- Item targets self/allies only, skipped")
            return false
        end

        -- 物品行为检查:只允许指向性单体或AOE点目标
        local is_unit_target = bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) == DOTA_ABILITY_BEHAVIOR_UNIT_TARGET
        local is_point = bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) == DOTA_ABILITY_BEHAVIOR_POINT
        local is_aoe = bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) == DOTA_ABILITY_BEHAVIOR_AOE

        if not (is_unit_target or (is_point and is_aoe)) then
            return false
        end
    end

    -- 检查子字符串
    for _, substring in ipairs(self.no_support_substrings) do
        if string.find(ability_name, substring) then
            --print("[ability_trigger_on_active1332] CanCast:", ability_name, "- Matches no_support_substring:", substring)
            return false
        end
    end

    -- 检查是否是持续施法技能
    if bit.band(ability:GetBehavior(), DOTA_ABILITY_BEHAVIOR_CHANNELLED) == DOTA_ABILITY_BEHAVIOR_CHANNELLED then
        --print("[ability_trigger_on_active1332] CanCast:", ability_name, "- Is channelled")
        return false
    end

    local behavior = ability:GetBehavior()
    local is_item = ability:IsItem()

    -- 【修改】物品检测:只允许指向性单体或AOE点目标物品
    if is_item then
        local is_unit_target = bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) == DOTA_ABILITY_BEHAVIOR_UNIT_TARGET
        local is_point = bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) == DOTA_ABILITY_BEHAVIOR_POINT
        local is_aoe = bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) == DOTA_ABILITY_BEHAVIOR_AOE

        -- 物品必须是指向性单体或指向性AOE点目标
        if not (is_unit_target or (is_point and is_aoe)) then
            --print("[ability_trigger_on_active1332] CanCast:", ability_name, "- Item behavior not supported")
            return false
        end
    end

    -- 检查是否可以施放
    if not ability:IsFullyCastable() then
        return false
    end

    -- 检查魔法值
    if self.caster:GetMana() < ability:GetManaCost(-1) then
        return false
    end

    --print("[ability_trigger_on_active1332] CanCast:", ability_name, "- PASSED")
    return true
end

-- 【新增】虚灵之刃专用施法函数
function modifier_ability_trigger_on_active:CastEtherealBladeOnEnemy(ability)
    local ability_name = ability:GetName()
    local search_range = self.ability:GetSpecialValueFor("search_radius")

    -- 强制搜索敌方英雄
    local heroes = FindUnitsInRadius(
        self.caster:GetTeamNumber(),
        self.target_point,
        nil,
        search_range,
        DOTA_UNIT_TARGET_TEAM_ENEMY, -- 强制敌方
        DOTA_UNIT_TARGET_HERO,
        DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS,
        FIND_CLOSEST,
        false
    )

    if #heroes > 0 then
        local target = heroes[1]
        --print("[ability_trigger_on_active] 虚灵之刃对敌方释放:", target:GetUnitName())

        ability:EndCooldown()
        self.caster:SetCursorCastTarget(target)
        local cast_success = self.caster:CastAbilityImmediately(ability, self.caster:GetPlayerOwnerID())

        if cast_success then
            self.caster:GiveMana(ability:GetManaCost(ability:GetLevel() - 1))
        end

        return cast_success
    else
        --print("[ability_trigger_on_active] 虚灵之刃:范围内无敌方英雄")
        return false
    end
end

function modifier_ability_trigger_on_active:TryCastAbility(ability)
    local behavior = ability:GetBehavior()
    local ability_name = ability:GetName()
    -- 【新增】虚灵之刃特殊处理
    if ability_name == "item_ethereal_blade" or
        ability_name == "item_ethereal_blade_2" or
        ability_name == "item_ethereal_blade_ultra" then
        --print("[ability_trigger_on_active1332] TryCast:", item_ethereal_blade_ultra)
        return self:CastEtherealBladeOnEnemy(ability)
    end
    --print("[ability_trigger_on_active1332] TryCast:", ability_name)

    -- 【移除延迟,直接施法】
    -- 重新获取技能属性
    local target_team = ability:GetAbilityTargetTeam()

    -- 智能目标选择
    local cast_target = nil
    local target_position = nil

    -- 友方技能 - 对自己释放
    if bit.band(target_team, DOTA_UNIT_TARGET_TEAM_FRIENDLY) ~= 0 then
        cast_target = self.caster
        target_position = self.caster:GetAbsOrigin()
        --print("[ability_trigger_on_active1332] 友方技能,目标: 自己")

        -- 敌方技能 - 搜索敌人
    elseif bit.band(target_team, DOTA_UNIT_TARGET_TEAM_ENEMY) ~= 0 then
        local search_range = self.ability:GetSpecialValueFor("search_radius")
        local enemies = FindUnitsInRadius(
            self.caster:GetTeamNumber(),
            self.target_point,
            nil,
            search_range,
            DOTA_UNIT_TARGET_TEAM_ENEMY,
            DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
            DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS,
            FIND_CLOSEST,
            false
        )

        if #enemies > 0 then
            cast_target = enemies[1]
            target_position = cast_target:GetAbsOrigin()
            --print("[ability_trigger_on_active1332] 敌方技能,目标:", cast_target:GetUnitName())
        elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 or
            bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) ~= 0 then
            target_position = self.target_point
            --print("[ability_trigger_on_active1332] 敌方技能,目标: 点位置")
        else
            --print("[ability_trigger_on_active1332] 敌方单体技能但无有效目标,跳过")
            return
        end
    else
        cast_target = self.caster
        target_position = self.target_point
        --print("[ability_trigger_on_active1332] 任意目标技能")
    end
    -- 卡尔天火特殊处理:强制使用双击版本(施法者位置)
    if ability_name == "invoker_sun_strike" then
        --print("[cast_trigger] 天火")
        target_position = nil
        cast_target = self.caster -- 清除单体目标,强制使用点目标模式
    end
    -- 【关键】在施法前才EndCooldown
    ability:EndCooldown()

    -- 施放技能
    local cast_success = false
    -- 根据技能行为类型施法
    if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_NO_TARGET) ~= 0 and
        bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) == 0 and
        bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) == 0 then
        --print("[ability_trigger_on_active1332] 施放无目标技能")
        cast_success = self.caster:CastAbilityNoTarget(ability, self.caster:GetPlayerOwnerID())
    elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) ~= 0 then
        if cast_target and not cast_target:IsNull() then
            --print("[ability_trigger_on_active1332] 施放单体技能,目标:", cast_target:GetUnitName())
            self.caster:SetCursorCastTarget(cast_target)
            cast_success = self.caster:CastAbilityImmediately(ability, self.caster:GetPlayerOwnerID())
        elseif target_position and bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 then
            --print("[ability_trigger_on_active1332] 施放点目标技能(备选)")
            self.caster:SetCursorPosition(target_position)
            cast_success = self.caster:CastAbilityImmediately(ability, self.caster:GetPlayerOwnerID())
        end
    elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 or
        bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) ~= 0 then
        if target_position then
            --print("[ability_trigger_on_active1332] 施放点目标/AOE技能")
            self.caster:SetCursorPosition(target_position)
            cast_success = self.caster:CastAbilityImmediately(ability, self.caster:GetPlayerOwnerID())
        else
            --print("[ability_trigger_on_active1332] 施放点目标/AOE技能到target")
            self.caster:SetCursorCastTarget(cast_target)
            cast_success = self.caster:CastAbilityImmediately(ability, self.caster:GetPlayerOwnerID())
        end
    end


    --print("[ability_trigger_on_active1332] 施放结果:", tostring(cast_success))

    if cast_success then
        -- 返还魔法
        self.caster:GiveMana(ability:GetManaCost(ability:GetLevel() - 1))
    end
end

function modifier_ability_trigger_on_active:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
        MODIFIER_PROPERTY_CASTTIME_PERCENTAGE,
        MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING, -- 【新增】施法距离加成
    }
end

function modifier_ability_trigger_on_active:GetModifierCastRangeBonusStacking()
    return self.ability:GetSpecialValueFor("bonus_cast_range") -- 【新增】返回施法距离加成
end

function modifier_ability_trigger_on_active:GetModifierPercentageCooldown()
    return self.ability:GetSpecialValueFor("cd_reduction_pct")
end

function modifier_ability_trigger_on_active:GetModifierPercentageCasttime()
    return self.ability:GetSpecialValueFor("cast_time_reduction_pct")
end

function modifier_ability_trigger_on_active:GetEffectName()
    return "particles/units/heroes/hero_invoker/invoker_wex_instance.vpcf"
end

function modifier_ability_trigger_on_active:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end
