ability_copy_item = class({})

function ability_copy_item:OnSpellStart()
    local caster = self:GetCaster()
    print("[ability_copy_item] OnSpellStart - Caster:", caster:GetUnitName())

    -- 开始持续施法
    self.channel_start_time = GameRules:GetGameTime()
    self.channel_duration = self:GetSpecialValueFor("channel_duration")

    print("[ability_copy_item] Channel started, duration:", self.channel_duration)
end

function ability_copy_item:OnChannelFinish(bInterrupted)
    local caster = self:GetCaster()
    local channel_time = GameRules:GetGameTime() - self.channel_start_time

    print("[ability_copy_item] OnChannelFinish - Interrupted:", bInterrupted, "Channel time:", channel_time)

    -- 检查是否被打断或施法者死亡
    if bInterrupted or not caster:IsAlive() then
        print("[ability_copy_item] Failed - Interrupted or caster dead")
        return
    end

    -- 检查是否达到最小持续时间
    if channel_time < self.channel_duration then
        print("[ability_copy_item] Failed - Channel time too short:", channel_time, "< required:", self.channel_duration)
        return
    end

    print("[ability_copy_item] Success - Starting item copy")

    local radius = self:GetSpecialValueFor("search_radius")

    -- 查找范围内所有英雄
    local heroes = FindUnitsInRadius(
        caster:GetTeamNumber(),
        caster:GetAbsOrigin(),
        nil,
        radius,
        DOTA_UNIT_TARGET_TEAM_BOTH,
        DOTA_UNIT_TARGET_HERO,
        DOTA_UNIT_TARGET_FLAG_NOT_ILLUSIONS + DOTA_UNIT_TARGET_FLAG_INVULNERABLE,
        FIND_ANY_ORDER,
        false
    )

    print("[ability_copy_item] Found heroes in radius:", #heroes)

    -- 收集所有可复制的装备
    local available_items = {}
    for _, hero in pairs(heroes) do
        if hero ~= caster then
            for i = 0, 8 do
                local item = hero:GetItemInSlot(i)
                if item and not item:IsNull() then
                    table.insert(available_items, item:GetName())
                    print("[ability_copy_item] Found item:", item:GetName(), "on hero:", hero:GetUnitName())
                end
            end
        end
    end

    print("[ability_copy_item] Total available items:", #available_items)

    -- 随机选择一件装备并复制
    if #available_items > 0 then
        local random_item = available_items[RandomInt(1, #available_items)]
        print("[ability_copy_item] Selected random item:", random_item)

        local new_item = CreateItem(random_item, caster, caster)
        if new_item then
            new_item:SetShareability(ITEM_FULLY_SHAREABLE)
            caster:AddItem(new_item)
            print("[ability_copy_item] Successfully copied item:", random_item)

            -- 特效和音效
            EmitSoundOn("DOTA_Item.PickUp", caster)
            local particle = ParticleManager:CreateParticle(
                "particles/items2_fx/teleport_end.vpcf",
                PATTACH_ABSORIGIN_FOLLOW,
                caster
            )
            ParticleManager:ReleaseParticleIndex(particle)
        else
            print("[ability_copy_item] Failed to create item:", random_item)
        end
    else
        print("[ability_copy_item] No items available to copy")
    end
end
