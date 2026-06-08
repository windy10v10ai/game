local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__DecorateLegacy = ____lualib.__TS__DecorateLegacy
local ____exports = {}
local ____dota_ts_adapter = require("utils.dota_ts_adapter")
local BaseAbility = ____dota_ts_adapter.BaseAbility
local registerAbility = ____dota_ts_adapter.registerAbility
--- 假眼额外槽位：充能由商店购买假眼经 WardSlot filter 注入，放置时消耗一层充能。
____exports.AbilityWardSentrySlot = __TS__Class()
local AbilityWardSentrySlot = ____exports.AbilityWardSentrySlot
AbilityWardSentrySlot.name = "AbilityWardSentrySlot"
__TS__ClassExtends(AbilityWardSentrySlot, BaseAbility)
function AbilityWardSentrySlot.prototype.OnSpellStart(self)
    local caster = self:GetCaster()
    local point = self:GetCursorPosition()
    local lifetime = self:GetSpecialValueFor("lifetime")
    local ward = CreateUnitByName(
        "npc_dota_sentry_wards",
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
AbilityWardSentrySlot = __TS__DecorateLegacy(
    {registerAbility(nil, "abilities/ward_slot/ability_ward_sentry_slot")},
    AbilityWardSentrySlot
)
____exports.AbilityWardSentrySlot = AbilityWardSentrySlot
return ____exports
