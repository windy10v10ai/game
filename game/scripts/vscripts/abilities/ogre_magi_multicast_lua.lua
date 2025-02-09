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
--造成崩溃：斧王大，卡尔-buff，蓝胖的引燃，毒龙大
--特效残留：死亡先知-地穴虫群，锤妹的丢锤子，
--无法取消：谜团大,伐木机大招，术士的剧变
--待确认：军团-压倒性优势-特效残留，黑鸟-奥数天球多重有点op，
--可能导致英雄消失：SV锤子，死灵法师-魔晶，
no_support_abilitys = {
	axe_culling_blade = 1,
	death_prophet_carrion_swarm = 1,
	enigma_black_hole = 1,
	invoker_alacrity = 1,
	invoker_alacrity_ad = 1,
	obsidian_destroyer_arcane_orb = 1,
	ogre_magi_ignite = 1,
	viper_viper_strike = 1
}
no_support_items = {
	item_fallen_sky = 1
}
no_support_substrings = {
	"black_king_bar",
	"blink",
}

function modifier_ogre_magi_multicast_lua:OnAbilityExecuted(keys)
	if keys.unit ~= self:GetParent() then
		-- 不是自己施法
		return nil
	end
	local ability = keys.ability
	local abilityName = ability:GetName()
	--不支持技能池
	if no_support_abilitys[abilityName] then
		return nil
	end
	if no_support_items[abilityName] then
		return nil
	end
	for _, s in ipairs(no_support_substrings) do
		if string.find(abilityName, s) then
			return nil
		end
	end

	--如果本次施法是多重
	if ability.multicast == true then
		ability.multicast = false
		return nil
	end

	local random_int = RandomInt(1, 100)
	--非多重
	-- TODO 修改概率
	if random_int <= 100 then
		ability.multicast = true

		EmitSoundOn("Hero_OgreMagi.Fireblast.x1", keys.unit)
		local particle = ParticleManager:CreateParticle(
			"particles/econ/items/ogre_magi/ogre_magi_jackpot/ogre_magi_jackpot_multicast.vpcf",
			PATTACH_OVERHEAD_FOLLOW,
			keys.unit)
		ParticleManager:SetParticleControl(particle, 1, Vector(2, 1, 1))

		local pos = ability:GetCursorPosition()
		--设置目标再次施法
		ability:SetContextThink("think_multicast", function()
			-- can cast ability
			if not ability:IsFullyCastable() then
				return 0.1
			end
			ability:EndCooldown()
			-- 充能技能
			if ability:GetMaxAbilityCharges(ability:GetLevel()) > 0 then
				ability:SetCurrentAbilityCharges(ability:GetCurrentAbilityCharges() + 1)
			end
			--设置目标
			keys.unit:SetCursorCastTarget(keys.target)
			keys.unit:SetCursorPosition(pos)
			keys.unit:CastAbilityImmediately(ability, 0)
			-- 返还魔法
			keys.unit:GiveMana(ability:GetManaCost(-1))
		end, 0.6)
	end
end
