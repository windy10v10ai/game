ancient_apparition_frost_orb = class({})


function ancient_apparition_frost_orb:OnSpellStart()
	
end
--被动
function ancient_apparition_frost_orb:GetIntrinsicModifierName()
	return "modifier_ancient_apparition_frost_orb"
end


------------------------------------------------------------------------------
modifier_ancient_apparition_frost_orb = class({})
LinkLuaModifier("modifier_ancient_apparition_frost_orb", "abilities/ancient_apparition_frost_orb", LUA_MODIFIER_MOTION_NONE)

-- 无法驱散
function  modifier_ancient_apparition_frost_orb:IsPurgable()return false end
function modifier_ancient_apparition_frost_orb:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_EVENT_ON_ATTACK,
		MODIFIER_PROPERTY_PROJECTILE_NAME,
		MODIFIER_EVENT_ON_ATTACK_LANDED
	}
	return funcs
end
--当创建
function modifier_ancient_apparition_frost_orb:OnCreated(keys)
	self.container = {} --容器记录攻击编号
end
--当攻击完成
function  modifier_ancient_apparition_frost_orb:OnAttack(keys)
	if keys.attacker == self:GetParent() then
		if self:GetStackCount()<=self:GetAbility():GetSpecialValueFor("attack_count")-2 then
			self:IncrementStackCount()
		else
			-- print(#self.container)
			if #self.container >= 10 then
				table.remove(self.container,1)
			end
			table.insert(self.container,keys.record)
			self:SetStackCount(0)
		end
	end
end
function  modifier_ancient_apparition_frost_orb:GetModifierProjectileName(keys)
	if self:GetStackCount()==self:GetAbility():GetSpecialValueFor("attack_count")-1 then
		return "particles/units/heroes/hero_ancient_apparition/ancient_apparition_chilling_touch_projectile.vpcf"
	end
end
function  modifier_ancient_apparition_frost_orb:OnAttackLanded(keys)
	if keys.attacker == self:GetParent() then
		for k,v in ipairs(self.container) do
			if v == keys.record then
				-- local particle = ParticleManager:CreateParticle("particles/generic_gameplay/lasthit_coins.vpcf",PATTACH_HEALTHBAR,self:GetParent())
				-- ParticleManager:SetParticleControl( particle,1, keys.target:GetOrigin())
				keys.target:AddNewModifier(self:GetCaster(),self:GetAbility(),"modifier_ancient_apparition_frost_orb_slow",{duration=self:GetAbility():GetSpecialValueFor("slow_duration")})
				--搜寻单位
				local caster = self:GetCaster()
				local units = FindUnitsInRadius(caster:GetTeamNumber(),keys.target:GetOrigin(),nil,self:GetAbility():GetSpecialValueFor("radius"),DOTA_UNIT_TARGET_TEAM_ENEMY,DOTA_UNIT_TARGET_BASIC+1,48,FIND_ANY_ORDER,false)
				for k,v in pairs(units)do
					--造成伤害
					local damage = self:GetAbility():GetSpecialValueFor("damage")+self:GetCaster():GetAverageTrueAttackDamage(nil)*self:GetAbility():GetSpecialValueFor("ad")
					local damageInfo ={victim = v,attacker = caster,damage = damage,damage_type = DAMAGE_TYPE_MAGICAL,ability = self:GetAbility()}
					ApplyDamage( damageInfo )
				end
				
				break
			end
		end
	end
end

------------------------------------------------------------------------------
modifier_ancient_apparition_frost_orb_slow = class({})
LinkLuaModifier("modifier_ancient_apparition_frost_orb_slow", "abilities/ancient_apparition_frost_orb", LUA_MODIFIER_MOTION_NONE)

--函数声明
function modifier_ancient_apparition_frost_orb_slow:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
	}
	return funcs
end

--移速
function modifier_ancient_apparition_frost_orb_slow:GetModifierMoveSpeedBonus_Percentage()
	return -90
end