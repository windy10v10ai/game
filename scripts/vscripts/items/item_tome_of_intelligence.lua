require("libraries/popups")

item_tome_of_intelligence = class({})
LinkLuaModifier("modifier_int_tome", "items/item_tome_of_intelligence.lua", LUA_MODIFIER_MOTION_NONE)



if IsServer() then
    function item_tome_of_intelligence:OnSpellStart()
        local caster = self:GetCaster()
        local int = self:GetSpecialValueFor("bonus")
        local tome_table = CustomNetTables:GetTableValue("player_table", "int_tome_" .. caster:GetUnitName())
        caster:ModifyIntellect(int)
        caster:EmitSound("Item.TomeOfKnowledge")

        if caster:HasModifier("modifier_int_tome") then
            local modifier = caster:FindModifierByName("modifier_int_tome")
            modifier:SetStackCount(modifier:GetStackCount() + 1)
            local tomeValue = 0
            if tome_table then
                tomeValue = tome_table.int
            end
            local newValue = tomeValue + int
            CustomNetTables:SetTableValue("player_table", "int_tome_" .. caster:GetUnitName(), {int = newValue})
        else
            caster:AddNewModifier(caster, self, "modifier_int_tome", {})
            caster:FindModifierByName("modifier_int_tome"):SetStackCount(1)
            CustomNetTables:SetTableValue("player_table", "int_tome_" .. caster:GetUnitName(), {int = int})
        end

        self:SpendCharge()
        PopupIntTome(caster, int)
    end
end



modifier_int_tome = class({})


function modifier_int_tome:RemoveOnDeath()
    return false
end

function modifier_int_tome:AllowIllusionDuplicate()
    return false
end


function modifier_int_tome:IsPermanent()
    return true
end

function modifier_int_tome:OnCreated(kv)
    if IsServer() then
        local parent = self:GetParent()
        if parent:IsIllusion() or parent:IsTempestDouble() then
            local tome_table = CustomNetTables:GetTableValue("player_table", "int_tome_" .. self:GetParent():GetUnitName())
            local mod = parent:FindModifierByName("modifier_int_tome")
            
            local tomeValue = 0
            if tome_table then
                tomeValue = tome_table.int
            end
            mod:SetStackCount(tomeValue/50)
            if parent:IsIllusion() then
                parent:ModifyIntellect(tomeValue)
            end
        end
    end
end

function modifier_int_tome:OnRefresh(kv)
    if IsServer() then
        local parent = self:GetParent()
        if parent:IsIllusion() or parent:IsTempestDouble() then
            local tome_table = CustomNetTables:GetTableValue("player_table", "int_tome_" .. self:GetParent():GetUnitName())
            local mod = parent:FindModifierByName("modifier_int_tome")
            
            local tomeValue = 0
            if tome_table then
                tomeValue = tome_table.int
            end
            mod:SetStackCount(tomeValue/50)
            if parent:IsIllusion() then
                parent:ModifyIntellect(tomeValue)
            end
        end
    end
end


function modifier_int_tome:DeclareFunctions()
	local funcs = {
        MODIFIER_PROPERTY_TOOLTIP,
    }
    return funcs
end



function modifier_int_tome:OnTooltip()
    return self:GetStackCount() * 50
end

function modifier_int_tome:GetTexture()
    return "item_tome_of_intelligence"
end
