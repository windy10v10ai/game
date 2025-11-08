-- 这些技能不会被蝴蝶效应物品触发，避免游戏机制冲突或性能问题
EXCLUDED_ABILITIES_ALLBUTTER = {
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
    ["wisp_tether_break"] = true,
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
    ["earthshaker_fissure"] = true,        --沟壑 避免影响队友游戏体验
    ["kunkka_x_marks_the_spot"] = true,
    ["dark_willow_cursed_crown"] = true,
    ["morphling_hybrid"] = true,

    ["mars_bulwark"] = true,
    ["ember_spirit_fire_remnant"] = true,
    ["earth_spirit_stone_caller"] = true,
    ["muerta_gunslinger"] = true,
    ["troll_warlord_switch_stance"] = true,
    ["shadow_demon_disruption"] = true, --崩裂禁锢
    ["keeper_of_the_light_recall"] = true,
    ["nevermore_frenzy"] = true,
    ["ringmaster_tame_the_beasts"] = true,
    ["furion_sprout"] = true,
    ["abyssal_underlord_dark_portal"] = true,
    ["abyssal_underlord_dark_rift"] = true,
    ["windrunner_powershot"] = true,
}
-- 定义需要排除的物品黑名单
-- 这些物品不会被自动触发,避免游戏机制冲突或性能问题
EXCLUDED_ITEMS = {
    -- ========================================
    -- 消耗品
    -- 原因:消耗品应该由玩家手动使用,自动使用会浪费资源
    -- ========================================
    ["item_clarity"] = true,               -- 净化药水
    ["item_flask"] = true,                 -- 治疗药膏
    ["item_dust"] = true,                  -- 显影之尘
    ["item_bottle"] = true,                -- 魔瓶
    ["item_cheese"] = true,                -- 奶酪
    ["item_blood_grenade"] = true,         -- 血腥榴弹
    ["item_refresher_shard"] = true,       -- 刷新球碎片
    ["item_smoke_of_deceit"] = true,       -- 诡计之雾
    ["item_moon_shard_datadriven"] = true, -- 月之碎片
    ["item_ultimate_scepter_2"] = true,    -- 终极权杖2
    ["item_consumable_gem"] = true,        -- 可消耗真视宝石
    ["item_wings_of_haste"] = true,        -- 疾行之翼
    ["item_candy_candy"] = true,           -- 糖果
    ["item_repair_kit"] = true,            -- 修理工具

    -- ========================================
    -- 位移类物品
    -- 原因:位移物品会打乱战术定位,应该由玩家控制
    -- ========================================
    ["item_blink"] = true,              -- 闪烁匕首
    ["item_overwhelming_blink"] = true, -- 压迫之刃
    ["item_swift_blink"] = true,        -- 迅捷之刃
    ["item_arcane_blink"] = true,       -- 秘法之刃
    ["item_jump_jump_jump"] = true,     -- 跳跳跳
    ["item_fallen_sky"] = true,         -- 天崩

    -- ========================================
    -- 隐身类物品
    -- 原因:隐身物品会破坏战斗节奏
    -- ========================================
    ["item_invis_sword"] = true,   -- 影刃
    ["item_silver_edge"] = true,   -- 银月之晶
    ["item_silver_edge_2"] = true, -- 银月之晶2

    -- ========================================
    -- 特殊机制物品
    -- 原因:这些物品有特殊使用时机,不应该自动触发
    -- ========================================
    ["item_black_king_bar"] = true,   -- 黑皇杖
    ["item_black_king_bar_2"] = true, -- 黑皇杖2
    ["item_manta"] = true,            -- 幻影斧
    ["item_manta_2"] = true,          -- 幻影斧2
    ["item_force_staff"] = true,      -- 原力法杖
    ["item_hurricane_pike"] = true,   -- 飓风长戟
    ["item_demonicon"] = true,        -- 死灵书
    ["item_power_treads"] = true,     -- 动力鞋
    ["item_seer_stone"] = true,       -- 先知石
    ["item_saint_orb"] = true,        -- 莲花
    ["item_saint_orb_2"] = true,      -- 莲花2

    -- ========================================
    -- 包含特定子字符串的物品(通过子字符串匹配)
    -- 原因:某些系列物品都不应该被自动触发
    -- ========================================
    -- 注:芒果、仙灵之火、守卫、吃树、知识之书等
    -- 这些通过 no_support_substrings 处理

    ["mars_bulwark"] = true,
    ["tinker_rearm_lua"] = true,
    ["storm_spirit_ball_lightning"] = true,
    ["ember_spirit_fire_remnant"] = true,
    ["earth_spirit_stone_caller"] = true,
    ["muerta_gunslinger"] = true,
    ["troll_warlord_switch_stance"] = true,
}
