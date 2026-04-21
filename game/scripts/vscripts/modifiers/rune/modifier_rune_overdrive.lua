local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__DecorateLegacy = ____lualib.__TS__DecorateLegacy
local ____exports = {}
local ____dota_ts_adapter = require("utils.dota_ts_adapter")
local BaseModifier = ____dota_ts_adapter.BaseModifier
local registerModifier = ____dota_ts_adapter.registerModifier
LinkLuaModifier("modifier_rune_overdrive", "modifiers/rune/modifier_rune_overdrive", LUA_MODIFIER_MOTION_NONE)
____exports.OVERDRIVE_DURATION = 20
____exports.OVERDRIVE_MOVE_SPEED = 900
____exports.OVERDRIVE_ATTACK_SPEED = 300
____exports.modifier_rune_overdrive = __TS__Class()
local modifier_rune_overdrive = ____exports.modifier_rune_overdrive
modifier_rune_overdrive.name = "modifier_rune_overdrive"
__TS__ClassExtends(modifier_rune_overdrive, BaseModifier)
function modifier_rune_overdrive.prototype.IsHidden(self)
    return false
end
function modifier_rune_overdrive.prototype.IsPurgable(self)
    return false
end
function modifier_rune_overdrive.prototype.IsDebuff(self)
    return false
end
function modifier_rune_overdrive.prototype.GetEffectName(self)
    return "particles/items2_fx/haste.vpcf"
end
function modifier_rune_overdrive.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE_MAX, MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE, MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT}
end
function modifier_rune_overdrive.prototype.GetModifierMoveSpeed_AbsoluteMax(self)
    return ____exports.OVERDRIVE_MOVE_SPEED
end
function modifier_rune_overdrive.prototype.GetModifierMoveSpeed_Absolute(self)
    return ____exports.OVERDRIVE_MOVE_SPEED
end
function modifier_rune_overdrive.prototype.GetModifierAttackSpeedBonus_Constant(self)
    return ____exports.OVERDRIVE_ATTACK_SPEED
end
modifier_rune_overdrive = __TS__DecorateLegacy(
    {registerModifier(nil, "modifiers/rune/modifier_rune_overdrive")},
    modifier_rune_overdrive
)
____exports.modifier_rune_overdrive = modifier_rune_overdrive
return ____exports
