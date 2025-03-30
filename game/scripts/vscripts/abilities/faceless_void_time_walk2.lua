faceless_void_time_walk2 = class({})

function faceless_void_time_walk2:Init()

	self.container = {}
	self:SetContextThink("think_tracker",function()
		if #self.container >= 20 then
			table.remove(self.container,1)
		end
		table.insert(self.container,self:GetCaster():GetHealth())
		-- if self:GetCaster():GetHealth()==0 then
			-- self.container = {}
		-- else
			-- table.insert(self.container,self:GetCaster():GetHealth())
		-- end
		
		return 0.1
	end,0)
end
function faceless_void_time_walk2:OnSpellStart()
	EmitSoundOn( "Hero_FacelessVoid.TimeWalk", self:GetCaster() )
	self:GetCaster():AddNewModifier(self:GetCaster(),self,"modifier_faceless_void_time_walk2_motion2",{})
	
	if self:GetCaster():GetHealth()<self.container[1] then
		self:GetCaster():SetHealth(self.container[1])
	end
end


--------------------------------------------------------------------------------------------------
modifier_faceless_void_time_walk2_motion2 = class({})
LinkLuaModifier("modifier_faceless_void_time_walk2_motion2", "abilities/faceless_void_time_walk2", LUA_MODIFIER_MOTION_HORIZONTAL)
-- 无法驱散
function  modifier_faceless_void_time_walk2_motion2:IsPurgable()return false end
function modifier_faceless_void_time_walk2_motion2:OnCreated()
	if not IsServer() then return end
	self:ApplyHorizontalMotionController()
	--向量
	self.vector = self:GetAbility():GetCursorPosition()-self:GetCaster():GetOrigin()
	--方向
	self.direction = self.vector:Normalized()
	--速度
	speed = 1800
	self:SetDuration(self.vector:Length2D()/speed,true)
	
end
--特效
function modifier_faceless_void_time_walk2_motion2:GetEffectName()
	return "particles/econ/items/faceless_void/faceless_void_arcana/faceless_void_arcana_time_walk_combined.vpcf"
end
--函数声明
function modifier_faceless_void_time_walk2_motion2:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_DISABLE_TURNING,
	}
	return funcs
end
function modifier_faceless_void_time_walk2_motion2:CheckState()
	local state = {
		[MODIFIER_STATE_INVULNERABLE] = true,
	}
	return state
end

function modifier_faceless_void_time_walk2_motion2:GetModifierDisableTurning()
	return 1
end
--横向运动器
function modifier_faceless_void_time_walk2_motion2:UpdateHorizontalMotion(me,dt)
	local pos = me:GetOrigin() + self.direction * speed * dt
	me:SetOrigin(pos)
end

function modifier_faceless_void_time_walk2_motion2:OnHorizontalMotionInterrupted()
	self:Destroy()
end

