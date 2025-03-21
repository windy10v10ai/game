--[[ ============================================================================================================
	Author: Windy
	Date: September 14, 2021
================================================================================================================= ]]
tBotItemData = {}

-- purchase item in order
tBotItemData.purchaseItemList = {
	npc_dota_hero_abaddon = {
		'item_magic_wand',
		'item_boots',
		'item_bracer',
		'item_bracer',
		'item_bracer',
		'item_holy_locket',
		'item_vanguard',
		'item_blade_mail', -- 刃甲
		'item_echo_sabre',
		'item_basher', -- 碎骨锤
		'item_radiance_2', -- 大辉耀 圣焰之光
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_overwhelming_blink',
		'item_blade_mail_2',
		'item_ultimate_scepter_2',
		'item_shivas_guard_2',
		'item_vladmir_2',
		'item_insight_armor',
		'item_saint_orb',
		'item_moon_shard_datadriven',
		'item_jump_jump_jump',
	},
	npc_dota_hero_axe = {
		'item_magic_wand',
		'item_boots',
		'item_bracer', -- 护腕
		'item_bracer', -- 护腕
		'item_power_treads',
		'item_vanguard',
		'item_blink',
		'item_blade_mail', -- 刃甲
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_overwhelming_blink',
		'item_black_king_bar_2',
		'item_ultimate_scepter_2',
		'item_blade_mail_2',
		'item_saint_orb',
		'item_undying_heart',
		'item_moon_shard_datadriven',
		'item_abyssal_blade_v2',
		'item_jump_jump_jump',
	},
	npc_dota_hero_spectre = {
		'item_magic_wand',
		'item_boots',
		'item_wraith_band', -- 系带
		'item_wraith_band', -- 系带
		'item_power_treads',
		'item_vanguard',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_blade_mail', -- 刃甲
		'item_blue_fantasy', -- 苍蓝幻想
		'item_undying_heart', -- 不朽之心
		'item_blade_mail_2',
		-- 'item_saint_orb', -- 圣女白莲
		'item_ultimate_scepter_2',
		'item_moon_shard_datadriven',
		'item_jump_jump_jump',
		'item_shivas_guard_2', -- 雅典娜之守护
		'item_satanic_2', -- 骑士剑换其他回血或减伤
	},
	npc_dota_hero_bane = {
		'item_magic_wand',
		'item_boots',
		'item_null_talisman', -- 挂件
		'item_null_talisman', -- 挂件
		'item_arcane_boots',
		'item_glimmer_cape',
		'item_force_staff',
		'item_aether_lens_2',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_ultimate_scepter_2',
		'item_aeon_pendant',
		'item_gungir_2',
		'item_necronomicon_staff',
		'item_refresh_core',
		'item_hallowed_scepter',
		'item_shivas_guard_2',
	},
	npc_dota_hero_bounty_hunter = {
		'item_magic_wand',
		'item_boots',
		'item_wraith_band', -- 系带
		'item_wraith_band', -- 系带
		'item_power_treads',
		'item_orb_of_corrosion',
		'item_wings_of_haste',
		'item_sange_and_yasha',
		'item_echo_sabre_2',
		-- 'item_aghanims_shard',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_blue_fantasy', -- 苍蓝幻想
		'item_ultimate_scepter_2',
		'item_wasp_callous',
		'item_abyssal_blade_v2',
		'item_wasp_despotic',
		'item_excalibur',
	},
	npc_dota_hero_bloodseeker = {
		'item_magic_wand',
		'item_boots',
		'item_wraith_band', -- 系带
		'item_wraith_band', -- 系带
		'item_power_treads',
		'item_orb_of_corrosion',
		'item_vanguard', -- 先锋盾
		'item_wings_of_haste',
		'item_basher', -- 碎骨锤
		'item_mjollnir',
		'item_echo_sabre_2',
		'item_sange_and_yasha',
		'item_aghanims_shard',
		'item_ultimate_scepter_2',

		'item_blue_fantasy', -- 苍蓝幻想
		'item_monkey_king_bar_2',
		'item_abyssal_blade_v2',
		'item_wasp_callous',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_wasp_despotic',
		'item_black_king_bar_2',
		'item_excalibur',
	},
	npc_dota_hero_bristleback = {
		'item_magic_wand',
		'item_boots',
		'item_bracer', -- 护腕
		'item_bracer', -- 护腕
		'item_power_treads',
		'item_vanguard',
		'item_blade_mail', -- 刃甲
		'item_falcon_blade',
		'item_echo_sabre',
		'item_wings_of_haste',
		'item_radiance_2', -- 大辉耀 圣焰之光
		'item_blade_mail_2',
		'item_eternal_shroud', -- 大天堂 无锋战戟
		'item_aghanims_shard',
		'item_heavens_halberd_v2',
		'item_insight_armor',
		'item_ultimate_scepter_2',
		'item_saint_orb',
		'item_undying_heart',
		-- 'item_bloodstone',
		'item_moon_shard_datadriven',
		'item_sange_and_yasha_1', -- 神器·散夜对剑
	},
	npc_dota_hero_chaos_knight = {
		'item_magic_wand',
		'item_boots',
		'item_bracer',
		'item_bracer',
		'item_power_treads',
		'item_armlet',
		'item_echo_sabre',
		'item_falcon_blade',
		'item_basher', -- 碎骨锤
		'item_wings_of_haste',
		'item_sange_and_yasha',
		'item_aghanims_shard',
		'item_vladmir_2',
		'item_ultimate_scepter_2',
		'item_insight_armor',
		'item_undying_heart',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_moon_shard_datadriven',
		'item_abyssal_blade_v2',
		'item_excalibur',
	},
	npc_dota_hero_crystal_maiden = {
		-- 出门装
		'item_magic_wand',
		'item_boots',
		'item_null_talisman', -- 挂件
		'item_null_talisman', -- 挂件
		-- 过度
		'item_glimmer_cape',
		'item_phase_boots',
		'item_force_staff',
		'item_hand_of_group', -- 团队之手
		'item_wings_of_haste',
		'item_aether_lens_2',
		'item_aghanims_shard',
		'item_orb_of_the_brine',
		'item_sheepstick',
		'item_black_king_bar',
		'item_ultimate_scepter_2',
		-- 最终装备
		'item_black_king_bar_2',
		'item_aeon_pendant',
		'item_refresh_core',
		'item_necronomicon_staff',
		'item_hallowed_scepter',
	},
	npc_dota_hero_dazzle = {
		-- 出门装
		'item_magic_wand',
		'item_boots',
		'item_null_talisman', -- 挂件
		'item_holy_locket',
		'item_arcane_boots',
		'item_null_talisman',
		'item_glimmer_cape',
		'item_force_staff',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_orb_of_the_brine',
		'item_aether_lens_2',
		'item_sheepstick',

		-- 最终装备
		'item_aeon_pendant',

		'item_dagon_5',
		'item_necronomicon_staff',
		'item_gungir_2',
		'item_refresh_core',
		'item_ultimate_scepter_2',
		'item_hallowed_scepter',
	},
	npc_dota_hero_death_prophet = {
		'item_magic_wand',
		'item_boots',
		'item_null_talisman',
		'item_null_talisman',
		'item_arcane_boots',
		'item_glimmer_cape',
		'item_force_staff',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_aether_lens_2',
		'item_aeon_pendant',
		'item_shivas_guard_2',
		'item_sheepstick',
		'item_ultimate_scepter_2',
		'item_refresh_core',
		'item_necronomicon_staff',
		'item_hallowed_scepter',
		'item_sacred_six_vein',
	},
	npc_dota_hero_dragon_knight = {
		'item_magic_wand',
		'item_boots',
		'item_bracer',
		'item_bracer',
		'item_armlet',
		'item_power_treads',
		'item_heavens_halberd',
		'item_wings_of_haste',
		'item_blink',
		'item_sange_and_yasha',
		'item_overwhelming_blink',
		'item_black_king_bar_2',
		-- 'item_vladmir_2',
		'item_aghanims_shard',
		'item_ultimate_scepter_2',
		'item_wasp_despotic',
		'item_moon_shard_datadriven',
		'item_wasp_callous',
		'item_jump_jump_jump',
		'item_excalibur',
		'item_satanic_2', -- 骑士剑换撒旦
		'item_vladmir_2', -- 甲壳换看情况
	},
	npc_dota_hero_drow_ranger = {
		'item_magic_wand',
		'item_boots',
		'item_wraith_band',
		'item_wraith_band',
		'item_wraith_band',
		'item_power_treads',
		'item_mask_of_madness',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_hurricane_pike_2',
		'item_butterfly',
		'item_ultimate_scepter_2',
		-- 'item_silver_edge_2',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_black_king_bar_2',
		'item_wasp_callous',
		'item_wasp_despotic',
		-- 'item_satanic_2',
		'item_excalibur',
		'item_satanic_2', -- 骑士剑换撒旦
	},
	npc_dota_hero_earthshaker = {
		'item_magic_wand',
		'item_boots',
		'item_bracer',
		'item_bracer',
		'item_arcane_boots',
		'item_force_staff',
		'item_blink',
		'item_wings_of_haste',
		'item_blade_mail', -- 刃甲
		'item_heavens_halberd',
		'item_overwhelming_blink',
		'item_echo_sabre_2',
		'item_aghanims_shard',
		'item_eternal_shroud_ultra', -- 法师泳衣
		'item_shivas_guard_2',
		'item_ultimate_scepter_2',
		'item_abyssal_blade_v2',
		'item_undying_heart',
		'item_jump_jump_jump',
		'item_refresh_core',
	},
	npc_dota_hero_jakiro = {
		'item_magic_wand',
		'item_boots',
		'item_null_talisman',
		'item_null_talisman',
		'item_arcane_boots',
		'item_glimmer_cape',
		'item_force_staff',
		'item_hand_of_group', -- 团队之手
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_aether_lens_2',
		'item_ultimate_scepter_2',
		'item_dagon_5',
		'item_shivas_guard_2',
		'item_refresh_core',
		'item_gungir_2', -- 风暴之锤
		'item_hallowed_scepter',
		'item_necronomicon_staff',
	},
	npc_dota_hero_juggernaut = {
		'item_magic_wand',
		'item_boots',
		'item_quelling_blade_2_datadriven',
		'item_wraith_band',
		'item_wraith_band',
		'item_power_treads',
		'item_orb_of_corrosion',
		'item_hand_of_group', -- 团队之手
		'item_falcon_blade',
		'item_bfury',
		'item_wings_of_haste',
		'item_echo_sabre',
		'item_basher', -- 碎骨锤
		'item_sange_and_yasha',
		'item_aghanims_shard',
		'item_black_king_bar_2',
		'item_monkey_king_bar_2',
		'item_ultimate_scepter_2',
		-- 'item_adi_king_plus',
		'item_blue_fantasy', -- 苍蓝幻想
		'item_abyssal_blade_v2',
		'item_bfury_ultra', -- 剑圣先手用先哲，看着换
		'item_jump_jump_jump',
		'item_excalibur',
	},
	npc_dota_hero_kunkka = {
		'item_magic_wand',
		'item_boots',
		'item_bracer',
		'item_bracer',
		'item_power_treads',
		'item_bracer',
		'item_armlet',
		'item_bfury',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_ultimate_scepter_2',
		'item_greater_crit',
		'item_black_king_bar_2',
		'item_vladmir_2',
		'item_moon_shard_datadriven',
		'item_abyssal_blade_v2',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_silver_edge_2',
		'item_wasp_despotic',
		'item_wasp_callous',
		'item_bloodstone',
		'item_refresh_core',
		'item_excalibur',
	},
	npc_dota_hero_lich = {
		'item_magic_wand',
		'item_boots',
		'item_null_talisman',
		'item_null_talisman',
		'item_arcane_boots',
		'item_null_talisman',
		'item_glimmer_cape',
		'item_force_staff',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_aether_lens_2',
		'item_aeon_pendant', -- 大盘子（咸鱼之王）
		'item_ultimate_scepter_2',
		'item_sheepstick',
		'item_gungir_2',
		'item_shivas_guard_2',
		'item_refresh_core',
		'item_hallowed_scepter',
		'item_necronomicon_staff',
	},
	npc_dota_hero_lina = {
		'item_magic_wand',
		'item_boots',
		'item_null_talisman',
		'item_null_talisman',
		'item_arcane_boots',
		'item_glimmer_cape',
		'item_force_staff',
		'item_hand_of_group', -- 团队之手
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_ultimate_scepter_2',
		'item_aether_lens_2',
		'item_sacred_trident',
		'item_gungir_2',
		'item_hallowed_scepter',
		'item_necronomicon_staff',
		'item_refresh_core',
		'item_shivas_guard_2',
		'item_sacred_trident',
	},
	npc_dota_hero_lion = {
		'item_magic_wand',
		'item_boots',
		'item_null_talisman',
		'item_null_talisman',
		'item_arcane_boots',
		'item_glimmer_cape',
		'item_force_staff',
		'item_hand_of_group', -- 团队之手
		'item_wings_of_haste',
		'item_blink',
		'item_aghanims_shard',
		'item_aether_lens_2', -- 以太之镜2
		'item_phylactery', -- 灵匣
		'item_ultimate_scepter_2',
		'item_dagon_5',

		'item_arcane_blink',
		'item_gungir_2',
		'item_angels_demise', -- 绝刃
		'item_necronomicon_staff',
		'item_refresh_core',
		'item_hallowed_scepter',
		'item_refresher',
	},
	npc_dota_hero_luna = {
		'item_aghanims_shard',
		'item_magic_wand',
		'item_boots',
		'item_wraith_band',
		'item_wraith_band',
		'item_power_treads',
		'item_wraith_band',
		'item_mask_of_madness',
		'item_wings_of_haste',
		'item_sange_and_yasha',
		'item_hurricane_pike_2',
		'item_monkey_king_bar_2',
		'item_ultimate_scepter_2',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_wasp_callous',
		'item_skadi_2',      -- 大冰眼
		'item_wasp_despotic',
		-- 'item_satanic_2',
		'item_satanic_2', -- 骑士剑换撒旦
		'item_excalibur',
	},
	npc_dota_hero_medusa = {
		'item_magic_wand',
		'item_boots',
		'item_wraith_band',
		'item_wraith_band',
		'item_wraith_band',
		'item_power_treads',
		'item_mask_of_madness',
		'item_aghanims_shard',
		'item_wings_of_haste',
		'item_hurricane_pike_2',
		'item_wasp_callous',
		'item_ultimate_scepter_2',
		'item_skadi_2', -- 大冰眼
		'item_black_king_bar_2',
		'item_wasp_despotic',
		'item_excalibur',
		'item_refresh_core',
	},
	npc_dota_hero_meepo = {
		'item_magic_wand',
		'item_boots',
		'item_wraith_band',
		'item_wraith_band',
		'item_power_treads',
		'item_orb_of_corrosion',
		'item_aghanims_shard',
		'item_wings_of_haste',
		'item_echo_sabre_2',
		'item_ultimate_scepter_2',
		'item_yasha_and_kaya',
		'item_black_king_bar_2',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_wasp_callous',
		'item_moon_shard_datadriven',
		'item_abyssal_blade_v2',
		'item_wasp_despotic',
		'item_jump_jump_jump',
		'item_excalibur',
	},
	npc_dota_hero_nevermore = {
		'item_magic_wand',
		'item_boots',
		'item_wraith_band',
		'item_null_talisman',
		'item_power_treads',
		'item_falcon_blade',
		'item_mask_of_madness',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_black_king_bar_2',
		'item_ultimate_scepter_2',
		'item_skadi_2',      -- 大冰眼
		'item_infernal_desolator', -- 绝对破防之刃
		'item_monkey_king_bar_2',
		'item_arcane_blink',
		'item_wasp_callous',
		'item_wasp_despotic',
		'item_excalibur',
		'item_satanic_2', -- 骑士剑换撒旦
	},
	npc_dota_hero_necrolyte = {
		'item_magic_wand',
		'item_boots',
		'item_null_talisman',
		'item_null_talisman',
		'item_holy_locket',
		'item_arcane_boots',
		'item_glimmer_cape',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_radiance_2', -- 大辉耀 圣焰之光
		'item_ultimate_scepter_2',
		'item_sheepstick',
		'item_shivas_guard_2',
		'item_undying_heart',
		'item_saint_orb',
		'item_refresh_core',
		'item_necronomicon_staff',
		-- 'item_sacred_six_vein',
		'item_kaya_and_sange_1', -- 骑士剑换回血
	},
	npc_dota_hero_ogre_magi = {
		'item_magic_wand',
		'item_boots',
		'item_null_talisman',
		'item_arcane_boots',
		'item_null_talisman',
		'item_orb_of_corrosion',
		'item_glimmer_cape',
		'item_force_staff',
		'item_wings_of_haste',
		'item_blink',
		'item_aghanims_shard',
		'item_aether_lens_2',
		'item_ultimate_scepter_2',
		'item_arcane_blink',
		'item_abyssal_blade_v2',
		'item_refresh_core',
		'item_necronomicon_staff',
		'item_angels_demise', -- 绝刃
		'item_blue_fantasy', -- 苍蓝幻想
	},
	npc_dota_hero_omniknight = {
		'item_magic_wand',
		'item_boots',
		'item_holy_locket',
		'item_arcane_boots',
		'item_vanguard',
		'item_glimmer_cape',
		'item_orb_of_the_brine',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_radiance_2', -- 大辉耀 圣焰之光
		'item_aeon_pendant',
		'item_ultimate_scepter_2',
		'item_octarine_core',
		'item_saint_orb',
		'item_insight_armor',
		'item_refresh_core',
		'item_heavens_halberd_v2',
	},
	npc_dota_hero_oracle = {
		'item_magic_wand',
		'item_boots',
		'item_holy_locket',
		'item_arcane_boots',
		'item_rod_of_atos', -- 阿托斯之棍
		'item_glimmer_cape',
		'item_force_staff',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_orb_of_the_brine',
		'item_ultimate_scepter_2',
		'item_gungir_2',
		'item_aeon_pendant',
		'item_shivas_guard_2',
		'item_necronomicon_staff',
		'item_refresh_core',
	},
	npc_dota_hero_phantom_assassin = {
		-- 出门装
		'item_magic_wand',
		'item_boots',
		'item_wraith_band',
		'item_power_treads',
		'item_wraith_band',
		-- 过度装
		'item_orb_of_corrosion',
		'item_falcon_blade',
		'item_echo_sabre',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_desolator',
		'item_basher', -- 碎骨锤
		-- 最终装备
		'item_black_king_bar_2',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_ultimate_scepter_2',
		'item_abyssal_blade_v2',
		-- 'item_satanic_2',
		'item_satanic_2', -- 骑士剑换撒旦
		'item_excalibur',
		'item_refresh_core',
	},
	npc_dota_hero_pudge = {
		'item_magic_wand',
		'item_boots',
		'item_bracer',
		'item_bracer',
		'item_arcane_boots',
		'item_vanguard',
		'item_blade_mail', -- 刃甲
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_radiance_2', -- 大辉耀 圣焰之光
		'item_aether_lens_2',
		'item_overwhelming_blink',
		'item_eternal_shroud', -- 大天堂 无锋战戟
		'item_ultimate_scepter_2',
		'item_saint_orb',
		'item_black_king_bar_2',
		'item_undying_heart',
		'item_shivas_guard_2',
		'item_moon_shard_datadriven',
		'item_abyssal_blade_v2',
	},
	-- 未启用
	npc_dota_hero_razor = {
		'item_magic_wand',
		'item_boots',
		'item_wraith_band',
		'item_wraith_band',
		'item_power_treads',
		'item_vanguard',
		'item_falcon_blade',
		'item_mask_of_madness',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_sange_and_yasha',
		'item_cyclone',
		'item_black_king_bar_2',
		'item_ultimate_scepter_2',
		'item_monkey_king_bar_2',
		'item_skadi_2', -- 大冰眼
		'item_moon_shard_datadriven',
		'item_undying_heart',
		'item_insight_armor',
		'item_wasp_callous',
		'item_wasp_despotic',
	},
	npc_dota_hero_riki = {
		'item_magic_wand',
		'item_boots',
		'item_wraith_band',
		'item_wraith_band',
		'item_power_treads',
		'item_wraith_band',
		'item_falcon_blade', -- 猎鹰战刃
		'item_echo_sabre',
		'item_basher', -- 碎骨锤
		'item_bfury',
		'item_wings_of_haste',
		'item_sange_and_yasha',
		'item_aghanims_shard',
		'item_greater_crit',
		'item_monkey_king_bar_2',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_ultimate_scepter_2',
		'item_blue_fantasy', -- 苍蓝幻想
		'item_moon_shard_datadriven',
		'item_abyssal_blade_v2',
		-- 'item_satanic_2',
		'item_sange_and_yasha_1', -- 神器·散夜对剑
		'item_excalibur',
		'item_satanic_2',   -- 骑士剑换撒旦
		'item_refresh_core',
	},
	npc_dota_hero_shadow_shaman = {
		'item_magic_wand',
		'item_boots',
		'item_null_talisman',
		'item_holy_locket',
		'item_arcane_boots',
		'item_glimmer_cape',
		'item_force_staff',
		'item_aghanims_shard',
		'item_wings_of_haste',
		'item_aether_lens_2',
		'item_blink',
		'item_ultimate_scepter_2',
		'item_aeon_pendant',
		'item_orb_of_the_brine', -- 苍洋魔珠
		'item_black_king_bar_2',
		'item_arcane_blink', -- 大智力跳
		'item_necronomicon_staff',
		'item_refresh_core',
	},
	npc_dota_hero_sand_king = {
		'item_magic_wand',
		'item_boots',
		'item_bracer',
		'item_quelling_blade_2_datadriven',
		'item_bracer',
		'item_holy_locket',
		'item_arcane_boots',
		'item_blade_mail', -- 刃甲
		'item_aether_lens_2',
		'item_blink',
		'item_saint_orb',
		'item_shivas_guard_2',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_blade_mail_2',
		'item_ultimate_scepter_2',
		'item_black_king_bar_2',
		'item_overwhelming_blink',
		'item_undying_heart',
		'item_sheepstick',
		'item_refresh_core',
		'item_moon_shard_datadriven',
		'item_jump_jump_jump',
	},
	npc_dota_hero_skywrath_mage = {
		'item_tango',
		'item_clarity',
		'item_enchanted_mango',
		'item_magic_wand',
		'item_boots',
		'item_null_talisman',
		'item_null_talisman',
		'item_arcane_boots',
		'item_rod_of_atos', -- 阿托斯之棍
		'item_glimmer_cape',
		'item_force_staff',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_ultimate_scepter_2',
		'item_sacred_trident',
		'item_angels_demise', -- 绝刃
		'item_sacred_trident',
		'item_hallowed_scepter',
		'item_necronomicon_staff',
		'item_refresher',
		'item_refresh_core',
		'item_bloodstone',
	},
	npc_dota_hero_sniper = {
		'item_magic_wand',
		'item_boots',
		'item_wraith_band',
		'item_wraith_band',
		'item_power_treads',
		'item_mask_of_madness',
		'item_maelstrom',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_sange_and_yasha',
		'item_ultimate_scepter_2',
		'item_hurricane_pike_2',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_black_king_bar_2',
		'item_shotgun_v2',
		'item_excalibur',
		'item_satanic_2', -- 骑士剑换撒旦
	},
	npc_dota_hero_sven = {
		'item_magic_wand',
		'item_boots',
		'item_bracer',
		'item_quelling_blade_2_datadriven',
		'item_power_treads',
		'item_vanguard', -- 先锋盾
		'item_falcon_blade', -- 猎鹰战刃
		'item_mask_of_madness',
		'item_wings_of_haste',
		'item_echo_sabre',
		'item_aghanims_shard',
		'item_ultimate_scepter_2',
		'item_sange_and_yasha',
		'item_black_king_bar_2',
		'item_monkey_king_bar_2',
		'item_vladmir_2',
		'item_moon_shard_datadriven',
		'item_wasp_despotic',
		'item_undying_heart',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_wasp_callous',
		'item_sacred_six_vein',
		'item_excalibur',
	},
	npc_dota_hero_skeleton_king = {
		'item_magic_wand',
		'item_boots',
		'item_bracer',
		'item_quelling_blade_2_datadriven',
		'item_bracer',
		'item_power_treads',
		'item_bracer',
		'item_echo_sabre',
		'item_armlet',
		'item_falcon_blade',
		'item_blink',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_heavens_halberd',
		'item_overwhelming_blink',
		'item_sange_and_yasha',
		'item_adi_king_plus',
		'item_jump_jump_jump',
		'item_monkey_king_bar_2',
		'item_blue_fantasy', -- 苍蓝幻想
		'item_ultimate_scepter_2',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_saint_orb',
		'item_moon_shard_datadriven',
		'item_excalibur',
	},
	npc_dota_hero_tinker = {
		'item_clarity',
		'item_clarity',
		'item_boots',
		'item_null_talisman',
		'item_glimmer_cape',
		'item_blink',
		'item_aether_lens_2',
		'item_aghanims_shard',
		'item_dagon_5',
		'item_phylactery', -- 灵匣
		'item_wings_of_haste',
		'item_sheepstick',
		'item_arcane_blink',
		'item_ultimate_scepter_2',
		'item_necronomicon_staff',
		'item_angels_demise',  -- 绝刃
		'item_hallowed_scepter',
		'item_ethereal_blade_ultra', -- 先哲换其他施法距离
		'item_blue_fantasy',   -- 苍蓝幻想
	},
	npc_dota_hero_tiny = {
		'item_magic_wand',
		'item_boots',
		'item_bracer',
		'item_quelling_blade_2_datadriven',
		'item_power_treads',
		'item_vanguard', -- 先锋盾
		'item_falcon_blade', -- 猎鹰战刃
		'item_blink',
		'item_overwhelming_blink',
		'item_wings_of_haste',
		'item_echo_sabre',
		'item_aghanims_shard',
		'item_ultimate_scepter_2',
		'item_black_king_bar_2',
		'item_vladmir_2',
		'item_moon_shard_datadriven',
		'item_saint_orb',
		'item_undying_heart',
		'item_moon_shard_datadriven',
		'item_wasp_despotic',
		'item_wasp_callous',
		'item_jump_jump_jump',
		'item_excalibur',
	},
	npc_dota_hero_vengefulspirit = {
		'item_magic_wand',
		'item_boots',
		'item_falcon_blade',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_sange_and_yasha',
		'item_desolator',
		'item_hurricane_pike_2',
		'item_ultimate_scepter_2',
		'item_monkey_king_bar_2',
		'item_wasp_callous',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_skadi_2',      -- 大冰眼
		'item_black_king_bar_2',
		'item_wasp_despotic',
		'item_excalibur',
	},
	npc_dota_hero_viper = {
		'item_magic_wand',
		'item_boots',
		'item_wraith_band',
		'item_wraith_band',
		'item_power_treads',
		'item_vanguard', -- 先锋盾
		'item_falcon_blade', -- 猎鹰战刃
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_sange_and_yasha',
		'item_hurricane_pike_2', -- 黄金魔龙枪
		'item_ultimate_scepter_2',
		'item_monkey_king_bar_2',
		-- 'item_shotgun_v2',
		'item_wasp_callous',
		'item_black_king_bar_2',
		'item_wasp_despotic',
		'item_excalibur',
		'item_refresh_core',
		'item_skadi_2', -- 极换其他属性或功能
	},
	npc_dota_hero_warlock = {
		'item_magic_wand',
		'item_boots',
		'item_holy_locket',
		'item_arcane_boots',
		'item_glimmer_cape',
		'item_force_staff',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_orb_of_the_brine',
		'item_ultimate_scepter_2',
		'item_sheepstick',
		'item_dagon_5',
		'item_hallowed_scepter',
		'item_shivas_guard_2',
		'item_refresh_core',
	},
	npc_dota_hero_windrunner = {
		'item_magic_wand',
		'item_boots',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_hand_of_group', -- 团队之手
		'item_desolator',
		'item_monkey_king_bar',
		'item_hurricane_pike_2', -- 黄金魔龙枪
		'item_black_king_bar_2',
		'item_wasp_despotic',
		'item_monkey_king_bar_2',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_ultimate_scepter_2',
		'item_skadi_2',      -- 大冰眼
		'item_wasp_callous',
	},
	npc_dota_hero_witch_doctor = {
		'item_magic_wand',
		'item_boots',
		'item_null_talisman',
		'item_null_talisman',
		'item_holy_locket',
		'item_arcane_boots',
		'item_glimmer_cape',
		'item_force_staff',
		'item_wings_of_haste',
		'item_aghanims_shard',
		'item_aether_lens_2',
		'item_ultimate_scepter_2',
		'item_orb_of_the_brine',
		'item_sheepstick',
		'item_black_king_bar_2',
		'item_gungir_2',
		'item_refresh_core',
		'item_hallowed_scepter',
		'item_necronomicon_staff',
	},
	npc_dota_hero_zuus = {
		'item_magic_wand',
		'item_boots',
		'item_null_talisman',
		'item_null_talisman',
		'item_glimmer_cape',
		'item_arcane_boots',
		'item_aghanims_shard',
		'item_aether_lens_2',
		'item_wings_of_haste',
		'item_ultimate_scepter_2',
		'item_angels_demise',
		'item_hallowed_scepter',
		'item_refresh_core',
		'item_gungir_2',
		'item_necronomicon_staff',
		'item_excalibur',
	},
}


-- sell item if has more than 8 item
-- same item only need set once
tBotItemData.sellItemList = {
	npc_dota_hero_abaddon = {
		'item_overwhelming_blink',
		'item_echo_sabre_2',
		-- local
	},
	npc_dota_hero_arc_warden = {
		'item_black_king_bar',
	},
	npc_dota_hero_axe = {
		'item_overwhelming_blink',

		-- local
	},
	npc_dota_hero_spectre = {
		'item_reaver',
	},
	npc_dota_hero_bane = {
		'item_arcane_boots',
		'item_force_staff',
	},
	npc_dota_hero_bounty_hunter = {
		'item_sange_and_yasha',
		'item_echo_sabre_2',

		-- local
		'item_mithril_hammer',
		'item_desolator',
	},
	npc_dota_hero_bloodseeker = {
		'item_sange_and_yasha',
		'item_echo_sabre_2',
		'item_mjollnir',
		-- local
		'item_mithril_hammer',
	},
	npc_dota_hero_bristleback = {
		'item_echo_sabre_2',
		'item_eternal_shroud', -- 大天堂 无锋战戟

	},
	npc_dota_hero_chaos_knight = {
		'item_sange_and_yasha',
		'item_echo_sabre_2',
	},
	npc_dota_hero_crystal_maiden = {
		'item_force_staff',
	},
	npc_dota_hero_dazzle = {
		'item_force_staff',
	},
	npc_dota_hero_death_prophet = {
		'item_force_staff',
	},
	npc_dota_hero_dragon_knight = {
		'item_heavens_halberd',
		'item_sange_and_yasha',
		'item_overwhelming_blink',
	},
	npc_dota_hero_drow_ranger = {
		'item_wraith_band',
		'item_mask_of_madness',
	},
	npc_dota_hero_earthshaker = {
		'item_force_staff',
		'item_heavens_halberd',
		'item_echo_sabre_2',
		'item_overwhelming_blink',
	},
	npc_dota_hero_jakiro = {
		'item_force_staff',
	},
	npc_dota_hero_juggernaut = {
		'item_mask_of_madness',
		'item_sange_and_yasha',
		'item_echo_sabre_2',
		'item_bfury',
	},
	npc_dota_hero_kunkka = {
		'item_black_king_bar_2',
		'item_bfury',
		'item_infernal_desolator', -- 绝对破防之刃
		'item_silver_edge_2',
	},
	npc_dota_hero_lich = {
	},
	npc_dota_hero_lina = {
	},
	npc_dota_hero_lion = {
		'item_dagon_5',
	},
	npc_dota_hero_luna = {
		'item_wraith_band',
		'item_mask_of_madness',
		'item_sange_and_yasha',
	},
	npc_dota_hero_medusa = {
		'item_mask_of_madness',
		'item_hurricane_pike_2',
		'item_abyssal_blade_v2', -- 美杜莎的智灭卖掉
	},
	npc_dota_hero_meepo = {
		'item_wraith_band',
		'item_power_treads',
		'item_echo_sabre_2',
		'item_bfury',
		'item_yasha_and_kaya',
	},
	npc_dota_hero_nevermore = {
		'item_wraith_band',
		'item_falcon_blade',
		'item_mask_of_madness',
		'item_swift_blink',
		'item_infernal_desolator', -- 绝对破防之刃
	},
	npc_dota_hero_necrolyte = {
	},
	npc_dota_hero_ogre_magi = {
		'item_overwhelming_blink',
	},
	npc_dota_hero_omniknight = {
		'item_echo_sabre_2',
	},
	npc_dota_hero_oracle = {
	},
	npc_dota_hero_phantom_assassin = {
		'item_wraith_band',
		'item_echo_sabre_2',
	},
	npc_dota_hero_pudge = {
		'item_eternal_shroud', -- 大天堂 无锋战戟
		'item_overwhelming_blink',
	},
	npc_dota_hero_razor = {
		'item_falcon_blade',
		'item_mask_of_madness',
		'item_sange_and_yasha',
		'item_cyclone',
	},
	npc_dota_hero_riki = {
		'item_wraith_band',
		'item_sange_and_yasha',
		'item_echo_sabre_2',
		'item_bfury',
		'item_greater_crit',
		'item_infernal_desolator', -- 绝对破防之刃
	},
	npc_dota_hero_shadow_shaman = {
		'item_magic_wand',
		'item_boots',
		'item_null_talisman',
		'item_arcane_boots',
		'item_glimmer_cape',
		'item_force_staff',
	},
	npc_dota_hero_sand_king = {
		'item_overwhelming_blink',
		'item_saint_orb',
	},
	npc_dota_hero_skywrath_mage = {
	},
	npc_dota_hero_sniper = {
		'item_sange_and_yasha',
		'item_maelstrom',
	},
	npc_dota_hero_sven = {
		'item_sange_and_yasha',
		'item_echo_sabre_2',
	},
	npc_dota_hero_tidehunter = {
		'item_force_staff',
	},
	npc_dota_hero_vengefulspirit = {
		'item_falcon_blade',
		'item_desolator',
	},
	npc_dota_hero_viper = {
		'item_falcon_blade',
		'item_sange_and_yasha',
	},
	npc_dota_hero_warlock = {
		'item_arcane_boots',
	},
	npc_dota_hero_windrunner = {
		'item_desolator',
	},
	npc_dota_hero_witch_doctor = {
		'item_arcane_boots',
		'item_aether_lens_2',
	},
	npc_dota_hero_skeleton_king = {
		'item_heavens_halberd',
		'item_sange_and_yasha',
		'item_echo_sabre_2',
		'item_overwhelming_blink',
	},
	npc_dota_hero_tinker = {
		'item_force_staff_3',
		'item_aether_lens_2',
	},
	npc_dota_hero_tiny = {
		'item_sange_and_yasha',
		'item_echo_sabre_2',
		'item_overwhelming_blink',
	},
	npc_dota_hero_zuus = {
	},
}

tBotItemData.sellItemCommonList = {

	-- 基础配件
	'item_orb_of_venom',    -- 淬毒之珠
	'item_slippers',        -- 敏捷便靴
	'item_mantle',          -- 智力斗篷
	'item_gauntlets',       -- 力量手套
	'item_circlet',         -- 圆环
	'item_ring_of_protection', -- 守护指环
	'item_sobi_mask',       --贤者面罩
	'item_branches',        -- 铁树枝干
	'item_magic_stick',     -- 魔棒
	'item_magic_wand',      -- 魔杖
	'item_wind_lace',       -- 风灵之纹
	'item_ring_of_basilius', -- 王者之戒
	'item_quelling_blade',  -- 补刀斧
	'item_blades_of_attack', -- 攻击之爪
	'item_chainmail',       -- 锁子甲
	'item_helm_of_iron_will', -- 铁意头盔
	'item_lifesteal',       -- 吸血面具
	'item_voodoo_mask',     -- 巫毒面具
	'item_ogre_axe',        -- 食人魔之斧
	'item_blade_of_alacrity', -- 欢欣之刃
	'item_staff_of_wizardry', -- 魔力法杖
	'item_claymore',        -- 大剑
	'item_mithril_hammer',  -- 秘银锤

	-- 消耗品
	'item_tango_single',
	'item_tango',
	'item_blood_grenade', -- 血腥榴弹
	'item_clarity',
	'item_faerie_fire',
	'item_enchanted_mango',
	'item_flask',
	'item_bottle',

	-- 配件
	'item_fluffy_hat',       -- 毛毛帽
	'item_crown',            -- 宝冠
	'item_belt_of_strength', -- 力量腰带
	'item_boots_of_elves',   -- 精灵布带
	'item_robe',             -- 法师长袍
	'item_gloves',           -- 加速手套
	'item_void_stone',       -- 虚无宝石
	'item_soul_ring',        -- 灵魂之戒
	'item_ring_of_tarrasque', -- 恐鳌之戒
	'item_headdress',        -- 恢复头巾
	'item_tiara_of_selemene', -- 赛莉蒙妮之冠
	'item_point_booster',    -- 精气之球
	'item_talisman_of_evasion', -- 闪避护符
	'item_broadsword',       -- 阔剑
	'item_platemail',        -- 板甲
	'item_hyperstone',       -- 振奋宝石
	'item_eagle',            -- 鹰歌弓
	'item_reaver',           -- 掠夺者之斧
	'item_mystic_staff',     --  神秘法杖
	'item_demon_edge',       -- 恶魔刀锋
	'item_relic',            -- 圣者遗物
	'item_disperser',        -- 散魂剑

	-- 初级道具 <1.5k
	'item_quelling_blade_2_datadriven', -- 毒瘤之刃
	'item_boots',                    -- 草鞋

	'item_bracer',                   -- 护腕
	'item_null_talisman',            -- 挂件
	'item_wraith_band',              -- 系带
	'item_buckler',                  -- 玄冥盾牌
	'item_orb_of_corrosion',         -- 腐蚀之球
	'item_pavise',                   -- 长盾

	'item_phase_boots',              -- 相位
	'item_power_treads',             -- 动力鞋
	'item_arcane_boots',             -- 秘法
	'item_tranquil_boots',           -- 绿鞋
	'item_oblivion_staff',           -- 空明杖


	-- 中级道具 1.5k~3k
	'item_travel_boots', -- 远行鞋
	'item_ghost',        -- 幽魂权杖
	'item_mask_of_madness', -- 疯狂面具
	'item_ancient_janggo', -- 韧鼓
	'item_veil_of_discord', -- 纷争
	'item_cyclone',      -- 吹风
	'item_mekansm',      -- 梅肯斯姆
	'item_falcon_blade', -- 猎鹰战刃
	'item_echo_sabre',   -- 回音刃
	'item_force_staff',  -- 推推棒
	'item_glimmer_cape', -- 微光
	'item_rod_of_atos',  -- 阿托斯之棍

	'item_kaya',         -- 慧光
	'item_sange',        -- 散华
	'item_yasha',        -- 夜叉
	'item_holy_locket',  -- 圣洁吊坠
	'item_blink',        -- 跳刀
	'item_solar_crest',  -- 炎阳纹章
	'item_blade_mail',   -- 刃甲
	'item_vanguard',     -- 先锋盾
	'item_basher',       -- 碎颅锤
	'item_armlet',       -- 臂章
	'item_hand_of_midas', -- 点金手
	'item_aether_lens',  -- 以太透镜
	'item_dragon_lance', -- 魔龙枪
	'item_aether_lens_2', -- 以太透镜2


	-- 高级道具 3k~6k
	'item_ultimate_scepter', -- A杖
	'item_desolator',     -- 黯灭
	'item_black_king_bar', -- BKB
	'item_pipe',          -- 笛子
	'item_heart',         -- 龙心
	'item_bfury',         -- 狂战斧
	'item_sheepstick',    -- 羊刀
	'item_greater_crit',  -- 大炮
	'item_sange_and_yasha', -- 散夜对剑
	'item_heavens_halberd', -- 天堂之戟
	'item_hurricane_pike', -- 飓风长戟

	'item_echo_sabre_2',  -- 音速战刃
	'item_hand_of_group', -- 团队之手

	'item_guardian_greaves', -- 卫士胫甲
	'item_assault',       -- 强袭胸甲
	'item_shivas_guard',  -- 希瓦的守护
	'item_manta',         -- 幻影斧
	'item_butterfly',     -- 蝴蝶
	'item_radiance',      -- 辉耀
	'item_satanic',       -- 撒旦
	'item_dagon_5',       -- 达贡之神力（5级）
	'item_ethereal_blade', -- 虚灵之刃
	'item_monkey_king_bar', -- 金箍棒
	'item_mjollnir',      -- 雷神之锤
	'item_octarine_core', -- 玲珑心
	'item_refresher',     -- 刷新球
	'item_silver_edge',   -- 白银之锋
	'item_phylactery',    -- 灵匣
	'item_abyssal_blade', -- 深渊之刃
	'item_harpoon',       -- 鱼叉

	-- 终极道具 6k~10k
	'item_radiance_2',        -- 大辉耀 圣焰之光
	'item_arcane_octarine_core', -- 奥术之心（大玲珑心）
	'item_monkey_king_bar_2', -- 定海神针
}

-- Consume items
tBotItemData.itemConsumeList = {
	'item_wings_of_haste',
	'item_ultimate_scepter_2',
	'item_moon_shard_datadriven',
}

tBotItemData.itemConsumeNoTargetList = {
	'item_tome_of_agility',
	'item_tome_of_strength',
	'item_tome_of_intelligence',
	'item_tome_of_luoshu',
}
-- ward setting
tBotItemData.wardHeroList = Set {
	'npc_dota_hero_bane',
	'npc_dota_hero_bounty_hunter',
	'npc_dota_hero_crystal_maiden',
	'npc_dota_hero_pudge',
	'npc_dota_hero_sand_king',
	'npc_dota_hero_lich',
	'npc_dota_hero_lion',
	'npc_dota_hero_witch_doctor',
	'npc_dota_hero_warlock',
	'npc_dota_hero_ogre_magi',
	'npc_dota_hero_oracle',
	'npc_dota_hero_shadow_shaman',
	'npc_dota_hero_dazzle',
	'npc_dota_hero_death_prophet',
	'npc_dota_hero_jakiro',
	'npc_dota_hero_lina',
	'npc_dota_hero_omniknight',
	'npc_dota_hero_riki',
	'npc_dota_hero_windrunner'
}

tBotItemData.wardObserverPostionList = {
	-- 天辉

	-- 上路
	Vector(-5856, 827, 0),
	Vector(2106, 6046, 0),
	Vector(-1998, 6113, 0),
	-- 上野区
	Vector(-5187, -1619, 0),
	Vector(-4640, -1056, 0),
	Vector(-4574, 476, 0),
	Vector(-3815, 1577, 256),
	Vector(-4620, -1060, 384),
	Vector(0, 2598, 256),
	-- 中路
	Vector(-1445, -2504, 0),
	Vector(-4526.85, -5406.58, 0),
	Vector(-5916, -3984, 0),
	Vector(-6657, -4427, 256),
	Vector(-5017, -6268, 0),
	Vector(-3545, -6958, 0),
	Vector(1037, -2023, 0),
	Vector(1290, 842, 0),
	Vector(-2567, -1743, 0),
	-- 下野区
	Vector(2800, -3087, 0),
	Vector(303, -2584, 0),
	Vector(-510, -3334, 0),
	Vector(1556, -3169, 0),
	Vector(-1233, -5087, 0),
	Vector(187, -4970, 0),
	Vector(3941, -4017, 0),
	Vector(594, -4149, 0),
	Vector(3876, -4138, 0),
	Vector(1321.6, -2288, 256),
	Vector(1045, -2041, 128),
	-- 下路
	Vector(3443, -5779, 0),
	Vector(4445, -5124, 0),
	Vector(6318, -1038, 0),

	-- 中路河道
	Vector(-1625, -200, 0),
	Vector(74, -1320, 0),
	Vector(-519, 605, 0),
	Vector(-820, -1921, 0),
	-- roshan
	Vector(-2142, 1776, 0),
	Vector(-3790, 1583, 0),
	Vector(-2675, 3296, 0),

	-- 夜魇

	-- 上路
	-- 上野区
	Vector(-758, 2033, 0),
	Vector(-512, 4094, 0),
	Vector(-2813, 3593, 0),
	Vector(-844, 3131, 0),
	Vector(-1040, 4370, 0),
	Vector(4488, 1319, 0),
	Vector(3825, 4127, 0),
	Vector(1082, 4354.0),
	Vector(-3804, 4120, 0),
	-- 中路
	Vector(2190, 4065, 0),
	Vector(4861, 5994, 0),
	Vector(6319, 4319, 0),
	Vector(1739, 1264),
	-- 下野区
	Vector(2050, -761, 0),
	Vector(2781, -1575, 0),
	Vector(4612, 768, 0),
	Vector(4024, -1056, 0),
	Vector(3923, -3441, 0),
	Vector(3240.6, 196.2, 0),
	Vector(4517, 1319, 0),
	Vector(3298, -181, 256),
	Vector(6287, -1011, 0),
	-- 下路
}
tBotItemData.wardSentryPostionList = {

	-- 天辉

	-- 上路
	Vector(-6586, -2440, 0),
	Vector(2106, 6046, 0),
	Vector(-1998, 6113, 0),
	-- 上野区
	Vector(-4347, -1028, 0),
	-- 中路
	Vector(-4511, -2582, 0),
	Vector(-3345, -4005, 0),
	Vector(-6119, -6403, 0),
	Vector(-7036, -5603, 0),
	Vector(-2073, -2417, 0),
	Vector(1290, 842, 0),
	Vector(1739, 1264, 0),
	Vector(-2567, -1743, 0),
	-- 下野区
	Vector(303, -2584, 0),
	Vector(-510, -3334, 0),
	Vector(1279, -5118, 0),
	Vector(-1233, -5087, 0),
	Vector(3239, -4273, 0),
	Vector(4540, -4320, 0),
	Vector(2671, -3418, 0),
	-- 下路
	Vector(-2945, -6087, 0),
	Vector(5664, -4000, 0),
	Vector(6435, -5472, 0),

	-- 中路河道
	Vector(-1625, -200, 0),
	Vector(74, -1320, 0),
	Vector(-519, 605, 0),
	-- roshan
	Vector(-2142, 1776, 0),
	Vector(-2273, 2628, 0),
	Vector(-3308, 3020, 0),



	-- 夜魇
	Vector(5251, 2947, 0),
	Vector(3493, 4632, 0),
	Vector(4861, 5994, 0),
	Vector(6319, 4319, 0),

	-- 上路
	Vector(-3300, 5608, 0),
	Vector(-5735, 4089, 0),
	Vector(3825, 4127, 0),
	-- 上野区
	Vector(-396, 2521, 0),
	Vector(512, 4094, 0),
	-- 中路
	Vector(-1611, 1155, 0),
	-- 下野区
	Vector(4490, -1907, 0),
	Vector(2686, -828, 0),
	Vector(4612, 768, 0),
	Vector(4359, -426, 0),
	-- 下路
	Vector(6342, 1735, 0),
	Vector(6318, -1038),
}
