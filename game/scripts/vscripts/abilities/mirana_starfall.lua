mirana_starfall = class({})

function mirana_starfall:OnSpellStart()
    local caster = self:GetCaster()
    local point = caster:GetAbsOrigin()

    -- 第一次星落(群体伤害)
    self:StarfallWave(point)

    -- 神杖升级:对最近的一个敌人造成单体星落伤害
    if caster:HasScepter() then
        local secondary_radius = self:GetSpecialValueFor("starfall_secondary_radius") or 425

        -- 查找范围内最近的一个敌人(包括英雄和小兵)
        local nearest_enemy = FindUnitsInRadius(
            caster:GetTeamNumber(),
            point,
            nil,
            secondary_radius,
            DOTA_UNIT_TARGET_TEAM_ENEMY,
            DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
            DOTA_UNIT_TARGET_FLAG_NONE,
            FIND_CLOSEST,
            false
        )

        -- 如果找到敌人,延迟0.5秒后对其造成单体伤害
        if #nearest_enemy > 0 then
            Timers:CreateTimer(0.5, function()
                self:StarfallSingleTarget(nearest_enemy[1])
            end)
        end
    end
end

-- 群体星落(第一次星落)
function mirana_starfall:StarfallWave(center_point)
    local caster = self:GetCaster()
    local radius = self:GetSpecialValueFor("starfall_radius")
    local base_damage = self:GetSpecialValueFor("damage")
    local attack_bonus_pct = self:GetSpecialValueFor("attack_damage_bonus_pct") / 100

    caster:EmitSound("Hero_Mirana.Starfall.Cast")

    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(),
        center_point,
        nil,
        radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_NONE,
        FIND_ANY_ORDER,
        false
    )

    for _, enemy in pairs(enemies) do
        local attack_damage = caster:GetAverageTrueAttackDamage(enemy)
        -- 总伤害 = 基础伤害 + (攻击力 × 天赋加成%)
        local total_damage = base_damage + (attack_damage * attack_bonus_pct)

        local particle = ParticleManager:CreateParticle(
            "particles/units/heroes/hero_mirana/mirana_starfall_attack.vpcf",
            PATTACH_ABSORIGIN_FOLLOW,
            enemy
        )
        ParticleManager:SetParticleControl(particle, 0, enemy:GetAbsOrigin())
        ParticleManager:SetParticleControl(particle, 1, enemy:GetAbsOrigin())
        ParticleManager:ReleaseParticleIndex(particle)

        local damageTable = {
            victim = enemy,
            attacker = caster,
            damage = total_damage,
            damage_type = DAMAGE_TYPE_MAGICAL,
            ability = self
        }
        ApplyDamage(damageTable)

        enemy:EmitSound("Hero_Mirana.Starfall.Attack")
    end
end

-- 单体星落(第二次星落,仅对一个目标)
function mirana_starfall:StarfallSingleTarget(target)
    if not target or target:IsNull() then return end

    local caster = self:GetCaster()
    local base_damage = self:GetSpecialValueFor("damage")
    local attack_bonus_pct = self:GetSpecialValueFor("attack_damage_bonus_pct") / 100

    caster:EmitSound("Hero_Mirana.Starfall.Cast")

    -- 计算伤害
    local attack_damage = caster:GetAverageTrueAttackDamage(target)
    local total_damage = base_damage + (attack_damage * attack_bonus_pct)

    -- 创建粒子特效
    local particle = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_mirana/mirana_starfall_attack.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        target
    )
    ParticleManager:SetParticleControl(particle, 0, target:GetAbsOrigin())
    ParticleManager:SetParticleControl(particle, 1, target:GetAbsOrigin())
    ParticleManager:ReleaseParticleIndex(particle)

    -- 只对这一个目标造成伤害
    local damageTable = {
        victim = target,
        attacker = caster,
        damage = total_damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = self
    }
    ApplyDamage(damageTable)

    target:EmitSound("Hero_Mirana.Starfall.Attack")
end
