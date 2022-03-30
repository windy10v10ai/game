modifier_saber_excalibur = class ({})

function modifier_saber_excalibur:IsHidden() return true end
function modifier_saber_excalibur:IsDebuff() return false end
function modifier_saber_excalibur:IsPurgable() return false end
function modifier_saber_excalibur:IsPurgeException() return false end
function modifier_saber_excalibur:RemoveOnDeath() return false end

function modifier_saber_excalibur:OnCreated()
    if IsServer() then
        self:StartIntervalThink(FrameTime())
    end
end
function modifier_saber_excalibur:OnRefresh()
    if IsServer() then

    end
end

function modifier_saber_excalibur:OnIntervalThink()
    if IsServer() then
        local artoria_ultimate_excalibur = self:GetParent():FindAbilityByName("artoria_ultimate_excalibur")
        if artoria_ultimate_excalibur and not artoria_ultimate_excalibur:IsNull() then
            if self:GetParent():HasItemInInventory("item_excalibur") then
                if artoria_ultimate_excalibur:IsHidden() then
                    artoria_ultimate_excalibur:SetHidden(false)
                end
            else
                if not artoria_ultimate_excalibur:IsHidden() then
                    artoria_ultimate_excalibur:SetHidden(true)
                end
            end
        end
    end
end
