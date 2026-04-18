item_rune_transmuter_advanced = class({})

local rune_types = {
    "item_fusion_hawkeye",
    "item_fusion_forbidden",
    "item_fusion_brutal",
    "item_fusion_beast",
    "item_fusion_life",
    "item_fusion_shadow",
    "item_fusion_magic",
    "item_fusion_agile",
}

local rune_type_lookup = {}
for _, rune_type in pairs(rune_types) do
    rune_type_lookup[rune_type] = true
end

local function HasTransformableRune(caster)
    for i = 0, 8 do
        local item = caster:GetItemInSlot(i)
        if item and rune_type_lookup[item:GetName()] then
            return true
        end
    end
    return false
end

function item_rune_transmuter_advanced:CastFilterResult()
    if not HasTransformableRune(self:GetCaster()) then
        return UF_FAIL_CUSTOM
    end
    return UF_SUCCESS
end

function item_rune_transmuter_advanced:GetCustomCastError()
    return "#dota_hud_error_no_runes"
end

function item_rune_transmuter_advanced:OnSpellStart()
    local caster = self:GetCaster()

    local runes_to_transform = {}
    local owned_rune_types = {}

    for i = 0, 8 do
        local item = caster:GetItemInSlot(i)
        if item then
            local item_name = item:GetName()
            for _, rune_type in pairs(rune_types) do
                if item_name == rune_type then
                    table.insert(runes_to_transform, { slot = i, item = item, type = item_name })
                    owned_rune_types[item_name] = true
                    break
                end
            end
        end
    end

    if #runes_to_transform == 0 then
        return
    end

    for _, rune_data in pairs(runes_to_transform) do
        local available_runes = {}
        for _, rune_type in pairs(rune_types) do
            if rune_type ~= rune_data.type and not owned_rune_types[rune_type] then
                table.insert(available_runes, rune_type)
            end
        end

        local target_rune
        if #available_runes > 0 then
            target_rune = available_runes[RandomInt(1, #available_runes)]
        else
            local different_runes = {}
            for _, rune_type in pairs(rune_types) do
                if rune_type ~= rune_data.type then
                    table.insert(different_runes, rune_type)
                end
            end
            target_rune = different_runes[RandomInt(1, #different_runes)]
        end

        caster:RemoveItem(rune_data.item)
        local new_rune = CreateItem(target_rune, caster, caster)
        if new_rune then
            caster:AddItem(new_rune)
            owned_rune_types[target_rune] = true
        end
    end

    EmitSoundOn("Item.TomeOfKnowledge", caster)
    local particle = ParticleManager:CreateParticle(
        "particles/items2_fx/hand_of_midas.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        caster
    )
    ParticleManager:ReleaseParticleIndex(particle)

    self:SpendCharge(1)
end
