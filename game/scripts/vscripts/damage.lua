
    DAMAGE_INCREASE_TYPE_STR = 1
    DAMAGE_INCREASE_TYPE_AGI = 2
    DAMAGE_INCREASE_TYPE_INT = 3

	--接口
	--[[

		"RunScript"
		{
			"ScriptFile"		"scripts/vscripts/abilities/xxx.lua"
			"Function"			"xxx"
			"damage_base"		"0"									//固定的基础伤害(默认0)
			"damage_increase"	"1"									//伤害系数(默认1)
			"damage_increase_type" "1"                              //加成类型,默认为0（无） 1=力量 2=敏捷 3=智力
			"damage_type"		"DAMAGE_TYPE_PURE"					//伤害类型(默认纯粹)
		}
		
        function XXX(keys)		
		
		    UnitDamageTarget(keys)
			
		end
		
	]]
		



	--全局Damage表
	Damage = {}

	local Damage = Damage

	setmetatable(Damage, Damage)

	--伤害表的默认值
	Damage.damage_meta = {
		__index = {
			attacker 			= nil, 						--伤害来源
			victim 				= nil, 						--伤害目标
			damage				= 0,						--伤害
			damage_type			= DAMAGE_TYPE_PURE,			--伤害类型,不写的话是纯粹伤害
			damage_flags 		= 1, 						--伤害标记
		},
	}
	
	function UnitDamageTargetTemplate(keys)
		local targets	= keys.target_entities	--技能施放目标(数组)

		if not targets then
			print(debug.traceback '无伤害目标！')
		end
		
		--添加默认值
		setmetatable(damage, Damage.damage_meta)
		
		
		--获取技能传参,构建伤害table
		damage.attacker				= EntIndexToHScript(keys.caster_entindex)						--伤害来源(施法者)
		
		if not attacker then
			print(debug.traceback '找不到施法者！')
		end
		
		--获取伤害类型
		damage.damage_type          = keys.damage_type
		
		--判断属性类型，获取单位身上加成的属性
		local attribute             = 0
		
		if (keys.damage_increase_type == DAMAGE_INCREASE_TYPE_STR) then
			--力量增量
			attribute = keys.attacker:GetStrength()
			
		elseif (keys.damage_increase_type == DAMAGE_INCREASE_TYPE_AGI) then
		    --敏捷增量
		    attribute = keys.attacker:GetAgility()
			
		elseif (keys.damage_increase_type == DAMAGE_INCREASE_TYPE_INT) then
		    --智力增量
		    attribute = keys.attacker:GetIntellect()
			
		end
		          
		
		--根据公式计算出伤害
		--伤害系数 * (力量 * 力量系数 + 敏捷 * 敏捷系数 + 智力 * 智力系数)
		local damageResult     		=  attribute * keys.damage_increase + keys.damage_base
		
		--遍历数组进行伤害
		for i, victim in ipairs(targets) do
	        damage.victim 		= victim
			damage.damage 		= damageResult
			
			ApplyDamage(damage)
		end
		
    end
	
	function UnitDamageTarget(DamageTable)
		local dDamage = vlua.clone(DamageTable)
		local victim = dDamage.victim or dDamage.target
		if victim == nil or victim:IsNull() then return end
		if(victim:IsNightmared())then
			victim:RemoveModifierByName("modifier_bane_nightmare")
		end
		--[[if dDamage.attacker:HasItemInInventory("item_bagua") then
							dDamage.damage = dDamage.damage * 1.25
						end]]
		--[[if dDamage.attacker:HasModifier("modifier_thdots_patchouli_xianzhezhishi_sun") then
							dDamage.damage = dDamage.damage * 1.1
						end]]

		-- 破魔驱散绿坝的盾
		-- if dDamage.attacker:HasItemInInventory("item_pomojinlingli") and dDamage.damage_type == DAMAGE_TYPE_MAGICAL then
		-- 	if victim:HasModifier("modifier_item_green_dam_barrier") then
		-- 		victim:RemoveModifierByName("modifier_item_green_dam_barrier")
		-- 	end
		-- end
		
		if dDamage.damage_type == DAMAGE_TYPE_PURE and dDamage.damage >= 100 then
			SendOverheadEventMessage(nil,OVERHEAD_ALERT_DAMAGE,victim,dDamage.damage,nil)
		end
		return ApplyDamage(dDamage)
	end

	-- 原版伤害
	-- function UnitDamageTarget(DamageTable)
	-- 	local dDamage = vlua.clone(DamageTable)
	-- 	if(dDamage.victim:IsNightmared())then
	-- 		dDamage.victim:RemoveModifierByName("modifier_bane_nightmare")
	-- 	end
	-- 	--[[if dDamage.attacker:HasItemInInventory("item_bagua") then
	-- 						dDamage.damage = dDamage.damage * 1.25
	-- 					end]]
	-- 	--[[if dDamage.attacker:HasModifier("modifier_thdots_patchouli_xianzhezhishi_sun") then
	-- 						dDamage.damage = dDamage.damage * 1.1
	-- 					end]]
	-- 	if dDamage.attacker:HasItemInInventory("item_pomojinlingli") and dDamage.damage_type == DAMAGE_TYPE_MAGICAL then
	-- 		print("--------------")
	-- 		print(dDamage.victim:HasModifier("modifier_item_green_dam_barrier"))
	-- 		if dDamage.victim:HasModifier("modifier_item_green_dam_barrier") then
	-- 			dDamage.victim:RemoveModifierByName("modifier_item_green_dam_barrier")
	-- 		end
	-- 	end
	-- 	return ApplyDamage(dDamage)
	-- end