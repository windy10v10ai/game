ability_trigger_learned_skills = class({})

LinkLuaModifier("modifier_trigger_learned_skills", "abilities/ability_trigger_learned_skills", LUA_MODIFIER_MOTION_NONE)

-- 定义需要排除的技能黑名单
local EXCLUDED_ABILITIES = {
    -- 地图功能性技能(新增)
    ["ability_capture"] = true,
    ["ability_lamp_use"] = true,
    ["twin_gate_portal_warp"] = true,
    ["abyssal_underlord_portal_warp"] = true,
    ["teleport"] = true,
    ["courier_burst"] = true,
    ["courier_shield"] = true,
    -- 隐身技能
    ["bounty_hunter_wind_walk"] = true,
    ["clinkz_skeleton_walk"] = true,
    ["riki_permanent_invisibility"] = true,
    ["nyx_assassin_vendetta"] = true,
    ["invoker_ghost_walk"] = true,
    ["templar_assassin_meld"] = true,
    ["weaver_shukuchi"] = true,
    ["sand_king_sand_storm"] = true,
    ["treant_natures_guise"] = true,

    ["jack_murderer_of_the_misty_night"] = true,
    ["jack_presence_concealment"] = true,
    -- 切换类技能/法球技能
    ["winter_wyvern_arctic_burn"] = true,
    ["medusa_split_shot"] = true,
    ["drow_ranger_frost_arrows"] = true,
    ["clinkz_searing_arrows"] = true,
    ["obsidian_destroyer_arcane_orb"] = true,
    ["enchantress_impetus"] = true,
    ["huskar_burning_spear"] = true,
    ["jakiro_liquid_fire"] = true,
    ["silencer_glaives_of_wisdom"] = true,
    ["viper_poison_attack"] = true,
    ["bloodseeker_blood_mist2"] = true,
    ["brewmaster_drunken_boxing"] = true,
    -- 其他可能中断攻击的技能
    ["brewmaster_primal_split"] = true,
    ["morphling_morph_agi"] = true,
    ["morphling_morph_str"] = true,
    ["kez_switch_weapons"] = true,
    ["rubick_spell_steal"] = true,
    ["terrorblade_sunder"] = true,
    ["vengefulspirit_nether_swap"] = true,
    ["nyx_assassin_burrow"] = true,
    ["nyx_assassin_unburrow"] = true,
    ["pudge_rot"] = true,  -- 屠夫腐肉(持续伤害自己)
    ["axe_culling_blade"] = true,  -- 斧王淘汰之刃
    -- 位移/冲刺类
    ["faceless_void_time_walk_reverse"] = true,
    ["magnataur_skewer"] = true,
    ["dawnbreaker_celestial_hammer"] = true,
    ["mirana_leap"] = true,
    ["techies_suicide"] = true,
    -- 召唤类(可能导致单位管理问题)
    ["invoker_forge_spirit"] = true,  -- 卡尔熔炉精灵
    -- 持续施法/引导类
    -- 持续施法/引导类
    ["tiny_tree_channel"] = true,  -- 小小树木连掷
    ["shredder_chakram"] = true,  -- 伐木机锯齿飞轮
    ["shredder_twisted_chakram"] = true,  -- 伐木机锯齿飞轮2
    ["earthshaker_enchant_totem"] = true,  -- 撼地者强化图腾
    ["tiny_tree_grab"] = true,  -- 小小抓树
    ["enigma_black_hole"] = true,  -- 谜团黑洞
    ["bane_fiends_grip"] = true,  -- 祸乱之源魔爪
    ["crystal_maiden_freezing_field"] = true,  -- 水晶室女极寒领域
    ["witch_doctor_death_ward"] = true,  -- 巫医死亡守卫
    ["pudge_dismember"] = true,  -- 屠夫肢解
    ["sand_king_epicenter"] = true,  -- 沙王地震
    ["storm_spirit_ball_lightning"] = true,  -- 风暴之灵球状闪电
    ["goku_kamehameha"] = true,  -- 悟空龟派气功
    ["yukari_twin_trains"] = true,  -- 八云紫大招
    ["yukari_moon_portal"] = true,  -- 八云紫月之门
    ["artoria_excalibur"] = true,  -- Artoria誓约胜利之剑
    ["miku_dance"] = true,  -- 初音未来舞蹈
    ["miku_get_down"] = true,  -- 初音未来Get Down
    ["tinker_rearm_lua"] = true,  -- 修补匠重新装备
    ["clinkz_burning_barrage"] = true,  -- 火枪手燃烧弹幕
    ["tiny_toss_tree "] = true, --小小丢树
    ["morphling_replicate"] = true,           -- 水人 复制 (新增)
    ["ancient_apparition_ice_blast"] = true,  -- 冰魂 大招 (新增)

        -- 从多重施法黑名单补充的技能
    ["invoker_quas"] = true,                  -- 卡尔 急速冷却
    ["invoker_wex"] = true,                   -- 卡尔 疾跑
    ["invoker_exort"] = true,                 -- 卡尔 超震声波
    ["invoker_invoke"] = true,                -- 卡尔 法术融合
    ["invoker_alacrity"] = true,              -- 卡尔 灵动迅捷
    ["invoker_alacrity_ad"] = true,           -- 卡尔 灵动迅捷(AD版本)
    ["ogre_magi_ignite"] = true,              -- 食人魔 引燃
    ["viper_viper_strike"] = true,            -- 毒龙 大招
    ["death_prophet_carrion_swarm"] = true,   -- 死亡先知 腐尸群
    ["ancient_apparition_frost_seal"] = true, -- 冰魂 冰霜封印
    ["terrorblade_reflection"] = true,        -- 恐怖利刃 倒影
    --["terrorblade_metamorphosis"] = true,     -- 恐怖利刃 魔化
    --["faceless_void_time_walk"] = true,       -- 虚空假面 时间漫游
   -- ["ember_spirit_sleight_of_fist"] = true,  -- 灰烬之灵 无影拳
    ["goku_kaioken"] = true,                  -- 悟空 界王拳
    --["doom_bringer_doom"] = true,             -- 末日使者 末日
    ["tusk_snowball"] = true,                 -- 巨牙海民 雪球
    --["phantom_assassin_phantom_strike"] = true, -- 幻影刺客 幻影突袭
    ["wisp_tether"] = true,                   -- 艾欧 羁绊
    ["muerta_the_calling"] = true,                   -- 唤魂
    ["magnataur_empower"] = true,                   --授予力量
    ["rubick_null_field"] = true,                   --失效力场

}

function ability_trigger_learned_skills:GetIntrinsicModifierName()
    return "modifier_trigger_learned_skills"
end

modifier_trigger_learned_skills = class({})
function modifier_trigger_learned_skills:IsHidden()
    return true
end

function modifier_trigger_learned_skills:IsPermanent()
    return true
end

function modifier_trigger_learned_skills:RemoveOnDeath()
    return false
end

function modifier_trigger_learned_skills:IsPurgable()
    return false
end

function modifier_trigger_learned_skills:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_ATTACK_LANDED
    }
end

function modifier_trigger_learned_skills:OnAttackLanded(params)
    if not IsServer() then return end

    local attacker = params.attacker
    local parent = self:GetParent()

    if attacker ~= parent then return end
    if parent:IsIllusion() then return end
    if params.target:IsBuilding() then return end

    -- 过滤由技能触发的攻击
    if params.inflictor and params.inflictor:GetAbilityName() == "puck_dream_coil" then
       -- print("[butter] puck_dream_coil detected")
        return
    end
    -- 获取触发概率
    local passive_level = self:GetAbility():GetLevel()
    if passive_level <= 0 then passive_level = 1 end

    local basic_trigger_chance = self:GetAbility():GetLevelSpecialValueFor("basic_trigger_chance", passive_level - 1)
    local ultimate_trigger_chance = self:GetAbility():GetLevelSpecialValueFor("ultimate_trigger_chance", passive_level - 1)

    -- 分别判断终极技能和普通技能的触发
    local trigger_ultimate = RollPseudoRandomPercentage(ultimate_trigger_chance, DOTA_PSEUDO_RANDOM_CUSTOM_GAME_1, parent)
    local trigger_basic = RollPseudoRandomPercentage(basic_trigger_chance, DOTA_PSEUDO_RANDOM_CUSTOM_GAME_2, parent)

    if not trigger_ultimate and not trigger_basic then
        return
    end

    -- 构建技能列表(按类型分类)
    local ultimate_abilities = {}
    local basic_abilities = {}

    for i = 0, attacker:GetAbilityCount() - 1 do
        local ability = attacker:GetAbilityByIndex(i)
        if ability and ability:GetLevel() > 0
            and not ability:IsPassive()
            and ability ~= self:GetAbility()
            and not ability:IsItem()
            and not EXCLUDED_ABILITIES[ability:GetAbilityName()] then

            local ability_type = ability:GetAbilityType()
            if ability_type == 1 then
                table.insert(ultimate_abilities, ability)
            else
                table.insert(basic_abilities, ability)
            end
        end
    end

    -- 选择要触发的技能
    local random_ability = nil
    print(ultimate_abilities)
    -- 优先触发终极技能(如果同时触发)
    if trigger_ultimate and #ultimate_abilities > 0 then
        random_ability = ultimate_abilities[RandomInt(1, #ultimate_abilities)]
    elseif trigger_basic and #basic_abilities > 0 then
        random_ability = basic_abilities[RandomInt(1, #basic_abilities)]
    end

    if not random_ability then return end
    -- 立即获取冷却时间(添加默认值处理)
    local remaining_cooldown = random_ability:GetCooldownTimeRemaining() or 0
    -- 保存充能状态
    local has_charges = random_ability:GetMaxAbilityCharges(random_ability:GetLevel()) > 0
    local current_charges = 0

    if has_charges then
        current_charges = random_ability:GetCurrentAbilityCharges()
    end

    -- 临时结束冷却以允许施放
    random_ability:EndCooldown()

    -- 施放技能 - 使用位运算检查行为
    local target = params.target
    local behavior = random_ability:GetBehavior()

    -- 获取技能的目标队伍
    local target_team = random_ability:GetAbilityTargetTeam()

    -- 检查目标是否合法
    local is_valid_target = false
    if bit.band(target_team, DOTA_UNIT_TARGET_TEAM_FRIENDLY) ~= 0 then
        -- 友方技能,检查target是否是友方
        is_valid_target = (target:GetTeamNumber() == attacker:GetTeamNumber())
    elseif bit.band(target_team, DOTA_UNIT_TARGET_TEAM_ENEMY) ~= 0 then
        -- 敌方技能,检查target是否是敌方
        is_valid_target = (target:GetTeamNumber() ~= attacker:GetTeamNumber())
    elseif bit.band(target_team, DOTA_UNIT_TARGET_TEAM_BOTH) ~= 0 then
        -- 双方都可以
        is_valid_target = true
    end

    if is_valid_target then
        if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) ~= 0 then
            attacker:SetCursorCastTarget(target)
            attacker:CastAbilityImmediately(random_ability, attacker:GetPlayerOwnerID())
        elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_NO_TARGET) ~= 0 then
            attacker:CastAbilityImmediately(random_ability, attacker:GetPlayerOwnerID())
        elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 then
            attacker:SetCursorPosition(target:GetAbsOrigin())
            attacker:CastAbilityImmediately(random_ability, attacker:GetPlayerOwnerID())
        end
    end

    -- 返还魔法消耗
    attacker:GiveMana(random_ability:GetManaCost(-1))

    --- 针对无敌斩设置特殊延迟
local restore_delay = 0.1
if random_ability:GetAbilityName() == "juggernaut_omni_slash" then
    restore_delay = 4.0  -- 无敌斩延迟4秒恢复冷却
end

random_ability:SetContextThink("restore_cooldown_" .. random_ability:GetEntityIndex(), function()
    if not random_ability or random_ability:IsNull() then
        return nil
    end

    if has_charges then
        random_ability:SetCurrentAbilityCharges(current_charges)
    else
        if remaining_cooldown and remaining_cooldown > 0 then
            random_ability:StartCooldown(remaining_cooldown)
        else
            random_ability:EndCooldown()
        end
    end

    return nil
end, restore_delay)  -- 使用变量延迟时间
    -- 特效
    EmitSoundOn("Hero_Juggernaut.BladeFury", attacker)
end
