modifier_miku_scepter = class ({})

function modifier_miku_scepter:IsHidden() return true end
function modifier_miku_scepter:IsDebuff() return false end
function modifier_miku_scepter:IsPurgable() return false end
function modifier_miku_scepter:IsPurgeException() return false end
function modifier_miku_scepter:RemoveOnDeath() return false end

function modifier_miku_scepter:OnCreated()
    if IsServer() then


        self:StartIntervalThink(FrameTime())
    end
end
function modifier_miku_scepter:OnRefresh()
    if IsServer() then

    end
end

function modifier_miku_scepter:OnIntervalThink()
    if IsServer() then
        local get_down = self:GetParent():FindAbilityByName("get_down")
        if get_down and not get_down:IsNull() then
            if self:GetParent():HasScepter() then
                if get_down:IsHidden() then
                    get_down:SetHidden(false)
                end
            else
                if not get_down:IsHidden() then
                    get_down:SetHidden(true)
                end
            end
        end
    end
end
