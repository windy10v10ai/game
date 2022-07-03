-- taken from Nye's DotaCraft

local popup = {}

POPUP_SYMBOL_PRE_PLUS = 0
POPUP_SYMBOL_PRE_MINUS = 1
POPUP_SYMBOL_PRE_SADFACE = 2
POPUP_SYMBOL_PRE_BROKENARROW = 3
POPUP_SYMBOL_PRE_SHADES = 4
POPUP_SYMBOL_PRE_MISS = 5
POPUP_SYMBOL_PRE_EVADE = 6
POPUP_SYMBOL_PRE_DENY = 7
POPUP_SYMBOL_PRE_ARROW = 8

POPUP_SYMBOL_POST_EXCLAMATION = 0
POPUP_SYMBOL_POST_POINTZERO = 1
POPUP_SYMBOL_POST_MEDAL = 2
POPUP_SYMBOL_POST_DROP = 3
POPUP_SYMBOL_POST_LIGHTNING = 4
POPUP_SYMBOL_POST_SKULL = 5
POPUP_SYMBOL_POST_EYE = 6
POPUP_SYMBOL_POST_SHIELD = 7
POPUP_SYMBOL_POST_POINTFIVE = 8


function PopupStrTome(target, amount)
	PopupNumbers(target, "miss", Vector(156, 39, 39), 3.0, amount, 0, nil)
end

function PopupAgiTome(target, amount)
	PopupNumbers(target, "miss", Vector(48, 156, 39), 3.0, amount, 0, nil)
end

function PopupIntTome(target, amount)
	PopupNumbers(target, "miss", Vector(2, 158, 219), 3.0, amount, 0, nil)
end

-- Customizable version.
function PopupNumbers(target, pfx, color, lifetime, number, presymbol, postsymbol)
	local pfxPath = string.format("particles/msg_fx/msg_%s.vpcf", pfx)
	local pidx
	if pfx == "gold" or pfx == "lumber" then
		pidx = ParticleManager:CreateParticleForTeam(pfxPath, PATTACH_ABSORIGIN_FOLLOW, target, target:GetTeamNumber())
	else
		pidx = ParticleManager:CreateParticle(pfxPath, PATTACH_CUSTOMORIGIN, target)
	end

	local digits = 0
	if number ~= nil then
		digits = #tostring(number)
	end
	if presymbol ~= nil then
		digits = digits + 1
	end
	if postsymbol ~= nil then
		digits = digits + 1
	end

	ParticleManager:SetParticleControl(pidx, 0, target:GetAbsOrigin() + Vector(math.random(-80,80),math.random(-80,80),math.random(260,280)))
	ParticleManager:SetParticleControl(pidx, 1, Vector(tonumber(presymbol), tonumber(number), tonumber(postsymbol)))
	ParticleManager:SetParticleControl(pidx, 2, Vector(lifetime, digits, 0))
	ParticleManager:SetParticleControl(pidx, 3, color)
end

function PopupMultiplier(target, number)
	local particleName = "particles/custom/alchemist_unstable_concoction_timer.vpcf"
	local preSymbol = 0 --none
	local postSymbol = 4 --crit
	local digits = string.len(number)+1
	local targetPos = target:GetAbsOrigin()

	local particle = ParticleManager:CreateParticle( particleName, PATTACH_CUSTOMORIGIN, target )
	ParticleManager:SetParticleControl(particle, 0, Vector(targetPos.x, targetPos.y, targetPos.z+322))
	ParticleManager:SetParticleControl( particle, 1, Vector( preSymbol, number, postSymbol) )
	ParticleManager:SetParticleControl( particle, 2, Vector( digits, 0, 0) )
end

function PopupLegion(target, number)
	local particleName = "particles/custom/legion_commander_duel_text.vpcf"

	local digits = string.len(number)
	local targetPos = target:GetAbsOrigin()
	local particle = ParticleManager:CreateParticle( particleName, PATTACH_CUSTOMORIGIN, target )
	ParticleManager:SetParticleControl( particle, 1, Vector( 10, number, 0) )
	ParticleManager:SetParticleControl( particle, 2, Vector( digits, 0, 0) )
	ParticleManager:SetParticleControl( particle, 3, Vector(targetPos.x, targetPos.y, targetPos.z+322) )
end

function PopupKillbanner(target, name)
	-- Possible names: firstblood, doublekill, triplekill, rampage, multikill_generic
	local particleName = "particles/econ/events/killbanners/screen_killbanner_compendium14_"..name..".vpcf"

	local particle = ParticleManager:CreateParticle( particleName, PATTACH_EYES_FOLLOW, target )
end

return popups

