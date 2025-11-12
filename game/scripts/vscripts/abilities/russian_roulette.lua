russian_roulette = class({})
LinkLuaModifier("modifier_russian_roulette", "abilities/russian_roulette", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_russian_roulette_root", "abilities/russian_roulette", LUA_MODIFIER_MOTION_NONE)

function russian_roulette:OnSpellStart()
    local caster = self:GetCaster()
    local target = self:GetCursorTarget()

    if not target or target:IsNull() then return end

    -- 播放强攻音效
    EmitSoundOn("Hero_LegionCommander.PressTheAttack", caster)

    -- 获取技能等级和伤害顺序
    local level = self:GetLevel()
    local is_enemy = caster:GetTeamNumber() ~= target:GetTeamNumber()

    -- 计算等级差并限制技能等级上限
    local caster_level = caster:GetLevel()
    local target_level = target:GetLevel()
    local level_diff = target_level - caster_level

    local effective_level = level
    if is_enemy and level_diff > 0 then
        if level_diff >= 15 then
            effective_level = math.min(level, 2)
        elseif level_diff >= 10 then
            effective_level = math.min(level, 3)
        elseif level_diff >= 5 then
            effective_level = math.min(level, 4)
        elseif level_diff <= -10 then
            effective_level = 6
        end
    end

    -- 添加modifier
    local caster_mod = caster:AddNewModifier(caster, self, "modifier_russian_roulette_root", {})
    if caster_mod then
        if not is_enemy then
            caster_mod:SetStackCount(2)
        else
            caster_mod:SetStackCount(effective_level)
        end
    end

    local target_mod = target:AddNewModifier(caster, self, "modifier_russian_roulette_root", {})
    if target_mod then
        if not is_enemy then
            target_mod:SetStackCount(2)
        else
            target_mod:SetStackCount(effective_level)
        end
    end

    local damage_sequence = self:GetDamageSequence(effective_level, is_enemy)
    local fatal_shot = math.random(1, 6)

    -- 创建独立的上下文对象,而不是存储在self上
    local context = {
        ability = self,
        target = target,
        caster = caster,
        damage_sequence = damage_sequence,
        fatal_shot = fatal_shot,
        current_shot = 0,
        is_active = true,
        caster_modifier = caster_mod,
        target_modifier = target_mod,
        current_target_particle = nil
    }
    -- 安全地获取英雄名称
    local caster_player = caster:GetPlayerOwner()
    local target_player = target:GetPlayerOwner()

    -- 获取本地化的英雄名称
    local caster_name = caster_player and caster:GetName()
    local target_name = target_player and target:GetName()
    local HeroName = string.gsub(target_name, "npc_dota_hero_", "")
    -- if is_enemy then
    --     GameRules:SendCustomMessage(
    --         "有乐子看了， " .. caster_name .. " 要跟敌人 " .. HeroName .. " 赌命!", 0, 0)
    -- else
    --     GameRules:SendCustomMessage(
    --         "有乐子看了， " .. caster_name .. " 要跟队友 " .. HeroName .. " 赌命!", 0, 0)
    -- end
    -- 使用 Say 让施法者说话
    local message = HeroName .. "，我要跟你赌命!"
    Say(caster, message, false)
    self:StartRoulette(context)
end

function russian_roulette:GetDamageSequence(level, is_enemy)
    if not is_enemy then
        return { 1, 0, 1, 0, 1, 0 }
    end

    local sequences = {
        { 1, 0, 0, 1, 0, 0 },
        { 1, 0, 1, 0, 1, 0 },
        { 1, 1, 0, 1, 0, 1 },
        { 1, 1, 1, 0, 1, 0 },
        { 1, 1, 1, 1, 0, 1 },
        { 1, 1, 1, 1, 1, 0 },
    }
    return sequences[level] or sequences[1]
end

function russian_roulette:StartRoulette(context)
    local interval = self:GetSpecialValueFor("interval")

    Timers:CreateTimer(interval, function()
        if not context.is_active then return nil end
        if GameRules:IsGamePaused() then return 0.03 end

        context.current_shot = context.current_shot + 1

        -- 检查是否结束
        if context.current_shot > 6 or not context.caster:IsAlive() or not context.target:IsAlive() then
            context.is_active = false
            -- 清理特效
            if context.current_target_particle then
                ParticleManager:DestroyParticle(context.current_target_particle, false)
                ParticleManager:ReleaseParticleIndex(context.current_target_particle)
            end
            -- 移除禁锢效果
            if context.caster_modifier and not context.caster_modifier:IsNull() then
                context.caster_modifier:Destroy()
            end
            if context.target_modifier and not context.target_modifier:IsNull() then
                context.target_modifier:Destroy()
            end
            return nil
        end

        -- 确定当前目标
        local current_target = context.damage_sequence[context.current_shot] == 1 and context.target or context.caster

        -- 清理上一个目标的特效
        if context.current_target_particle then
            ParticleManager:DestroyParticle(context.current_target_particle, false)
            ParticleManager:ReleaseParticleIndex(context.current_target_particle)
        end

        -- 显示瞄准特效
        context.current_target_particle = ParticleManager:CreateParticleForTeam(
            "particles/econ/items/sniper/sniper_charlie/sniper_crosshair_charlie.vpcf",
            PATTACH_OVERHEAD_FOLLOW,
            current_target,
            context.caster:GetTeamNumber()
        )

        -- 环绕光环特效
        local aura_particle = ParticleManager:CreateParticle(
            "particles/units/heroes/hero_templar_assassin/templar_assassin_refraction.vpcf",
            PATTACH_OVERHEAD_FOLLOW,
            current_target
        )

        EmitSoundOn("Ability.AssassinateLoad", context.caster)

        local is_fatal = (context.current_shot == context.fatal_shot)

        -- 延迟0.5秒后触发伤害
        Timers:CreateTimer(0.5, function()
            if not context.is_active then return nil end
            if GameRules:IsGamePaused() then return 0.03 end

            if is_fatal then
                self:DealFatalDamage(current_target, context)
            else
                self:DealNormalDamage(current_target, context)
            end

            -- 清理光环特效
            Timers:CreateTimer(0.5, function()
                ParticleManager:DestroyParticle(aura_particle, false)
                ParticleManager:ReleaseParticleIndex(aura_particle)
            end)

            -- 检查目标是否死亡
            if not current_target:IsAlive() then
                context.is_active = false

                -- 清理特效
                if context.current_target_particle then
                    ParticleManager:DestroyParticle(context.current_target_particle, false)
                    ParticleManager:ReleaseParticleIndex(context.current_target_particle)
                end
                -- 移除禁锢效果
                if context.caster_modifier and not context.caster_modifier:IsNull() then
                    context.caster_modifier:Destroy()
                end
                if context.target_modifier and not context.target_modifier:IsNull() then
                    context.target_modifier:Destroy()
                end

                -- 如果敌人被赌死,重置CD
                if current_target == context.target then
                    self:EndCooldown()
                end
            end
        end)
        return interval
    end)
end

function russian_roulette:DealFatalDamage(target, context)
    EmitSoundOn("Ability.Assassinate", context.caster)
    EmitSoundOn("Hero_Sniper.AssassinateDamage", target)

    local particle = ParticleManager:CreateParticle(
        "particles/items3_fx/blink_overwhelming_burst.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        target
    )
    ParticleManager:SetParticleControl(particle, 0, target:GetAbsOrigin())
    ParticleManager:SetParticleControl(particle, 1, Vector(200, 200, 200))

    Timers:CreateTimer(2.0, function()
        ParticleManager:DestroyParticle(particle, false)
        ParticleManager:ReleaseParticleIndex(particle)
    end)

    local killer = (target == context.caster) and context.target or context.caster
    target:Kill(self, killer)
end

function russian_roulette:DealNormalDamage(target, context)
    EmitSoundOn("Hero_Sniper.PreAttack", context.caster)
    EmitSoundOn("Hero_Sniper.Attack", context.caster)
end

-- modifier代码保持不变
modifier_russian_roulette = class({})
function modifier_russian_roulette:IsHidden() return true end

function modifier_russian_roulette:IsPurgable() return false end

modifier_russian_roulette_root = class({})
function modifier_russian_roulette_root:IsHidden() return false end

function modifier_russian_roulette_root:IsPurgable() return false end

function modifier_russian_roulette_root:IsDebuff() return true end

function modifier_russian_roulette_root:CheckState()
    return {
        [MODIFIER_STATE_ROOTED] = true,
        [MODIFIER_STATE_DISARMED] = true,
        [MODIFIER_STATE_MUTED] = true,
    }
end

function modifier_russian_roulette_root:GetTexture()
    return "russian_roulette"
end

function modifier_russian_roulette_root:OnCreated(params)
    if self:GetStackCount() > 0 then
        self.effective_level = self:GetStackCount()
    else
        self.effective_level = 1
    end
end

function modifier_russian_roulette_root:OnRefresh(params)
    if self:GetStackCount() > 0 then
        self.effective_level = self:GetStackCount()
    else
        self.effective_level = 1
    end
end

function modifier_russian_roulette_root:OnTooltip()
    return self.effective_level or 1
end

function modifier_russian_roulette_root:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_TOOLTIP
    }
end
