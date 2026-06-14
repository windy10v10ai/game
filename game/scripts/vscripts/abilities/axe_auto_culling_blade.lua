LinkLuaModifier("modifier_axe_auto_culling_blade_passive", "abilities/axe_auto_culling_blade", LUA_MODIFIER_MOTION_NONE)

axe_auto_culling_blade = axe_auto_culling_blade or class({})
modifier_axe_auto_culling_blade_passive = modifier_axe_auto_culling_blade_passive or class({})

function axe_auto_culling_blade:GetIntrinsicModifierName()
    return "modifier_axe_auto_culling_blade_passive"
end

-- 查找范围内第一个血量低于斩杀阈值的敌方英雄，无则返回 nil
function axe_auto_culling_blade:FindCullableEnemy()
    local caster = self:GetCaster()
    local culling_blade = caster:FindAbilityByName("axe_culling_blade")
    if not culling_blade then return nil end

    local enemies = FindUnitsInRadius(
        caster:GetTeam(),
        caster:GetOrigin(),
        nil,
        GetFullCastRange(caster, culling_blade),
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES +
        DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE +
        DOTA_UNIT_TARGET_FLAG_NO_INVIS,
        FIND_ANY_ORDER,
        false
    )
    if #enemies == 0 then return nil end

    -- 斩杀线即原版淘汰之刃固定阈值，吃技能增强；不再叠加收获护甲
    local threshold = culling_blade:GetSpecialValueFor("damage") * (1 + caster:GetSpellAmplification(false))
    for _, enemy in pairs(enemies) do
        if enemy and not enemy:IsNull() and enemy:IsAlive() and enemy:GetHealth() <= threshold then
            return enemy
        end
    end
    return nil
end

-- 常驻被动：开启自动施法、淘汰之刃可施放时，检测到可斩英雄即施放原版淘汰之刃
modifier_axe_auto_culling_blade_passive = class({})

function modifier_axe_auto_culling_blade_passive:IsHidden() return true end

function modifier_axe_auto_culling_blade_passive:IsPurgable() return false end

function modifier_axe_auto_culling_blade_passive:RemoveOnDeath() return false end

function modifier_axe_auto_culling_blade_passive:OnCreated()
    if not IsServer() then return end
    self:StartIntervalThink(0.3)
end

function modifier_axe_auto_culling_blade_passive:OnIntervalThink()
    if not IsServer() then return end
    local ability = self:GetAbility()
    local caster = self:GetCaster()
    if not ability:GetAutoCastState() then return end

    -- 大招冷却就绪且蓝量足够才自动斩，不再开窗口/不再强制重置CD
    local culling_blade = caster:FindAbilityByName("axe_culling_blade")
    if not culling_blade or not culling_blade:IsFullyCastable() then return end

    local enemy = ability:FindCullableEnemy()
    if not enemy then return end

    caster:SetCursorCastTarget(enemy)
    caster:CastAbilityImmediately(culling_blade, caster:GetPlayerOwnerID())
    caster:SetCursorCastTarget(nil)
end
