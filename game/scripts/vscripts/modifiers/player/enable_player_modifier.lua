-- 称号属性 START
local windySteamAccountID = Set {
	-- windy
	136407523,
	-- 测试
	916506173,
}

local xianyuSteamAccountID = Set {
	-- 咸鱼之王
	1194383041,
}
local mimihuaSteamAccountID = Set {
	-- mimihua
	385130282,
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
local wonderpisSteamAccountID = Set {
	-- wonderpis
	121514138,
}
local xiayibingSteamAccountID = Set {
	-- 夏忆冰
	849959529,
}
local m5xwSteamAccountID = Set {
	-- 爱发电用户_m5xw
	129797279,
}
local mingriSteamAccountID = Set {
	-- 明日世界
	295200117,
}
local liaoranSteamAccountID = Set {
	-- 了然明心
	141805019,
}
local laniSteamAccountID = Set {
	-- 菈妮唯一的王
	112073229,
}
local li123SteamAccountID = Set {
	-- 爱发电 123
	193859368,
}
local yangqiSteamAccountID = Set {
	-- QQ 杨奇
	338188516,
}
local kudoSteamAccountID = Set {
	-- kud
	118324486,
}
local arrayZoneYourSteamAccountID = Set {
	-- ArrayZoneYour
	314643375,
}
local nmjbSteamAccountID = Set {
	-- 爱发电用户_NmjB
	139073897,
}
local puck1609SteamAccountID = Set {
	-- puck1609
	245559423,
}
local dky190SteamAccountID = Set {
	-- dky190
	1033313629,
}
local keleSteamAccountID = Set {
	-- 榨汁可乐橙
	330994098,
}
local loset12SteamAccountID = Set {
	-- loset12
	150252080,
}
local chuyinSteamAccountID = Set {
	-- 初音没未来了
	908271686,
}
local sushiSteamAccountID = Set {
	-- 速食上好佳
	160996305,
}
local kdvhSteamAccountID = Set {
	-- 爱发电用户_kDVh
	59388035,
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
	if xianyuSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_xianyu", "modifiers/player/modifier_player_xianyu", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_xianyu", {})
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
		LinkLuaModifier("modifier_player_xin_2", "modifiers/player/modifier_player_xin_2", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_xin_2", {})
		LinkLuaModifier("modifier_player_xin_3", "modifiers/player/modifier_player_xin_3", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_xin_3", {})
		LinkLuaModifier("modifier_player_xin_4", "modifiers/player/modifier_player_xin_4", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_xin_4", {})
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
	if wonderpisSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_wonderpis", "modifiers/player/modifier_player_wonderpis", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_wonderpis", {})
	end
	if xiayibingSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_xiayibing", "modifiers/player/modifier_player_xiayibing", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_xiayibing", {})
	end
	if luoshuBuffSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_saber", "modifiers/player/modifier_player_saber", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_saber", {})
		LinkLuaModifier("modifier_player_abyss", "modifiers/player/modifier_player_abyss", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_abyss", {})
		LinkLuaModifier("modifier_player_goku", "modifiers/player/modifier_player_goku", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_goku", {})
		LinkLuaModifier("modifier_player_luoshu", "modifiers/player/modifier_player_luoshu", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_luoshu", {})
		LinkLuaModifier("modifier_player_luoshu_2", "modifiers/player/modifier_player_luoshu_2", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_luoshu_2", {})
	end

	if m5xwSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_m5xw", "modifiers/player/modifier_player_m5xw", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_m5xw", {})
	end
	if mingriSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_mingri", "modifiers/player/modifier_player_mingri", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_mingri", {})
	end
	if liaoranSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_liaoran", "modifiers/player/modifier_player_liaoran", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_liaoran", {})
	end
	if laniSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_lani", "modifiers/player/modifier_player_lani", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_lani", {})
	end
	if li123SteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_li123", "modifiers/player/modifier_player_li123", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_li123", {})
	end
	if yangqiSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_yangqi", "modifiers/player/modifier_player_yangqi", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_yangqi", {})
	end
	if kudoSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_kudo", "modifiers/player/modifier_player_kudo", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_kudo", {})
	end
	if arrayZoneYourSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_arrayzoneyour", "modifiers/player/modifier_player_arrayzoneyour", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_arrayzoneyour", {})
	end
	if nmjbSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_nmjb", "modifiers/player/modifier_player_nmjb", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_nmjb", {})
	end
	if puck1609SteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_puck1609", "modifiers/player/modifier_player_puck1609", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_puck1609", {})
		LinkLuaModifier("modifier_player_puck1609_2", "modifiers/player/modifier_player_puck1609_2", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_puck1609_2", {})
		LinkLuaModifier("modifier_player_puck1609_3", "modifiers/player/modifier_player_puck1609_3", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_puck1609_3", {})
		LinkLuaModifier("modifier_player_puck1609_4", "modifiers/player/modifier_player_puck1609_4", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_puck1609_4", {})
	end
	if dky190SteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_dky190", "modifiers/player/modifier_player_dky190", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_dky190", {})
		LinkLuaModifier("modifier_player_dky190_2", "modifiers/player/modifier_player_dky190_2", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_dky190_2", {})
		LinkLuaModifier("modifier_player_dky190_3", "modifiers/player/modifier_player_dky190_3", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_dky190_3", {})
		LinkLuaModifier("modifier_player_dky190_4", "modifiers/player/modifier_player_dky190_4", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_dky190_4", {})
	end
	if keleSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_kele", "modifiers/player/modifier_player_kele", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_kele", {})
	end
	if loset12SteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_loset12", "modifiers/player/modifier_player_loset12", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_loset12", {})
		LinkLuaModifier("modifier_player_loset12_2", "modifiers/player/modifier_player_loset12_2", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_loset12_2", {})
	end
	if chuyinSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_chuyin", "modifiers/player/modifier_player_chuyin", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_chuyin", {})
	end
	if sushiSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_sushi", "modifiers/player/modifier_player_sushi", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_sushi", {})
	end
	if kdvhSteamAccountID[steamAccountID] then
		LinkLuaModifier("modifier_player_kdvh_1", "modifiers/player/modifier_player_kdvh_1", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_kdvh_1", {})
		LinkLuaModifier("modifier_player_kdvh_2", "modifiers/player/modifier_player_kdvh_2", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_kdvh_2", {})
		LinkLuaModifier("modifier_player_kdvh_3", "modifiers/player/modifier_player_kdvh_3", LUA_MODIFIER_MOTION_NONE)
		hEntity:AddNewModifier(hEntity, nil, "modifier_player_kdvh_3", {})
	end
end
