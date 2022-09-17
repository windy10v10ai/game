require("libraries/popups")

item_tome_of_agility_for_lottery = class({})
LinkLuaModifier("modifier_agi_tome", "items/item_tome_of_agility.lua", LUA_MODIFIER_MOTION_NONE)

if IsServer() then
    function item_tome_of_agility_for_lottery:OnSpellStart()
        local caster = self:GetCaster()
        local agi = self:GetSpecialValueFor("bonus")
        local tome_table = CustomNetTables:GetTableValue("player_table", "agi_tome_" .. caster:GetUnitName())
        caster:ModifyAgility(agi)
        EmitSoundOnClient("Item.TomeOfKnowledge", caster)

        if caster:HasModifier("modifier_agi_tome") then
            local modifier = caster:FindModifierByName("modifier_agi_tome")
            modifier:SetStackCount(modifier:GetStackCount() + 1) -- + agi
            
            local tomeValue = 0
            if tome_table then
                tomeValue = tome_table.agi
            end
            local newValue = tomeValue + agi
            CustomNetTables:SetTableValue("player_table", "agi_tome_" .. caster:GetUnitName(), {agi = newValue})
        else
            caster:AddNewModifier(caster, self, "modifier_agi_tome", {})
            caster:FindModifierByName("modifier_agi_tome"):SetStackCount(1) -- (agi)
            CustomNetTables:SetTableValue("player_table", "agi_tome_" .. caster:GetUnitName(), {agi = agi})
        end

        self:SpendCharge()
        PopupAgiTome(caster, agi)
    end
end
