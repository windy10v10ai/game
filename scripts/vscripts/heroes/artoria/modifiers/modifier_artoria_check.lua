modifier_artoria_check = class ({})

function modifier_artoria_check:IsHidden() return true end
function modifier_artoria_check:IsDebuff() return false end
function modifier_artoria_check:IsPurgable() return false end
function modifier_artoria_check:IsPurgeException() return false end
function modifier_artoria_check:RemoveOnDeath() return false end

function modifier_artoria_check:OnCreated()
    if IsServer() then
        self:StartIntervalThink(FrameTime())
    end
end
function modifier_artoria_check:OnRefresh()
    if IsServer() then

    end
end

function modifier_artoria_check:OnIntervalThink()
    if IsServer() then
        local artoria_ultimate_excalibur = self:GetParent():FindAbilityByName("artoria_ultimate_excalibur")
        if artoria_ultimate_excalibur and not artoria_ultimate_excalibur:IsNull() then
            if self:GetParent():HasItemInInventory("item_excalibur") then
                if artoria_ultimate_excalibur:IsHidden() then
                    artoria_ultimate_excalibur:SetHidden(false)
                    artoria_ultimate_excalibur:SetLevel(1)
                end
            else
                if not artoria_ultimate_excalibur:IsHidden() then
                    artoria_ultimate_excalibur:SetHidden(true)
                end
            end
        end
    end
end
