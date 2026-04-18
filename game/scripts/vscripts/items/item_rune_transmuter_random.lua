item_rune_transmuter_random = class({})

local rune_types = {
    "item_fusion_hawkeye",
    "item_fusion_forbidden",
    "item_fusion_brutal",
    "item_fusion_beast",
    "item_fusion_life",
    "item_fusion_shadow",
    "item_fusion_magic",
    "item_fusion_agile",
    "item_xuanwu",
    "item_zhuque",
    "item_baihu",
    "item_qinglong",
    "item_xuanwu_p",
    "item_zhuque_p",
    "item_baihu_p",
    "item_qinglong_p",
}

local rune_type_lookup = {}
for _, rune_type in pairs(rune_types) do
    rune_type_lookup[rune_type] = true
end

local function IsOwnRune(item, caster)
    local purchaser = item:GetPurchaser()
    if not purchaser then
        return false
    end

    local caster_player_id = caster:GetPlayerOwnerID()
    local purchaser_player_id = purchaser.GetPlayerOwnerID and purchaser:GetPlayerOwnerID() or -1
    if caster_player_id ~= nil and purchaser_player_id ~= nil and caster_player_id == purchaser_player_id then
        return true
    end

    return purchaser == caster
end

local function HasTransformableRune(caster)
    for i = 0, 8 do
        local item = caster:GetItemInSlot(i)
        if item and rune_type_lookup[item:GetName()] and not IsOwnRune(item, caster) then
            return true
        end
    end
    return false
end

function item_rune_transmuter_random:CastFilterResult()
    if not HasTransformableRune(self:GetCaster()) then
        return UF_FAIL_CUSTOM
    end
    return UF_SUCCESS
end

function item_rune_transmuter_random:GetCustomCastError()
    return "#dota_hud_error_no_runes"
end

function item_rune_transmuter_random:OnSpellStart()
    local caster = self:GetCaster()

    local runes_to_transform = {}

    for i = 0, 8 do
        local item = caster:GetItemInSlot(i)
        if item then
            local item_name = item:GetName()
            if rune_type_lookup[item_name] and not IsOwnRune(item, caster) then
                table.insert(runes_to_transform, { slot = i, item = item, type = item_name })
            end
        end
    end

    if #runes_to_transform == 0 then
        return
    end

    for _, rune_data in pairs(runes_to_transform) do
        caster:RemoveItem(rune_data.item)
        local new_rune = CreateItem(rune_data.type, caster, caster)
        if new_rune then
            caster:AddItem(new_rune)
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
