LinkLuaModifier("modifier_ogre_magi_multicast_lua", "abilities/ogre_magi_multicast_lua.lua", LUA_MODIFIER_MOTION_NONE)
--Abilities
if ogre_magi_multicast_lua == nil then
	ogre_magi_multicast_lua = class({})
end
function ogre_magi_multicast_lua:GetIntrinsicModifierName()
	return "modifier_ogre_magi_multicast_lua"
end

function ogre_magi_multicast_lua:Precache(context)
	PrecacheResource("particle", "particles/econ/items/ogre_magi/ogre_magi_jackpot/ogre_magi_jackpot_multicast.vpcf",
		context)
end

---------------------------------------------------------------------
--Modifiers
if modifier_ogre_magi_multicast_lua == nil then
	modifier_ogre_magi_multicast_lua = class({})
end

function modifier_ogre_magi_multicast_lua:DeclareFunctions()
	local funcs =
	{
		MODIFIER_EVENT_ON_ABILITY_EXECUTED,
	}
	return funcs
end

--隐藏
function modifier_ogre_magi_multicast_lua:IsHidden() return true end

--无法驱散
function modifier_ogre_magi_multicast_lua:IsPurgable() return false end

--永久
function modifier_ogre_magi_multicast_lua:IsPermanent() return true end

--当施法时
--造成崩溃：灵动迅捷，斧王大，蓝胖的引燃，毒龙大
--特效残留：死亡先知-地穴虫群，锤妹的丢锤子，
--待确认：军团-压倒性优势-特效残留，黑鸟-奥数天球多重有点op，
--可能导致英雄消失：SV锤子，死灵法师-魔晶，
no_support_abilitys = {
	-- 卡尔
	invoker_quas = 1,
	invoker_wex = 1,
	invoker_exort = 1,
	invoker_invoke = 1,
	invoker_alacrity = 1,
	invoker_alacrity_ad = 1,
	invoker_forge_spirit = 1,
	axe_culling_blade = 1,
	ogre_magi_ignite = 1,
	viper_viper_strike = 1,
	death_prophet_carrion_swarm = 1,
	obsidian_destroyer_arcane_orb = 1,
	ancient_apparition_frost_seal = 1,     -- 冰霜封印
	terrorblade_reflection = 1,            -- 倒影
	terrorblade_metamorphosis = 1,         -- 魔化
	vengefulspirit_nether_swap = 1,        -- 移形换位
	terrorblade_sunder = 1,                -- 魂断
	pudge_rot = 1,                         -- 腐肉
	winter_wyvern_arctic_burn = 1,         -- 严寒灼烧
	kez_switch_weapons = 1,                -- 流派变换 凯
	faceless_void_time_walk = 1,           -- 时间漫游
	faceless_void_time_walk_reverse = 1,   -- 反时间漫游
	rubick_spell_steal = 1,                -- 技能窃取
	magnataur_skewer = 1,                  -- 巨角冲撞
	ember_spirit_sleight_of_fist = 1,      -- 无影拳
	goku_kaioken = 1,                      -- 界王拳
	doom_bringer_doom = 1,                 -- 末日
	tusk_snowball = 1,                     -- 雪球
	tiny_tree_channel = 1,                 -- 树木连掷
	shredder_chakram = 1,                  -- 锯齿飞轮
	shredder_twisted_chakram = 1,          -- 锯齿飞轮
	yukari_moon_portal = 1,                -- 八云紫 3技能
	yukari_twin_trains = 1,                -- 八云紫 大招
	storm_spirit_ball_lightning = 1,       --  球状闪电
	phantom_assassin_phantom_strike = 1,   --  幻影突袭
	earthshaker_enchant_totem = 1,         --  强化图腾
	wisp_tether = 1,                       -- 羁绊
	dawnbreaker_celestial_hammer = 1,      -- 上界重锤
	nyx_assassin_burrow = 1,               -- 钻地
	nyx_assassin_unburrow = 1,             -- 现身
	ancient_apparition_ice_blast = 1,      -- 冰晶爆轰
	ancient_apparition_ice_blast_release = 1, -- 冰晶爆轰
	elder_titan_ancestral_spirit = 1,      -- 灵体游魂
	primal_beast_onslaught = 1,            -- 獸 突
	hoodwink_sharpshooter = 1,             -- 一箭穿心
	hoodwink_sharpshooter_release = 1,     -- 一箭穿心
}
no_support_items = {
	-- 消耗品
	item_clarity = 1,
	item_blood_grenade = 1, -- 血腥榴弹
	item_flask = 1,
	item_dust = 1,
	item_bottle = 1,
	item_refresher_shard = 1,
	item_smoke_of_deceit = 1,
	item_cheese = 1,
	item_moon_shard_datadriven = 1,
	item_ultimate_scepter_2 = 1,
	item_consumable_gem = 1,
	item_wings_of_haste = 1,
	item_candy_candy = 1,
	item_repair_kit = 1,
	-- 跳刀 影刀
	item_jump_jump_jump = 1,
	item_fallen_sky = 1,
	item_invis_sword = 1,
	item_silver_edge = 1,
	item_silver_edge_2 = 1,
	item_demonicon = 1, -- 死灵书
	item_power_treads = 1, -- 动力鞋
}
no_support_substrings = {
	"mango",
	"faerie_fire",
	"item_ward",
	"item_tango",
	"tome",
	"blink",
	"black_king_bar",
	"item_manta",
	"item_force_staff",
	"item_hurricane_pike",
	"item_seer_stone",

	"phoenix",
}

function modifier_ogre_magi_multicast_lua:OnAbilityExecuted(keys)
	if keys.unit ~= self:GetParent() then
		-- 不是自己施法
		return nil
	end
	local ability = keys.ability
	local abilityName = ability:GetName()
	-- ✅ 新增：如果技能被蝴蝶效应触发，不触发多重施法
	if ability.butterfly_triggered then
		return nil
	end
	--不支持技能池
	if no_support_abilitys[abilityName] then
		print("no_support_abilitys" .. abilityName)
		return nil
	end
	if no_support_items[abilityName] then
		print("no_support_items" .. abilityName)
		return nil
	end
	for _, s in ipairs(no_support_substrings) do
		if string.find(abilityName, s) then
			print("no_support_substrings" .. abilityName)
			return nil
		end
	end
	-- 不支持持续释放技能
	if IsAbilityBehavior(ability:GetBehavior(), DOTA_ABILITY_BEHAVIOR_CHANNELLED) then
		return nil
	end

	--如果本次施法是多重
	if ability.multicast and ability.multicast > 1 then
		return nil
	end

	local random_int = RandomInt(1, 100)

	local multicast_2_times = self:GetAbility():GetSpecialValueFor("multicast_2_times")
	local multicast_3_times = self:GetAbility():GetSpecialValueFor("multicast_3_times")
	local multicast_4_times = self:GetAbility():GetSpecialValueFor("multicast_4_times")

	if random_int <= multicast_4_times then
		ability.multicast = 4
		EmitSoundOn("Hero_OgreMagi.Fireblast.x3", keys.unit)
		local particle = ParticleManager:CreateParticle(
			"particles/econ/items/ogre_magi/ogre_magi_jackpot/ogre_magi_jackpot_multicast.vpcf",
			PATTACH_OVERHEAD_FOLLOW,
			keys.unit)
		ParticleManager:SetParticleControl(particle, 1, Vector(4, 1, 1))
		ParticleManager:ReleaseParticleIndex(particle)
	elseif random_int <= multicast_3_times then
		ability.multicast = 3
		EmitSoundOn("Hero_OgreMagi.Fireblast.x2", keys.unit)
		local particle = ParticleManager:CreateParticle(
			"particles/econ/items/ogre_magi/ogre_magi_jackpot/ogre_magi_jackpot_multicast.vpcf",
			PATTACH_OVERHEAD_FOLLOW,
			keys.unit)
		ParticleManager:SetParticleControl(particle, 1, Vector(3, 1, 1))
		ParticleManager:ReleaseParticleIndex(particle)
	elseif random_int <= multicast_2_times then
		ability.multicast = 2
		EmitSoundOn("Hero_OgreMagi.Fireblast.x1", keys.unit)
		local particle = ParticleManager:CreateParticle(
			"particles/econ/items/ogre_magi/ogre_magi_jackpot/ogre_magi_jackpot_multicast.vpcf",
			PATTACH_OVERHEAD_FOLLOW,
			keys.unit)
		ParticleManager:SetParticleControl(particle, 1, Vector(2, 1, 1))
		ParticleManager:ReleaseParticleIndex(particle)
	else
		--非多重
		ability.multicast = 1
		return nil
	end

	local multicastDelay = self:GetAbility():GetSpecialValueFor("multicast_delay")

	local target = keys.target
	local pos = ability:GetCursorPosition()

	--设置目标再次施法
	ability:SetContextThink("think_multicast", function()
		-- 记忆当前cursor position target
		local cursorPositionBeforeCast = keys.unit:GetCursorPosition()

		if IsHeroUncontrollable(keys.unit) then
			ability.multicast = nil
			return nil
		end

		-- 英雄持续施法时 不触发多重
		if keys.unit:IsChanneling() then
			ability.multicast = nil
			return nil
		end

		-- 充能技能
		if ability:GetMaxAbilityCharges(ability:GetLevel()) > 0 then
			if ability:IsItem() then
				ability:SetCurrentCharges(ability:GetCurrentCharges() + 1)
			else
				ability:SetCurrentAbilityCharges(ability:GetCurrentAbilityCharges() + 1)
			end
		end
		--设置目标

		-- 指向性技能 向周围随机目标施法
		if IsAbilityBehavior(ability:GetBehavior(), DOTA_ABILITY_BEHAVIOR_UNIT_TARGET) then
			local units = FindUnitsInRadius(keys.unit:GetTeamNumber(), pos, nil, ability:GetCastRange(pos, nil),
				ability:GetAbilityTargetTeam(), ability:GetAbilityTargetType(),
				ability:GetAbilityTargetFlags() + DOTA_UNIT_TARGET_FLAG_CAN_BE_SEEN,
				FIND_ANY_ORDER, false)
			if #units > 0 then
				target = units[RandomInt(1, #units)]
				pos = target:GetAbsOrigin()
			end
		end

		-- 施法
		ability:EndCooldown()
		keys.unit:SetCursorCastTarget(target)
		keys.unit:SetCursorPosition(pos)
		keys.unit:CastAbilityImmediately(ability, 0)
		-- 施法结束后
		-- 返还魔法
		keys.unit:GiveMana(ability:GetManaCost(-1))
		-- 还原cursor position target
		keys.unit:SetCursorPosition(cursorPositionBeforeCast)

		ability.multicast = ability.multicast - 1
		if ability.multicast <= 1 then
			ability.multicast = nil
		else
			return multicastDelay
		end
	end, multicastDelay)
end
