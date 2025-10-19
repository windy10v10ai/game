ability_trigger_learned_skills = class({})

LinkLuaModifier("modifier_trigger_learned_skills", "abilities/ability_trigger_learned_skills", LUA_MODIFIER_MOTION_NONE)

-- 定义需要排除的技能黑名单
-- 这些技能不会被蝴蝶效应物品触发，避免游戏机制冲突或性能问题
local EXCLUDED_ABILITIES = {
    -- ========================================
    -- 地图功能性技能
    -- 原因：这些是地图机制技能，不应该被随机触发
    -- ========================================
    ["ability_capture"] = true,               -- 占点技能
    ["ability_lamp_use"] = true,              -- 神灯使用
    ["twin_gate_portal_warp"] = true,         -- 双子门传送
    ["ability_pluck_famango"] = true,         -- 采摘法芒果
    ["abyssal_underlord_portal_warp"] = true, -- 地狱领主传送门
    ["teleport"] = true,                      -- 传送
    ["courier_burst"] = true,                 -- 信使加速
    ["courier_shield"] = true,                -- 信使护盾

    -- ========================================
    -- 隐身技能
    -- 原因：隐身技能会破坏战斗节奏，且可能导致AI行为异常
    -- ========================================
    ["bounty_hunter_wind_walk"] = true,          -- 赏金猎人 疾风步
    ["clinkz_skeleton_walk"] = true,             -- 火枪手 灼热之箭
    ["riki_permanent_invisibility"] = true,      -- 力丸 永久隐身
    ["nyx_assassin_vendetta"] = true,            -- 司夜刺客 复仇
    ["invoker_ghost_walk"] = true,               -- 卡尔 幽灵漫步
    --["templar_assassin_meld"] = true,            -- 圣堂刺客 融合（已注释）
    ["weaver_shukuchi"] = true,                  -- 编织者 缩地
    --["sand_king_sand_storm"] = true,             -- 沙王 沙尘暴（已注释）
    ["treant_natures_guise"] = true,             -- 树精卫士 自然之姿
    ["jack_murderer_of_the_misty_night"] = true, -- Jack 雾夜杀人
    ["jack_presence_concealment"] = true,        -- Jack 气息遮断
    -- ========================================
    -- 切换类技能/法球技能
    -- 原因：这些是攻击修改器，会与普通攻击冲突
    -- ========================================
    ["winter_wyvern_arctic_burn"] = true,       -- 寒冬飞龙 极寒之触
    ["medusa_split_shot"] = true,               -- 美杜莎 分裂箭
    ["drow_ranger_frost_arrows"] = true,        -- 卓尔游侠 冰霜之箭
    ["clinkz_searing_arrows"] = true,           -- 火枪手 灼热之箭
    ["obsidian_destroyer_arcane_orb"] = true,   -- 殁境神蚀者 奥术天球
    ["enchantress_impetus"] = true,             -- 魅惑魔女 推进
    ["huskar_burning_spear"] = true,            -- 哈斯卡 燃烧之矛
    ["jakiro_liquid_fire"] = true,              -- 双头龙 液态火焰
    ["rubick_null_field"] = true,               -- 拉比克 失效力场
    ["jakiro_liquid_frost"] = true,             -- 双头龙 液态冰霜
    ["silencer_glaives_of_wisdom"] = true,      -- 沉默术士 智慧之刃
    ["viper_poison_attack"] = true,             -- 冥界亚龙 毒性攻击
    ["witch_doctor_voodoo_restoration"] = true, -- 巫医 巫毒恢复
    ["bloodseeker_blood_mist2"] = true,         -- 血魔 血雾（自定义版本）
    ["brewmaster_drunken_boxing"] = true,       -- 酒仙 醉拳

    -- ========================================
    -- 其他可能中断攻击的技能
    -- 原因：这些技能会改变英雄状态或打断攻击动作
    -- ========================================
    ["brewmaster_primal_split"] = true,    -- 酒仙 元素分离
    ["morphling_morph_agi"] = true,        -- 水人 变体（敏捷）
    ["morphling_morph_str"] = true,        -- 水人 变体（力量）
    ["kez_switch_weapons"] = true,         -- Kez 切换武器
    ["rubick_spell_steal"] = true,         -- 拉比克 法术窃取
    ["terrorblade_sunder"] = true,         -- 恐怖利刃 魂断
    ["vengefulspirit_nether_swap"] = true, -- 复仇之魂 移形换位
    ["nyx_assassin_burrow"] = true,        -- 司夜刺客 钻地
    ["nyx_assassin_unburrow"] = true,      -- 司夜刺客 现身
    ["pudge_rot"] = true,                  -- 屠夫 腐肉（持续伤害自己）
    ["axe_culling_blade"] = true,          -- 斧王 淘汰之刃（斩杀技能）

    -- ========================================
    -- 位移/冲刺类技能
    -- 原因：位移技能会打断攻击并改变位置，可能导致战斗混乱
    -- ========================================
    ["faceless_void_time_walk_reverse"] = true,    -- 虚空假面 反向时间漫游
    ["magnataur_skewer"] = true,                   -- 马格纳斯 巨角冲撞
    ["dawnbreaker_celestial_hammer"] = true,       -- 破晓辰星 上界重锤
    ["dawnbreaker_converge"] = true,               -- 破晓辰星 聚合
    ["mirana_leap"] = true,                        -- 米拉娜 跳跃
    ["techies_suicide"] = true,                    -- 炸弹人 自爆
    ["weaver_time_lapse"] = true,                  -- 编织者 时光倒流
    ["enchantress_sproink"] = true,                -- 魅惑魔女 跳跃
    ["sand_king_burrowstrike"] = true,             -- 沙王 掘地穿刺
    ["morphling_waveform"] = true,                 -- 水人 波浪形态
    ["antimage_blink"] = true,                     -- 敌法师 闪烁
    ["queenofpain_blink"] = true,                  -- 痛苦女王 闪烁
    ["ember_spirit_activate_fire_remnant"] = true, -- 灰烬之灵 激活火焰残影
    ["earth_spirit_rolling_boulder"] = true,       -- 大地之灵 巨石翻滚
    ["wisp_relocate"] = true,                      -- 艾欧 迁移
    ["marci_companion_run"] = true,                -- 玛西 伙伴奔跑
    ["viper_nosedive"] = true,                     -- 冥界亚龙 俯冲

    -- ========================================
    -- 召唤类技能
    -- 原因：召唤单位可能导致单位管理问题和性能下降
    -- ========================================
    ["invoker_forge_spirit"] = true,      -- 卡尔 熔炉精灵
    ["enigma_demonic_conversion"] = true, -- 谜团 恶魔转化
    ["furion_force_of_nature"] = true,    -- 先知 自然之力

    -- ========================================
    -- 持续施法/引导类技能
    -- 原因：这些技能需要持续施法，被打断会浪费冷却时间
    -- ========================================
    ["tiny_tree_channel"] = true,             -- 小小 树木连掷
    ["shredder_chakram"] = true,              -- 伐木机 锯齿飞轮
    ["shredder_twisted_chakram"] = true,      -- 伐木机 锯齿飞轮2
    ["earthshaker_enchant_totem"] = true,     -- 撼地者 强化图腾
    ["tiny_tree_grab"] = true,                -- 小小 抓树
    ["enigma_black_hole"] = true,             -- 谜团 黑洞
    ["bane_fiends_grip"] = true,              -- 祸乱之源 魔爪
    ["crystal_maiden_freezing_field"] = true, -- 水晶室女 极寒领域
    ["witch_doctor_death_ward"] = true,       -- 巫医 死亡守卫
    ["pudge_dismember"] = true,               -- 屠夫 肢解
    ["sand_king_epicenter"] = true,           -- 沙王 地震
    ["storm_spirit_ball_lightning"] = true,   -- 风暴之灵 球状闪电
    ["warlock_upheaval"] = true,              -- 术士 剧变
    ["enigma_midnight_pulse"] = true,         -- 谜团 午夜凋零
    ["goku_kamehameha"] = true,               -- 悟空 龟派气功
    ["yukari_twin_trains"] = true,            -- 八云紫 无人废线车辆炸弹
    ["yukari_moon_portal"] = true,            -- 八云紫 月之门
    ["artoria_excalibur"] = true,             -- Artoria 誓约胜利之剑
    ["miku_dance"] = true,                    -- 初音未来 舞蹈
    ["miku_get_down"] = true,                 -- 初音未来 Get Down
    ["tinker_rearm_lua"] = true,              -- 修补匠 重新装备
    ["clinkz_burning_barrage"] = true,        -- 火枪手 燃烧弹幕
    ["tiny_toss_tree"] = true,                -- 小小 丢树（注意有空格）
    ["morphling_replicate"] = true,           -- 水人 复制
    ["ancient_apparition_ice_blast"] = true,  -- 冰魂 寒冰爆破

    -- ========================================
    -- 取消/停止类技能
    -- 原因：这些是技能的取消版本，不应该被主动触发
    -- ========================================
    ["crystal_maiden_freezing_field_stop"] = true,  -- 水晶室女 停止极寒领域
    ["windrunner_focusfire_cancel"] = true,         -- 风行者 取消集中火力
    ["naga_siren_song_of_the_siren_cancel"] = true, -- 娜迦海妖 取消海妖之歌

    -- ========================================
    -- 两段式技能
    -- 原因：这些技能需要两次施放才能完成，随机触发会导致逻辑错误
    -- ========================================
    ["alchemist_unstable_concoction"] = true,        -- 炼金术士 不稳定化合物（蓄力）
    ["alchemist_unstable_concoction_throw"] = true,  -- 炼金术士 不稳定化合物（投掷）
    ["ancient_apparition_ice_blast_release"] = true, -- 冰魂 寒冰爆破（释放）

    -- ========================================
    -- 卡尔（Invoker）技能组
    -- 原因：卡尔的技能需要特定组合，随机触发会破坏技能系统
    -- ========================================
    ["invoker_quas"] = true,        -- 卡尔 急速冷却
    ["invoker_wex"] = true,         -- 卡尔 疾跑
    ["invoker_exort"] = true,       -- 卡尔 超震声波
    ["invoker_invoke"] = true,      -- 卡尔 法术融合
    ["invoker_alacrity"] = true,    -- 卡尔 灵动迅捷
    ["invoker_alacrity_ad"] = true, -- 卡尔 灵动迅捷（AD版本）

    -- ========================================
    -- 特殊机制技能
    -- 原因：这些技能有特殊的游戏机制，不适合随机触发
    -- ========================================
    ["ogre_magi_ignite"] = true,                -- 食人魔魔法师 引燃
    ["viper_viper_strike"] = true,              -- 冥界亚龙 毒性攻击（大招）
    ["death_prophet_carrion_swarm"] = true,     -- 死亡先知 腐尸群
    ["ancient_apparition_frost_seal"] = true,   -- 冰魂 冰霜封印
    ["terrorblade_reflection"] = true,          -- 恐怖利刃 倒影
    ["goku_kaioken"] = true,                    -- 悟空 界王拳
    ["tusk_snowball"] = true,                   -- 巨牙海民 雪球
    ["wisp_tether"] = true,                     -- 艾欧 羁绊
    ["muerta_the_calling"] = true,              -- 唤魂
    ["magnataur_empower"] = true,               -- 马格纳斯 授予力量
    ["furion_teleportation"] = true,            -- 先知 传送
    ["dawnbreaker_solar_guardian"] = true,      -- 破晓辰星 太阳守护
    ["obsidian_destroyer_essence_flux"] = true, -- 黑鸟 精华变迁
    ["viper_nethertoxin"] = true,               -- 冥界亚龙 剧毒攻击
    ["naga_siren_song_of_the_siren"] = true,    -- 娜迦海妖 海妖之歌
    ["winter_wyvern_cold_embrace"] = true,
    ["snapfire_firesnap_cookie"] = true,
    -- ========================================
    -- 玛西技能组
    -- 原因:玛西的技能组有特殊的联动机制,随机触发会破坏技能连招
    -- ========================================
    ["marci_guardian"] = true,         -- 玛西 守护者
    ["marci_bodyguard"] = true,        -- 玛西 保镖
    ["marci_special_delivery"] = true, -- 玛西 特快专递

    -- ========================================
    -- 幻象类技能
    -- 原因: 创建幻象单位,可能导致单位管理混乱和性能问题
    -- ========================================
    ["terrorblade_conjure_image"] = true,  -- 恐怖利刃 - 幻象
    ["naga_siren_mirror_image"] = true,    -- 娜迦海妖 - 镜像
    ["phantom_lancer_doppelwalk"] = true,  -- 幻影长矛手 - 幻影突袭
    ["chaos_knight_phantasm"] = true,      -- 混沌骑士 - 幻象
    ["imba_chaos_knight_phantasm"] = true, -- 混沌骑士 - 幻象(增强版)
    ["spectre_haunt"] = true,              -- 幽鬼 - 降临
    ["spectre_haunt_single"] = true,       -- 幽鬼 - 单体降临
    ["dark_seer_wall_of_replica"] = true,  -- 黑贤 - 复制之墙
    ["skeleton_king_reincarnation"] = true,
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
    local ultimate_trigger_chance = self:GetAbility():GetLevelSpecialValueFor("ultimate_trigger_chance",
        passive_level - 1)

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
    --施放技能 - 使用位运算检查行为
    local target = params.target
    local behavior = random_ability:GetBehavior()
    local target_team = random_ability:GetAbilityTargetTeam()

    -- 确定实际施放目标
    local cast_target = target
    local is_valid_target = true

    -- 根据技能目标队伍类型选择目标
    if bit.band(target_team, DOTA_UNIT_TARGET_TEAM_FRIENDLY) ~= 0 then
        -- 友方技能,对自己释放
        cast_target = attacker
    elseif bit.band(target_team, DOTA_UNIT_TARGET_TEAM_ENEMY) ~= 0 then
        -- 敌方技能,对攻击目标释放
        cast_target = target
    elseif bit.band(target_team, DOTA_UNIT_TARGET_TEAM_BOTH) ~= 0 then
        -- 任意目标技能,对攻击目标释放
        cast_target = target
    end

    -- 根据技能行为类型施放
    local cast_success = false
    if bit.band(behavior, DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) ~= 0 then
        -- 单位目标技能
        attacker:SetCursorCastTarget(cast_target)
        cast_success = attacker:CastAbilityImmediately(random_ability, attacker:GetPlayerOwnerID())
    elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_POINT) ~= 0 or
        bit.band(behavior, DOTA_ABILITY_BEHAVIOR_AOE) ~= 0 then
        -- 点目标或AOE技能,使用目标位置
        attacker:SetCursorPosition(cast_target:GetAbsOrigin())
        cast_success = attacker:CastAbilityImmediately(random_ability, attacker:GetPlayerOwnerID())
    elseif bit.band(behavior, DOTA_ABILITY_BEHAVIOR_NO_TARGET) ~= 0 then
        -- 无目标技能,直接施放
        cast_success = attacker:CastAbilityImmediately(random_ability, attacker:GetPlayerOwnerID())
    end

    -- 只在施放成功时返还魔法
    if cast_success then
        attacker:GiveMana(random_ability:GetManaCost(random_ability:GetLevel() - 1))
    end

    --- 针对无敌斩设置特殊延迟
    local restore_delay = 0.1
    if random_ability:GetAbilityName() == "juggernaut_omni_slash" then
        restore_delay = 4.0 -- 无敌斩延迟4秒恢复冷却
    end

    random_ability:SetContextThink("restore_cooldown_" .. random_ability:GetEntityIndex(), function()
        if not random_ability or random_ability:IsNull() then
            return nil
        end

        if has_charges then
            if random_ability:IsItem() then
                random_ability:SetCurrentCharges(current_charges)
            else
                random_ability:SetCurrentAbilityCharges(current_charges)
            end
        else
            if remaining_cooldown and remaining_cooldown > 0 then
                random_ability:StartCooldown(remaining_cooldown)
            else
                random_ability:EndCooldown()
            end
        end

        return nil
    end, restore_delay) -- 使用变量延迟时间
    -- 特效
    EmitSoundOn("Hero_Juggernaut.BladeFury", attacker)
end
