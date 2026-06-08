local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__DecorateLegacy = ____lualib.__TS__DecorateLegacy
local ____exports = {}
local ____dota_ts_adapter = require("utils.dota_ts_adapter")
local BaseAbility = ____dota_ts_adapter.BaseAbility
local registerAbility = ____dota_ts_adapter.registerAbility
--- 真眼额外槽位：充能由商店购买真眼经 WardSlot filter 注入，放置时消耗一层充能。
____exports.AbilityWardObserverSlot = __TS__Class()
local AbilityWardObserverSlot = ____exports.AbilityWardObserverSlot
AbilityWardObserverSlot.name = "AbilityWardObserverSlot"
__TS__ClassExtends(AbilityWardObserverSlot, BaseAbility)
function AbilityWardObserverSlot.prototype.OnSpellStart(self)
    local caster = self:GetCaster()
    local point = self:GetCursorPosition()
    local lifetime = self:GetSpecialValueFor("lifetime")
    local ward = CreateUnitByName(
        "npc_dota_observer_wards",
        point,
        false,
        caster,
        caster,
        caster:GetTeamNumber()
    )
    ward:SetControllableByPlayer(
        caster:GetPlayerOwnerID(),
        true
    )
    ward:AddNewModifier(caster, self, "modifier_kill", {duration = lifetime})
end
AbilityWardObserverSlot = __TS__DecorateLegacy(
    {registerAbility(nil, "abilities/ward_slot/ability_ward_observer_slot")},
    AbilityWardObserverSlot
)
____exports.AbilityWardObserverSlot = AbilityWardObserverSlot
return ____exports
