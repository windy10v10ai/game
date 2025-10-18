if item_hawkeye_turret == nil then item_hawkeye_turret = class({}) end
LinkLuaModifier("modifier_item_hawkeye_turret_cooldown", "items/item_hawkeye_turret.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_hawkeye_turret", "items/item_hawkeye_turret.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_hawkeye_turret_stats", "items/item_hawkeye_turret.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_hawkeye_turret_active", "items/item_hawkeye_turret.lua", LUA_MODIFIER_MOTION_NONE)

function item_hawkeye_turret:GetIntrinsicModifierName()
    return "modifier_item_hawkeye_turret"
end

function item_hawkeye_turret:OnSpellStart()
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("active_duration")

    caster:EmitSound("DOTA_Item.MoonShard.Consume")
    caster:AddNewModifier(caster, self, "modifier_item_hawkeye_turret_active", {duration = duration})
end

-- 被动效果modifier
if modifier_item_hawkeye_turret == nil then modifier_item_hawkeye_turret = class({}) end

function modifier_item_hawkeye_turret:IsHidden() return true end
function modifier_item_hawkeye_turret:IsPurgable() return false end
function modifier_item_hawkeye_turret:RemoveOnDeath() return false end
function modifier_item_hawkeye_turret:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_hawkeye_turret:OnCreated()
    self.stats_modifier_name = "modifier_item_hawkeye_turret_stats"

    local ability = self:GetAbility()
    if ability then
        self.attack_radius = ability:GetSpecialValueFor("attack_radius") or 400
        self.attack_percent = ability:GetSpecialValueFor("attack_percent") or 60
        self.internal_cooldown = ability:GetSpecialValueFor("internal_cooldown") or 0.05
    else
        -- 设置默认值
        self.attack_radius = 400
        self.attack_percent = 60
        self.internal_cooldown = 0.05
    end

    if IsServer() then
        if not self:GetAbility() then self:Destroy() end
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_hawkeye_turret:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_hawkeye_turret:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
        MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
        MODIFIER_PROPERTY_PROCATTACK_FEEDBACK,  -- 添加这个
    }
end

function modifier_item_hawkeye_turret:GetModifierProcAttack_Feedback(keys)
    if not IsServer() then return end
    if not keys.attacker:IsRealHero() or not keys.attacker:IsRangedAttacker() then return end

    -- 检查内置冷却
    if keys.attacker:HasModifier("modifier_item_hawkeye_turret_cooldown") then return end
    -- 防止与其他霰弹枪叠加
    if keys.attacker:HasModifier("modifier_item_shotgun_cooldown") then return end
    if keys.attacker:HasModifier("modifier_item_shotgun_v2_cooldown") then return end

    if keys.attacker:GetTeam() == keys.target:GetTeam() then return end
    if keys.target:IsBuilding() then return end


    local ability = self:GetAbility()
    local target_loc = keys.target:GetAbsOrigin()
    local actual_damage = CalculateActualDamage(keys.damage, keys.target)
    local damage = actual_damage * (self.attack_percent or 100) / 100

    -- 溅射特效
    local blast_pfx = ParticleManager:CreateParticle("particles/custom/shrapnel.vpcf", PATTACH_CUSTOMORIGIN, nil)
    ParticleManager:SetParticleControl(blast_pfx, 0, target_loc)
    ParticleManager:ReleaseParticleIndex(blast_pfx)

    -- 查找范围内的敌人
    local enemies = FindUnitsInRadius(
        keys.attacker:GetTeamNumber(),
        target_loc,
        nil,
        self.attack_radius or 400,
        DOTA_UNIT_TARGET_TEAM_ENEMY,  -- 直接使用常量
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,  -- 直接使用常量
        DOTA_UNIT_TARGET_FLAG_NONE,
        FIND_ANY_ORDER,
        false
    )

    for _, enemy in pairs(enemies) do
        if enemy ~= keys.target then
            ApplyDamage({
                victim       = enemy,
                attacker     = keys.attacker,
                damage       = damage,
                damage_type  = DAMAGE_TYPE_PURE,  -- 纯粹伤害
                damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
                ability      = ability,
            })
        end
    end

    -- 添加内置冷却
    keys.attacker:AddNewModifier(keys.attacker, ability, "modifier_item_hawkeye_turret_cooldown",
        { duration = self.internal_cooldown or 0.5 })
end



function modifier_item_hawkeye_turret:GetModifierPreAttack_BonusDamage()
    return self:GetAbility():GetSpecialValueFor("bonus_damage")
end

function modifier_item_hawkeye_turret:GetModifierAttackSpeedBonus_Constant()
    return self:GetAbility():GetSpecialValueFor("bonus_attack_speed")
end

function modifier_item_hawkeye_turret:GetModifierPhysicalArmorBonus()
    return self:GetAbility():GetSpecialValueFor("bonus_armor")
end

function modifier_item_hawkeye_turret:GetModifierAttackRangeBonus()
    return self:GetAbility():GetSpecialValueFor("bonus_attack_range")
end
-- 内置冷却modifier
if modifier_item_hawkeye_turret_cooldown == nil then modifier_item_hawkeye_turret_cooldown = class({}) end

function modifier_item_hawkeye_turret_cooldown:IsDebuff() return false end
function modifier_item_hawkeye_turret_cooldown:IsHidden() return true end
function modifier_item_hawkeye_turret_cooldown:IsPurgable() return false end
function modifier_item_hawkeye_turret_cooldown:RemoveOnDeath() return true end
-- 主动效果modifier
if modifier_item_hawkeye_turret_active == nil then modifier_item_hawkeye_turret_active = class({}) end

function modifier_item_hawkeye_turret_active:IsHidden() return false end
function modifier_item_hawkeye_turret_active:IsPurgable() return false end

function modifier_item_hawkeye_turret_active:OnCreated()
    local parent = self:GetParent()
    local ability = self:GetAbility()
    -- 读取 BAT 减少百分比参数
    if ability then
        self.bat_reduction_pct = ability:GetSpecialValueFor("bat_reduction_pct") or 20
    else
        self.bat_reduction_pct = 20
    end
    if IsServer() then
        -- 获取英雄自身的夜间视野范围
        self.vision_radius = parent:GetNightTimeVisionRange()

        -- 计算吃掉的银月数量
        self.moon_shard_count = self.vision_radius / 200

        -- 创建高空视野
        self.fow_viewer = AddFOWViewer(
            parent:GetTeamNumber(),
            parent:GetAbsOrigin(),
            self.vision_radius,
            ability:GetSpecialValueFor("active_duration"),
            false
        )


        -- 播放特效
        self.particle = ParticleManager:CreateParticle(
            "particles/econ/events/ti10/phase_boots_ti10.vpcf",
            PATTACH_ABSORIGIN_FOLLOW,
            parent
        )

        -- 启用数据传输到客户端
        self:SetHasCustomTransmitterData(true)
    end
end

-- 添加数据传输函数
function modifier_item_hawkeye_turret_active:AddCustomTransmitterData()
    return {
        moon_shard_count = self.moon_shard_count
    }
end

function modifier_item_hawkeye_turret_active:HandleCustomTransmitterData(data)
    self.moon_shard_count = data.moon_shard_count
end
function modifier_item_hawkeye_turret_active:OnDestroy()
    if not IsServer() then return end

    -- 清理视野
    if self.fow_viewer then
        RemoveFOWViewer(self:GetParent():GetTeamNumber(), self.fow_viewer)
        self.fow_viewer = nil
    end

    if self.particle then
        ParticleManager:DestroyParticle(self.particle, false)
        ParticleManager:ReleaseParticleIndex(self.particle)
    end
end

function modifier_item_hawkeye_turret_active:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
        MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
        MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT,  -- 使用百分比减少
    }
end

function modifier_item_hawkeye_turret_active:CheckState()
    return {
        [MODIFIER_STATE_ROOTED] = true,
        [MODIFIER_STATE_FLYING_FOR_PATHING_PURPOSES_ONLY] = true,
    }
end



function modifier_item_hawkeye_turret_active:GetModifierBaseAttackTimeConstant()
    if self.bat_check ~= true then
        self.bat_check = true
        local parent = self:GetParent()
        local current_bat = parent:GetBaseAttackTime()

        -- 手动计算百分比减少
        local bat_reduction_pct = self.bat_reduction_pct or 20
        local new_bat = current_bat * (1 - bat_reduction_pct / 100)

        self.bat_check = false
        return new_bat
    end
end
function modifier_item_hawkeye_turret_active:GetModifierMoveSpeed_Absolute()
    return 0
end

function modifier_item_hawkeye_turret_active:GetModifierPhysicalArmorBonus()
    return self:GetAbility():GetSpecialValueFor("active_armor")
end

function modifier_item_hawkeye_turret_active:GetModifierAttackRangeBonus()
    local base_range = self:GetAbility():GetSpecialValueFor("active_attack_range")
    local moon_bonus = self:GetAbility():GetSpecialValueFor("moon_shard_bonus")
    return base_range + (self.moon_shard_count or 0) * moon_bonus
end


function modifier_item_hawkeye_turret_active:GetModifierProvidesFOWVision()
    return 1
end

function modifier_item_hawkeye_turret_active:GetEffectName()
    return "particles/econ/events/ti10/phase_boots_ti10.vpcf"
end

function modifier_item_hawkeye_turret_active:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end

-- Stats modifier定义
if modifier_item_hawkeye_turret_stats == nil then modifier_item_hawkeye_turret_stats = class({}) end

function modifier_item_hawkeye_turret_stats:IsHidden() return true end
function modifier_item_hawkeye_turret_stats:IsPurgable() return false end
function modifier_item_hawkeye_turret_stats:RemoveOnDeath() return false end
function modifier_item_hawkeye_turret_stats:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end
-- 在 modifier_item_hawkeye_turret_active 中
function modifier_item_hawkeye_turret_active:GetPriority()
    return MODIFIER_PRIORITY_LOW
end
