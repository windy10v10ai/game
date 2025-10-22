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
    ["zuus_lightning_hands"] = true,
}
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
    ["clinkz_skeleton_walk"] = true,        -- 火枪手 灼热之箭
    ["riki_permanent_invisibility"] = true, -- 力丸 永久隐身
    --["templar_assassin_meld"] = true,            -- 圣堂刺客 融合（已注释）
    --["sand_king_sand_storm"] = true,             -- 沙王 沙尘暴（已注释）
    ["treant_natures_guise"] = true, -- 树精卫士 自然之姿

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
    ["nyx_assassin_vendetta"] = true,      -- 司夜刺客 复仇
    ["pudge_rot"] = true,                  -- 屠夫 腐肉（持续伤害自己）
    ["axe_culling_blade"] = true,          -- 斧王 淘汰之刃（斩杀技能）
    ["hoodwink_sharpshooter"] = true,

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
    ["viper_nosedive"] = true,                     -- 冥界亚龙 俯冲
    ["winter_wyvern_cold_embrace"] = true,
    ["snapfire_firesnap_cookie"] = true,
    ["phantom_assassin_phantom_strike"] = true,


    ["elder_titan_ancestral_spirit"] = true,
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
    ["muerta_the_calling"] = true,              -- 唤魂
    ["magnataur_empower"] = true,               -- 马格纳斯 授予力量
    ["furion_teleportation"] = true,            -- 先知 传送
    ["dawnbreaker_solar_guardian"] = true,      -- 破晓辰星 太阳守护
    ["obsidian_destroyer_essence_flux"] = true, -- 黑鸟 精华变迁
    ["viper_nethertoxin"] = true,               -- 冥界亚龙 剧毒攻击
    ["naga_siren_song_of_the_siren"] = true,    -- 娜迦海妖 海妖之歌
    ["tinker_keen_teleport"] = true,            -- 修补匠 传送  ✅ 新增
    --精灵
    ["wisp_tether"] = true,
    ["wisp_spirits"] = true,
    ["wisp_relocate"] = true,
    ["wisp_spirits_in"] = true,
    ["wisp_spirits_out"] = true,
    -- ========================================
    -- 玛西技能组
    -- 原因:玛西的技能组有特殊的联动机制,随机触发会破坏技能连招
    -- ========================================
    ["marci_guardian"] = true,         -- 玛西 守护者
    ["marci_bodyguard"] = true,        -- 玛西 保镖
    ["marci_special_delivery"] = true, -- 玛西 特快专递
    ["marci_grapple"] = true,          -- 玛西 过肩摔
    ["marci_companion_run"] = true,    -- 玛西 伙伴奔跑

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
    ["mars_bulwark"] = true,
    ["ember_spirit_fire_remnant"] = true,
    ["earth_spirit_stone_caller"] = true,
    ["muerta_gunslinger"] = true,
    ["troll_warlord_switch_stance"] = true,
    ["earthshaker_fissure"] = true,
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
            and not EXCLUDED_ABILITIES[ability:GetAbilityName()] then
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
