require("libraries/popups")

item_tome_of_strength = class({})
LinkLuaModifier("modifier_str_tome", "items/item_tome_of_strength.lua", LUA_MODIFIER_MOTION_NONE)



if IsServer() then
    function item_tome_of_strength:OnSpellStart()
        local caster = self:GetCaster()
        local str = self:GetSpecialValueFor("bonus")
        local tome_table = CustomNetTables:GetTableValue("player_table", "str_tome_" .. caster:GetUnitName())
        caster:ModifyStrength(str)
        EmitSoundOnClient("Item.TomeOfKnowledge", caster)

        if caster:HasModifier("modifier_str_tome") then
            local modifier = caster:FindModifierByName("modifier_str_tome")
            modifier:SetStackCount(modifier:GetStackCount() + 1)
            local tomeValue = 0
            if tome_table then
                tomeValue = tome_table.str
            end
            local newValue = tomeValue + str
            CustomNetTables:SetTableValue("player_table", "str_tome_" .. caster:GetUnitName(), {str = newValue})
        else
            caster:AddNewModifier(caster, self, "modifier_str_tome", {})
            caster:FindModifierByName("modifier_str_tome"):SetStackCount(1)
            CustomNetTables:SetTableValue("player_table", "str_tome_" .. caster:GetUnitName(), {str = str})
        end

        self:SpendCharge()
        PopupStrTome(caster, str)
    end
end



modifier_str_tome = class({})


function modifier_str_tome:RemoveOnDeath()
    return false
end

function modifier_str_tome:AllowIllusionDuplicate()
    return false
end


function modifier_str_tome:IsPermanent()
    return true
end

function modifier_str_tome:OnCreated(kv)
    if IsServer() then
        local parent = self:GetParent()
        if parent:IsIllusion() or parent:IsTempestDouble() then
            local tome_table = CustomNetTables:GetTableValue("player_table", "str_tome_" .. self:GetParent():GetUnitName())
            local mod = parent:FindModifierByName("modifier_str_tome")
            local tomeValue = 0
            if tome_table then
                tomeValue = tome_table.str
            end
            mod:SetStackCount(tomeValue/50)
            if parent:IsIllusion() then
                parent:ModifyStrength(tomeValue)
            end
        end
    end
end

function modifier_str_tome:OnRefresh(kv)
    if IsServer() then
        local parent = self:GetParent()
        if parent:IsIllusion() or parent:IsTempestDouble() then
            local tome_table = CustomNetTables:GetTableValue("player_table", "str_tome_" .. self:GetParent():GetUnitName())
            local mod = parent:FindModifierByName("modifier_str_tome")
            local tomeValue = 0
            if tome_table then
                tomeValue = tome_table.str
            end
            mod:SetStackCount(tomeValue/50)
            if parent:IsIllusion() then
                parent:ModifyStrength(tomeValue)
            end
        end
    end
end

function modifier_str_tome:DeclareFunctions()
	local funcs = {
        MODIFIER_PROPERTY_TOOLTIP,
    }
    return funcs
end



function modifier_str_tome:OnTooltip()
    return self:GetStackCount() * 50
end

function modifier_str_tome:GetTexture()
    return "item_tome_of_strength"
end
