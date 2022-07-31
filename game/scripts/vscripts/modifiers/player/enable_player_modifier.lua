-- 称号属性 START
local windySteamAccountID = Set {
	-- windy
	136407523,
	-- 测试
	916506173,
}

local mimihuaSteamAccountID = Set {
	-- mimihua
	385130282,
	-- 测试
	916506173,
}

local luoshuBuffSteamAccountID = Set {
	-- 洛书
	136668998,
}

local lumaoSteamAccountID = Set {
	-- 撸猫
	128984820,
}

local bulangyaSteamAccountID = Set {
	-- 布狼牙
	117417953,
}

local qiliuSteamAccountID = Set {
	-- 76
	353885092,
}

local hunzhuoSteamAccountID = Set {
	-- 浑浊
	251171524,
}

local chashaobaoSteamAccountID = Set {
	-- 叉烧包
	882465781,
}

local menglihuaSteamAccountID = Set {
	-- 梦璃花
	907056028,
}

local dabuguoSteamAccountID = Set {
	-- 打不过？没关系！去让咸鱼卖屁股啊！
	342049002,
}

-- 加主属性
local shapuSteamAccountID = Set {
	-- 傻蒲
	208461180,
	-- 爱发电用户_b6xN
	445619710,
}

local kfw6SteamAccountID = Set {
	-- 爱发电用户_Kfw6
	322271699,
}

local dalaogongjiSteamAccountID = Set {
	-- 大佬，请问攻击按哪个按键呀？
	1166147496,
}

local jiangcaiSteamAccountID = Set {
	-- 酱菜
	108208968,
}

local rwbySteamAccountID = Set {
	-- 爱发电用户_HjPS Rwby
	156694017,
}

local sunSteamAccountID = Set {
	-- 爱发电用户_qHkC/sun
	138652140,
}

local cynSteamAccountID = Set {
	-- Cyn.
	107625818,
}
local adolphzeroSteamAccountID = Set {
	-- Adolph_Zero
	153632407,
}
local j3e9SteamAccountID = Set {
	-- 爱发电用户_J3e9
	887874899,
}
local xinSteamAccountID = Set {
	-- 新
	171217775,
}
local qiannianSteamAccountID = Set {
	-- 千年破晓
	120921523,
}
local feijiSteamAccountID = Set {
	-- 爱发电用户_htSB/QQ飞机
	213346065,
}
local pnsSteamAccountID = Set {
	-- 爱发电用户_5Pns
	129972639,
}
local taikongSteamAccountID = Set {
	-- 太空王子
	140769251,
}
-- 称号属性 END

function EnablePlayerModifier(hEntity)
	local steamAccountID = PlayerResource:GetSteamAccountID(hEntity:GetPlayerOwnerID())
	LinkLuaModifier("modifier_membership", "modifiers/player/modifier_membership", LUA_MODIFIER_MOTION_NONE)
	if WebServer.memberSteamAccountID[steamAccountID] and WebServer.memberSteamAccountID[steamAccountID].enable then
		hEntity:AddNewModifier(hEntity, nil, "modifier_membership", {})
	end

	if windySteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_windy", "modifiers/player/modifier_player_windy", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_windy", {})
	end
	if mimihuaSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_mimihua", "modifiers/player/modifier_player_mimihua", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_mimihua", {})
	end

	if lumaoSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_lumao", "modifiers/player/modifier_player_lumao", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_lumao", {})
	end
	if bulangyaSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_bulangya", "modifiers/player/modifier_player_bulangya", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_bulangya", {})
	end
	if qiliuSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_76", "modifiers/player/modifier_player_76", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_76", {})
	end
	if hunzhuoSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_hunzhuo", "modifiers/player/modifier_player_hunzhuo", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_hunzhuo", {})
	end
	if chashaobaoSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_chashaobao", "modifiers/player/modifier_player_chashaobao", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_chashaobao", {})
	end
	if menglihuaSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_menglihua", "modifiers/player/modifier_player_menglihua", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_menglihua", {})
	end
	if dabuguoSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_dabuguo", "modifiers/player/modifier_player_dabuguo", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_dabuguo", {})
	end
	if shapuSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_shapu", "modifiers/player/modifier_player_shapu", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_shapu", {})
	end
	if kfw6SteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_kfw6", "modifiers/player/modifier_player_kfw6", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_kfw6", {})
	end
	if dalaogongjiSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_dalaogongji", "modifiers/player/modifier_player_dalaogongji", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_dalaogongji", {})
	end
	if jiangcaiSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_jiangcai", "modifiers/player/modifier_player_jiangcai", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_jiangcai", {})
	end
	if rwbySteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_rwby", "modifiers/player/modifier_player_rwby", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_rwby", {})
	end
	if sunSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_sun", "modifiers/player/modifier_player_sun", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_sun", {})
	end
	if cynSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_cyn1", "modifiers/player/modifier_player_cyn1", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_cyn1", {})
		LinkLuaModifier("modifier_player_cyn2", "modifiers/player/modifier_player_cyn2", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_cyn2", {})
		LinkLuaModifier("modifier_player_cyn3", "modifiers/player/modifier_player_cyn3", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_cyn3", {})
	end
	if adolphzeroSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_adolphzero", "modifiers/player/modifier_player_adolphzero", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_adolphzero", {})
	end
	if j3e9SteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_j3e9", "modifiers/player/modifier_player_j3e9", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_j3e9", {})
	end
	if xinSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_xin", "modifiers/player/modifier_player_xin", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_xin", {})
	end
	if qiannianSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_qiannian", "modifiers/player/modifier_player_qiannian", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_qiannian", {})
	end
	if feijiSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_feiji", "modifiers/player/modifier_player_feiji", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_feiji", {})
	end
	if pnsSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_pns", "modifiers/player/modifier_player_pns", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_pns", {})
	end
	if taikongSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_taikong", "modifiers/player/modifier_player_taikong", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_taikong", {})
	end


	if luoshuBuffSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_saber", "modifiers/player/modifier_player_saber", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_saber", {})
		LinkLuaModifier("modifier_player_abyss", "modifiers/player/modifier_player_abyss", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_abyss", {})
		LinkLuaModifier("modifier_player_goku", "modifiers/player/modifier_player_goku", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_goku", {})
	end
end
