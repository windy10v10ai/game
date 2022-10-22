require("libraries/popups")

item_tome_of_intelligence_for_lottery = class({})
LinkLuaModifier("modifier_int_tome", "items/item_tome_of_intelligence.lua", LUA_MODIFIER_MOTION_NONE)

if IsServer() then
    function item_tome_of_intelligence_for_lottery:OnSpellStart()
        local caster = self:GetCaster()
        local int = self:GetSpecialValueFor("bonus")
        local tome_table = CustomNetTables:GetTableValue("player_tome_table", "int_tome_" .. caster:GetUnitName())
        caster:ModifyIntellect(int)
        EmitSoundOnClient("Item.TomeOfKnowledge", caster)

        if caster:HasModifier("modifier_int_tome") then
            local modifier = caster:FindModifierByName("modifier_int_tome")
            modifier:SetStackCount(modifier:GetStackCount() + 1)
            local tomeValue = 0
            if tome_table then
                tomeValue = tome_table.int
            end
            local newValue = tomeValue + int
            CustomNetTables:SetTableValue("player_tome_table", "int_tome_" .. caster:GetUnitName(), {int = newValue})
        else
            caster:AddNewModifier(caster, self, "modifier_int_tome", {})
            caster:FindModifierByName("modifier_int_tome"):SetStackCount(1)
            CustomNetTables:SetTableValue("player_tome_table", "int_tome_" .. caster:GetUnitName(), {int = int})
        end

        self:SpendCharge()
        PopupIntTome(caster, int)
    end
end
