require("libraries/popups")

item_tome_of_strength_for_lottery = class({})
LinkLuaModifier("modifier_str_tome", "items/item_tome_of_strength.lua", LUA_MODIFIER_MOTION_NONE)

if IsServer() then
    function item_tome_of_strength_for_lottery:OnSpellStart()
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
