mirana_arrow = class({})
    -- 当前仍存在的问题：未动态检测，而是仅接近第一个目标，即以第一个目标为圆心放星落；未实现三根箭；
function mirana_arrow:OnSpellStart()
    local caster = self:GetCaster()
    local point = self:GetCursorPosition()

    caster:EmitSound("Hero_Mirana.ArrowCast")

    -- 初始化标记,记录是否已经释放过飞行中的群体星落
    self.has_cast_flight_starfall = false

    local info = {
        Ability = self,
        EffectName = "particles/units/heroes/hero_mirana/mirana_spell_arrow.vpcf",
        vSpawnOrigin = caster:GetAbsOrigin(),
        fDistance = self:GetSpecialValueFor("arrow_range"),
        fStartRadius = self:GetSpecialValueFor("arrow_width"),
        fEndRadius = self:GetSpecialValueFor("arrow_width"),
        Source = caster,
        bHasFrontalCone = false,
        bReplaceExisting = false,
        iUnitTargetTeam = DOTA_UNIT_TARGET_TEAM_ENEMY,
        iUnitTargetFlags = DOTA_UNIT_TARGET_FLAG_NONE,
        iUnitTargetType = DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        fExpireTime = GameRules:GetGameTime() + 10.0,
        bDeleteOnHit = true,
        vVelocity = (point - caster:GetAbsOrigin()):Normalized() * self:GetSpecialValueFor("arrow_speed"),
        bProvidesVision = true,
        iVisionRadius = 400,
        iVisionTeamNumber = caster:GetTeamNumber()
    }
    self.projectile = ProjectileManager:CreateLinearProjectile(info)
end

function mirana_arrow:OnProjectileThink(location)
    if not IsServer() then return end
    if not self:GetCaster():HasScepter() then return end
    if self.has_cast_flight_starfall then return end  -- 已经释放过,不再重复

    local caster = self:GetCaster()
    local starfall = caster:FindAbilityByName("mirana_starfall")
    if not starfall then return end

    local search_radius = starfall:GetSpecialValueFor("starfall_secondary_radius") or 425

    -- 查找箭矢附近的敌人
    local nearby_enemies = FindUnitsInRadius(
        caster:GetTeamNumber(),
        location,
        nil,
        search_radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_NONE,
        FIND_ANY_ORDER,
        false
    )

    -- 如果检测到敌人,释放一次群体星落
    if #nearby_enemies > 0 then
        self.has_cast_flight_starfall = true
        -- 在第一个检测到的敌人位置释放群体星落
        self:CastGroupStarfall(nearby_enemies[1]:GetAbsOrigin())
    end
end

function mirana_arrow:OnProjectileHit(target, location)
    local caster = self:GetCaster()

    if target then
        -- 获取基础伤害
        local base_damage = self:GetSpecialValueFor("arrow_damage")
        local total_damage = base_damage

        -- 应用箭的伤害
        local damageTable = {
            victim = target,
            attacker = caster,
            damage = total_damage,
            damage_type = DAMAGE_TYPE_MAGICAL,
            ability = self
        }
        ApplyDamage(damageTable)

        target:EmitSound("Hero_Mirana.ArrowImpact")

        -- 眩晕效果
        local stun_duration = self:GetSpecialValueFor("arrow_max_stun")
        target:AddNewModifier(caster, self, "modifier_stunned", {duration = stun_duration})

        -- 神杖升级:在击中的单位位置释放单体星落
        if caster:HasScepter() then
            Timers:CreateTimer(0.5, function()
                self:CastSingleStarfall(target)
            end)
        end

        return true
    end
end

-- 群体星落(飞行过程中触发)
function mirana_arrow:CastGroupStarfall(center_point)
    local caster = self:GetCaster()
    local starfall = caster:FindAbilityByName("mirana_starfall")
    if not starfall then return end

    local radius = starfall:GetSpecialValueFor("starfall_radius")
    local base_damage = starfall:GetSpecialValueFor("damage")
    local attack_bonus_pct = starfall:GetSpecialValueFor("attack_damage_bonus_pct") / 100

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
        -- 伤害 = 基础伤害 + (攻击力 × (1 + 天赋%))
        local total_damage = base_damage + (attack_damage * (attack_bonus_pct))

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

-- 单体星落(击中目标时触发)
function mirana_arrow:CastSingleStarfall(target)
    if not target or target:IsNull() then return end

    local caster = self:GetCaster()
    local starfall = caster:FindAbilityByName("mirana_starfall")
    if not starfall then return end

    local base_damage = starfall:GetSpecialValueFor("damage")
    local attack_bonus_pct = starfall:GetSpecialValueFor("attack_damage_bonus_pct") / 100

    caster:EmitSound("Hero_Mirana.Starfall.Cast")

    local attack_damage = caster:GetAverageTrueAttackDamage(target)
    -- 伤害 = 基础伤害 + (攻击力 × (1 + 天赋%))
    local total_damage = base_damage + (attack_damage * ( attack_bonus_pct))

    local particle = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_mirana/mirana_starfall_attack.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        target
    )
    ParticleManager:SetParticleControl(particle, 0, target:GetAbsOrigin())
    ParticleManager:SetParticleControl(particle, 1, target:GetAbsOrigin())
    ParticleManager:ReleaseParticleIndex(particle)

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
