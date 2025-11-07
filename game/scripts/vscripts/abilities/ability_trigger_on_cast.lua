-- 引入共享黑名单
require("abilities/ability_blacklist_butterfly")

ability_trigger_on_cast = class({})

LinkLuaModifier("modifier_trigger_on_cast", "abilities/ability_trigger_on_cast", LUA_MODIFIER_MOTION_NONE)

-- 定义需要排除的技能黑名单
-- 这些技能不会触发蝴蝶效应，避免游戏机制冲突或性能问题
local EXCLUDED_IN_ABILITIES = {
    -- 切换类技能/法球技能
    -- 原因：这些是攻击修改器，会与普通攻击冲突
    -- ========================================
    ["winter_wyvern_arctic_burn"] = true,         -- 寒冬飞龙 极寒之触
    ["medusa_split_shot"] = true,                 -- 美杜莎 分裂箭
    ["drow_ranger_frost_arrows"] = true,          -- 卓尔游侠 冰霜之箭
    ["clinkz_searing_arrows"] = true,             -- 火枪手 灼热之箭
    ["obsidian_destroyer_arcane_orb"] = true,     -- 殁境神蚀者 奥术天球
    ["enchantress_impetus"] = true,               -- 魅惑魔女 推进
    ["huskar_burning_spear"] = true,              -- 哈斯卡 燃烧之矛
    ["jakiro_liquid_fire"] = true,                -- 双头龙 液态火焰
    ["rubick_null_field"] = true,                 -- 拉比克 失效力场
    ["jakiro_liquid_frost"] = true,               -- 双头龙 液态冰霜
    ["silencer_glaives_of_wisdom"] = true,        -- 沉默术士 智慧之刃
    ["viper_poison_attack"] = true,               -- 冥界亚龙 毒性攻击
    ["witch_doctor_voodoo_restoration"] = true,   -- 巫医 巫毒恢复
    ["bloodseeker_blood_mist2"] = true,           -- 血魔 血雾（自定义版本）
    ["brewmaster_drunken_boxing"] = true,         -- 酒仙 醉拳    ["morphling_morph_agi"] = true,        -- 水人 变体（敏捷）
    ["morphling_morph_str"] = true,               -- 水人 变体（力量）
    ["kez_switch_weapons"] = true,                -- Kez 切换武器
    ["ancient_apparition_chilling_touch"] = true, -- 冰魂 - 极寒之触  ["winter_wyvern_arctic_burn"] = true,       -- 寒冬飞龙 - 极寒之触 [1](#38-0)
    ["morphling_morph_agi"] = true,               -- 水人 - 变体(敏捷)
    ["invoker_invoke"] = true,                    -- 卡尔 法术融合
    ["invoker_quas"] = true,                      -- 卡尔 (冰)
    ["invoker_wex"] = true,                       -- 卡尔 (雷)
    ["invoker_exort"] = true,                     -- 卡尔 (火)
    ["zuus_lightning_hands"] = true,              --霹雳之手
}

function ability_trigger_on_cast:GetIntrinsicModifierName()
    return "modifier_trigger_on_cast"
end

modifier_trigger_on_cast = class({})

function modifier_trigger_on_cast:IsHidden()
    return true
end

function modifier_trigger_on_cast:IsPermanent()
    return true
end

function modifier_trigger_on_cast:RemoveOnDeath()
    return false
end

function modifier_trigger_on_cast:IsPurgable()
    return false
end

function modifier_trigger_on_cast:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_ABILITY_EXECUTED
    }
end

function modifier_trigger_on_cast:OnAbilityExecuted(params)
    if not IsServer() then return end

    local caster = params.unit
    local parent = self:GetParent()
    local executed_ability = params.ability

    if caster ~= parent then return end
    if parent:IsIllusion() then return end

    -- ✅ 全局冷却
    if self.global_cooldown then return end
    -- ✅ 新增：如果技能正在多重施法中，不触发蝴蝶效应
    if executed_ability.multicast and executed_ability.multicast > 1 then
        return
    end
    if executed_ability:IsItem() then return end
    if executed_ability:IsPassive() then return end
    if EXCLUDED_IN_ABILITIES[executed_ability:GetAbilityName()] then
        return
    end
    -- ✅ 设置全局冷却
    self.global_cooldown = true
    Timers:CreateTimer(0.5, function()
        self.global_cooldown = nil
    end)
    --print("[trigger]", executed_ability:GetAbilityName())
    -- 检查是否为持续施法技能
    local behavior = executed_ability:GetBehavior()
    local is_channeled = bit.band(behavior, DOTA_ABILITY_BEHAVIOR_CHANNELLED) ~= 0

    local delay = 0.2 -- 默认延迟

    if is_channeled then
        -- 如果是持续施法，等待其完成
        delay = executed_ability:GetChannelTime() + 0.2
    end

    -- 延迟触发随机技能
    Timers:CreateTimer(delay, function()
        -- 检查施法者是否还在持续施法（可能被打断）
        if caster:IsChanneling() then
            return -- 如果还在持续施法，不触发
        end

        -- 原有的触发逻辑
        self:TriggerRandomAbility(params)
    end)
end

-- 将原有的触发逻辑提取到单独的函数
function modifier_trigger_on_cast:TriggerRandomAbility(params)
    local caster = params.unit
    local parent = self:GetParent()
    local executed_ability = params.ability

    -- ✅ 标记原始技能，防止多重施法触发
    if executed_ability then
        executed_ability.butterfly_triggered = true
    end
    if not self.trigger_depth then
        self.trigger_depth = 0
    end

    if self.trigger_depth >= 8 then
        return
    end

    local passive_level = self:GetAbility():GetLevel()
    if passive_level <= 0 then passive_level = 1 end

    local basic_trigger_chance = self:GetAbility():GetLevelSpecialValueFor("basic_trigger_chance", passive_level - 1)
    local ultimate_trigger_chance = self:GetAbility():GetLevelSpecialValueFor("ultimate_trigger_chance",
        passive_level - 1)

    local trigger_ultimate = RollPseudoRandomPercentage(ultimate_trigger_chance, DOTA_PSEUDO_RANDOM_CUSTOM_GAME_3, parent)
    local trigger_basic = RollPseudoRandomPercentage(basic_trigger_chance, DOTA_PSEUDO_RANDOM_CUSTOM_GAME_4, parent)

    if not trigger_ultimate and not trigger_basic then
        return
    end

    self.trigger_depth = self.trigger_depth + 1

    local ultimate_abilities = {}
    local basic_abilities = {}

    for i = 0, caster:GetAbilityCount() - 1 do
        local ability = caster:GetAbilityByIndex(i)
        if ability and ability:GetLevel() > 0
            and not ability:IsPassive()
            and ability ~= self:GetAbility()
            and not ability:IsItem()
            and not EXCLUDED_ABILITIES_ALLBUTTER[ability:GetAbilityName()] then
            local ability_type = ability:GetAbilityType()
            if ability_type == ABILITY_TYPE_ULTIMATE then
                table.insert(ultimate_abilities, ability)
            else
                table.insert(basic_abilities, ability)
            end
        end
    end

    local random_ability = nil
    if trigger_ultimate and #ultimate_abilities > 0 then
        random_ability = ultimate_abilities[RandomInt(1, #ultimate_abilities)]
        -- -- ✅ 新增: 特定英雄大招的1/3概率检查 ----改回来
        -- local ability_name = random_ability:GetAbilityName()
        -- if ability_name == "zuus_thundergods_wrath" or
        --     ability_name == "silencer_global_silence" or
        --     ability_name == "furion_wrath_of_nature" then
        --     local random_num = RandomInt(1, 2)
        --     if random_num ~= 1 then
        --         -- 未随到1,改为选择普通技能
        --         random_ability = nil
        --         if #basic_abilities > 0 then
        --             random_ability = basic_abilities[RandomInt(1, #basic_abilities)]
        --         end
        --     end
        -- end
    elseif trigger_basic and #basic_abilities > 0 then
        random_ability = basic_abilities[RandomInt(1, #basic_abilities)]
    end

    if not random_ability then
        self.trigger_depth = self.trigger_depth - 1
        return
    end

    --print("[cast_trigger] 选中技能: " .. random_ability:GetAbilityName())

    local remaining_cooldown = random_ability:GetCooldownTimeRemaining() or 0
    local has_charges = random_ability:GetMaxAbilityCharges(random_ability:GetLevel()) > 0
    local current_charges = 0
    local was_ready = (remaining_cooldown <= 0) -- ✅ 新增:记录技能是否原本冷却好
    if has_charges then
        current_charges = random_ability:GetCurrentAbilityCharges()
    end

    -- ✅ 修复: 改进原始目标信息的保存
    local original_target = params.target
    local original_position = nil

    -- 尝试从原始技能获取位置
    if params.ability then
        local ability_behavior = params.ability:GetBehavior()
        if bit.band(ability_behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 or
            bit.band(ability_behavior, DOTA_ABILITY_BEHAVIOR_AOE) ~= 0 then
            original_position = params.ability:GetCursorPosition()
        end
    end

    -- ✅ 新增: 如果没有获取到有效位置,重试
    if not original_position or original_position == Vector(0, 0, 0) then
        -- 尝试从玩家获取鼠标位置
        local player_id = caster:GetPlayerOwnerID()
        if player_id and player_id >= 0 then
            -- 注意: 这个方法在服务器端可能不可用
            -- 作为替代方案,使用原始目标位置或施法者位置
            if original_target and not original_target:IsNull() then
                original_position = original_target:GetAbsOrigin()
            else
                -- ✅ 修改: 对施法者前方施法距离极限释放
                local cast_range = random_ability:GetCastRange(caster:GetAbsOrigin(), nil)
                if cast_range <= 0 then
                    cast_range = 600 -- 默认距离
                end
                local forward = caster:GetForwardVector()
                original_position = caster:GetAbsOrigin() + forward * cast_range
                --print("[cast_trigger] 敌方点目标/AOE技能,目标: 施法者前方" .. cast_range .. "距离")
            end
        else
            original_position = caster:GetAbsOrigin()
        end
    end
    Timers:CreateTimer(0.5, function()
        if not caster or caster:IsNull() then
            self.trigger_depth = self.trigger_depth - 1
            return
        end
        if not random_ability or random_ability:IsNull() then
            self.trigger_depth = self.trigger_depth - 1
            return
        end
        -- ✅ 标记随机技能，防止递归触发蝴蝶效应
        if random_ability then
            random_ability.butterfly_triggered = true
        end
        random_ability:EndCooldown()

        if caster:IsStunned() or caster:IsSilenced() then
            self.trigger_depth = self.trigger_depth - 1
            random_ability:EndCooldown() -- 先结束
            random_ability:StartCooldown(remaining_cooldown)
            return
        end

        -- ✅ 修复: 重新获取技能属性
        local behavior = random_ability:GetBehavior()
        local target_team = random_ability:GetAbilityTargetTeam()

        -- ✅ 修复: 智能目标选择
        local cast_target = nil
        local target_position = nil

        --print("[cast_trigger] 技能目标队伍: " .. target_team)
        --print("[cast_trigger] 原始目标存在: " .. tostring(original_target ~= nil and not original_target:IsNull()))

        -- 友方技能 - 对自己释放
        if bit.band(target_team, DOTA_UNIT_TARGET_TEAM_FRIENDLY) ~= 0 then
            cast_target = caster
            target_position = caster:GetAbsOrigin()
            --print("[cast_trigger] 友方技能,目标: 自己")

            -- 敌方技能 - 需要找到有效敌人
        elseif bit.band(target_team, DOTA_UNIT_TARGET_TEAM_ENEMY) ~= 0 then
            -- ✅ 修复: 验证原始目标是否为敌人
            if original_target and not original_target:IsNull() and original_target:IsAlive()
                and original_target:GetTeamNumber() ~= caster:GetTeamNumber() then
                cast_target = original_target
                target_position = original_target:GetAbsOrigin()
                --print("[cast_trigger] 敌方技能,目标: 原始目标")
            else
                -- 原始目标无效或是友军,搜索附近敌人
                --print("[cast_trigger] 原始目标无效或非敌人,搜索附近敌人")
                local search_radius = 1200
                local enemies = FindUnitsInRadius(
                    caster:GetTeamNumber(),
                    caster:GetAbsOrigin(),
                    nil,
                    search_radius,
                    DOTA_UNIT_TARGET_TEAM_ENEMY,
                    DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
                    DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE + DOTA_UNIT_TARGET_FLAG_NO_INVIS,
                    FIND_CLOSEST,
                    false
                )

                if #enemies > 0 then
                    cast_target = enemies[1]
                    target_position = cast_target:GetAbsOrigin()
                    --print("[cast_trigger] 敌方技能,目标: 搜索到的敌人 " .. cast_target:GetUnitName())
                elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 or
                    bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) ~= 0 then
                    target_position = original_position or caster:GetAbsOrigin()
                    --print("[cast_trigger] 敌方技能,目标: 点位置")
                else
                    if ability_name == "invoker_sun_strike" then
                        --print("[cast_trigger] 天火")
                    else
                        --print("[cast_trigger] 敌方单体技能但无有效目标,跳过")
                        self.trigger_depth = self.trigger_depth - 1
                        random_ability:EndCooldown() -- 先结束
                        random_ability:StartCooldown(remaining_cooldown)
                        return
                    end
                end
            end

            -- 任意目标技能
        elseif bit.band(target_team, DOTA_UNIT_TARGET_TEAM_BOTH) ~= 0 then
            if original_target and not original_target:IsNull() and original_target:IsAlive() then
                cast_target = original_target
                target_position = original_target:GetAbsOrigin()
                --print("[cast_trigger] 任意目标技能,目标: 原始目标")
            else
                cast_target = nil
                target_position = original_position
                --print("[cast_trigger] 任意目标技能,目标: 原释放位置")
            end

            -- 无目标限制
        else
            target_position = original_position or caster:GetAbsOrigin()
            --print("[cast_trigger] 无目标限制技能")
        end

        -- ✅ 施放技能
        local cast_success = false
        local ability_name = random_ability:GetAbilityName()
        -- 卡尔天火特殊处理:强制使用双击版本(施法者位置)
        if ability_name == "invoker_sun_strike" then
            --print("[cast_trigger] 天火")
            target_position = nil
            cast_target = caster -- 清除单体目标,强制使用点目标模式
        end
        if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_NO_TARGET) ~= 0 and
            bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) == 0 and
            bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) == 0 then
            --print("[cast_trigger] 施放无目标技能")
            cast_success = caster:CastAbilityNoTarget(random_ability, caster:GetPlayerOwnerID())
        elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) ~= 0 then
            if cast_target and not cast_target:IsNull() then
                --print("[cast_trigger] 施放单体技能,目标: " .. cast_target:GetUnitName())
                caster:SetCursorCastTarget(cast_target)
                cast_success = caster:CastAbilityImmediately(random_ability, caster:GetPlayerOwnerID())
            elseif target_position and bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 then
                --print("[cast_trigger] 施放点目标技能(备选)")
                caster:SetCursorPosition(target_position)
                cast_success = caster:CastAbilityImmediately(random_ability, caster:GetPlayerOwnerID())
            end
        elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 or
            bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) ~= 0 then
            if target_position then
                --print("[cast_trigger] 施放点目标/AOE技能到targetposition")
                caster:SetCursorPosition(target_position)
                cast_success = caster:CastAbilityImmediately(random_ability, caster:GetPlayerOwnerID())
            else
                --print("[cast_trigger] 施放点目标/AOE技能到target")
                caster:SetCursorCastTarget(cast_target)
                cast_success = caster:CastAbilityImmediately(random_ability, caster:GetPlayerOwnerID())
            end
        end

        --print("[cast_trigger] 施放结果: " .. tostring(cast_success))

        if cast_success then
            caster:GiveMana(random_ability:GetManaCost(random_ability:GetLevel() - 1))
            EmitSoundOn("Hero_OgreMagi.Fireblast.x1", caster)
            local particle = ParticleManager:CreateParticle(
                "particles/econ/items/ogre_magi/ogre_magi_jackpot/ogre_magi_jackpot_multicast.vpcf",
                PATTACH_OVERHEAD_FOLLOW,
                caster
            )
            ParticleManager:SetParticleControl(particle, 1, Vector(1, 1, 1))
            ParticleManager:ReleaseParticleIndex(particle)
        end

        -- 获取技能的抬手时间
        local cast_point = random_ability:GetCastPoint()
        --print(string.format("[Trigger Debug] Ability cast point: %.2fs", cast_point))

        -- 恢复原有冷却状态 - 加入抬手时间
        local restore_delay = cast_point + 0.01

        -- 特殊技能的额外延迟
        if ability_name == "juggernaut_omni_slash" then
            restore_delay = 4.0
            --print("[Trigger Debug] Special delay for juggernaut_omni_slash: 4.0s")
        end
        random_ability:SetContextThink("restore_cooldown_" .. random_ability:GetEntityIndex(), function()
            if not random_ability or random_ability:IsNull() then
                --print("[Trigger Debug] Ability is null, cannot restore CD")
                return nil
            end

            if has_charges then
                if random_ability:IsItem() then
                    random_ability:SetCurrentCharges(current_charges)
                else
                    random_ability:SetCurrentAbilityCharges(current_charges)
                end
                --print(string.format("[Trigger Debug] Restored charges to %d", current_charges))
            else
                if remaining_cooldown and remaining_cooldown > 0 then
                    random_ability:EndCooldown()                     -- 先结束
                    random_ability:StartCooldown(remaining_cooldown) -- 再用剩余时间开始
                    --print(string.format("[Trigger Debug] Restored cooldown: %.2fs", remaining_cooldown))
                else
                    random_ability:EndCooldown()
                    --print("[Trigger Debug] Ended cooldown (was 0)")
                end
            end
            -- ✅ 清除标记
            if random_ability then
                random_ability.butterfly_triggered = nil
            end
            self.trigger_depth = self.trigger_depth - 1
            return nil
        end, restore_delay)
    end)
    -- ✅ 延迟清除原始技能的标记
    Timers:CreateTimer(0.5, function()
        if executed_ability then
            executed_ability.butterfly_triggered = nil
        end
    end)
end
