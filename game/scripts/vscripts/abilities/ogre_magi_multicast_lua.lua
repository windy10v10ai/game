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
no_support_abilitys = { axe_culling_blade = 1, death_prophet_carrion_swarm = 1, enigma_black_hole = 1, invoker_alacrity = 1, invoker_alacrity_ad = 1, obsidian_destroyer_arcane_orb = 1, ogre_magi_ignite = 1, viper_viper_strike = 1 }

function modifier_ogre_magi_multicast_lua:OnAbilityExecuted(keys)
	--如果是小技能，非装备
	if keys.unit == self:GetParent() and not keys.ability:IsItem() then
		--不支持技能池
		--小松鼠大，大锤 丢锤子，冰魂大,伐木机飞盘,大牛 魂，雪球
		if no_support_abilitys[keys.ability:GetName()] then
			return nil
		end

		--如果本次施法是多重
		if keys.ability.multicast == true then
			keys.ability.multicast = false
			return nil
		end

		local random_int = RandomInt(1, 100)
		--非多重
		if random_int <= 100 then
			keys.ability.multicast = true

			EmitSoundOn("Hero_OgreMagi.Fireblast.x1", keys.unit)
			local particle = ParticleManager:CreateParticle(
				"particles/econ/items/ogre_magi/ogre_magi_jackpot/ogre_magi_jackpot_multicast.vpcf",
				PATTACH_OVERHEAD_FOLLOW,
				keys.unit)
			ParticleManager:SetParticleControl(particle, 1, Vector(2, 1, 1))

			local pos = keys.ability:GetCursorPosition()
			--设置目标再次施法
			keys.ability:SetContextThink("think_multicast", function()
				keys.ability:EndCooldown()
				--设置目标
				keys.unit:SetCursorCastTarget(keys.target)
				keys.unit:SetCursorPosition(pos)
				keys.unit:CastAbilityImmediately(keys.ability, 0)
			end, 0.2)
		end
	end
end
