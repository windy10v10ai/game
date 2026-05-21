if HeroDemo == nil then
	_G.HeroDemo = class({}) -- put HeroDemo in the global scope
	--refer to: http://stackoverflow.com/questions/6586145/lua-require-with-global-local
end

--------------------------------------------------------------------------------
-- GameEvent:OnGameRulesStateChange
--------------------------------------------------------------------------------
function HeroDemo:OnGameRulesStateChange()
    if not self:IsDebugPanelEnabled() then
        return
    end
    -- 该文件只处理调试面板相关的游戏事件；非 Tools 模式在入口处直接返回。
	local nNewState = GameRules:State_Get()
	--print( "OnGameRulesStateChange: " .. nNewState )

	if nNewState == DOTA_GAMERULES_STATE_HERO_SELECTION then
		--PlayerResource:GetPlayer(0):SetSelectedHero("npc_dota_hero_abaddon")
		print( "OnGameRulesStateChange: Hero Selection" )
		--PlayerResource:GetPlayer(0):SetSelectedHero("npc_dota_hero_abaddon")

		Timers:CreateTimer(1, function()
--PlayerResource:GetPlayer(0):SetSelectedHero("")
	end)

		Timers:CreateTimer(2, function()
--PlayerResource:GetPlayer(0):SetSelectedHero("npc_dota_hero_primal_beast")
	end)

	elseif nNewState == DOTA_GAMERULES_STATE_PRE_GAME then
		
		--print( "OnGameRulesStateChange: Pre Game Selection" )
        self:FindTowers()
        --for iPlayerID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
            --CustomUI:DynamicHud_Create( iPlayerID, "Hero_Demo", "file://{resources}/layout/custom_game/anime/anime_demo.xml", nil )
        --end
	elseif nNewState == DOTA_GAMERULES_STATE_GAME_IN_PROGRESS then
		--print( "OnGameRulesStateChange: Game In Progress" )
	end
end

--------------------------------------------------------------------------------
-- GameEvent: OnHeroFinishSpawn
--------------------------------------------------------------------------------
function HeroDemo:OnHeroFinishSpawn(hEvent)
    if not self:IsDebugPanelEnabled() then
        return
    end

    --DeepPrintTable(hEvent)
    local hHero = EntIndexToHScript(hEvent.heroindex)
    if IsNotNull(hHero) then
    	local iPlayerID = hHero:GetPlayerOwnerID()
    	if iPlayerID >= 0 and not PlayerResource:IsFakeClient(iPlayerID) and not self.m_tHeroDemoHudCreated[iPlayerID] then
	    	--print(iPlayerID, hHero:GetMainControllingPlayer())
	    	-- 为每个真人玩家单独创建调试面板，避免多人局只给 Player0 创建 HUD。
	    	CustomUI:DynamicHud_Create( iPlayerID, "AIB_HeroDebugPanel", "file://{resources}/layout/custom_game/eyeherodemo/eyeherodemo.xml", {debug_only = 1} )
            self.m_tHeroDemoHudCreated[iPlayerID] = true

	    	-- 初始化默认生成英雄选择，保持 AIB 面板的原始使用体验。
	    	self:OnSelectSpawnHeroButtonPressed(nil, {str = "18"})
	    end
    end
end

--------------------------------------------------------------------------------
-- GameEvent: OnNPCSpawned
--------------------------------------------------------------------------------
function HeroDemo:OnNPCSpawned( event )
    if not self:IsDebugPanelEnabled() then
        return
    end
	--print( "^^^HeroDemo:OnNPCSpawned" )

	local spawnedUnit = EntIndexToHScript( event.entindex )

	if spawnedUnit == nil then
		return
	end

	--DeepPrintTable( event )

	if spawnedUnit:GetUnitName() == "npc_dota_neutral_caster" then
		--print( "Neutral Caster spawned" )
		spawnedUnit:SetContextThink( "self:Think_InitializeNeutralCaster", function() return self:Think_InitializeNeutralCaster( spawnedUnit ) end, 0 )
	end

    local iPlayerID = spawnedUnit:GetPlayerOwnerID()
	if iPlayerID >= 0 and not PlayerResource:IsFakeClient(iPlayerID) and spawnedUnit:IsRealHero() and not spawnedUnit:IsClone() and not spawnedUnit:IsTempestDouble() then
		--print( "spawnedUnit is player's hero" )

		-- 记录每个真人玩家当前英雄的 entindex，面板列表按真实 PlayerID 更新，不再写死 Player0。
		-- clean up ui element for previous player hero if we have a different ent index
		if self.m_tPlayerEntIndex[iPlayerID] ~= nil and self.m_tPlayerEntIndex[iPlayerID] ~= event.entindex then
			local event_data =
			{
				entindex = self.m_tPlayerEntIndex[iPlayerID]
			}
			CustomGameEventManager:Send_ServerToAllClients( "remove_hero_entry", event_data )
		end

		self.m_tPlayerEntIndex[iPlayerID] = event.entindex

		local event_data =
		{
			hero_id = spawnedUnit:GetHeroID()
		}
		CustomGameEventManager:Send_ServerToAllClients( "set_player_hero_id", event_data )

		local hPlayerHero = spawnedUnit
		hPlayerHero:SetContextThink( "self:Think_InitializePlayerHero", function() return self:Think_InitializePlayerHero( hPlayerHero ) end, 0 )
	end

	if event.is_respawn == 0 and spawnedUnit:IsRealHero() and not spawnedUnit:IsClone() and not spawnedUnit:IsTempestDouble() then
		-- 新英雄出生时通知 Panorama 增加条目，供面板上的“编辑所选单位”按钮操作。
		local event_data =
		{
			entindex = event.entindex
		}
		CustomGameEventManager:Send_ServerToAllClients( "add_new_hero_entry", event_data )
	end
end

--------------------------------------------------------------------------------
-- GameEvent: OnItemPurchased
--------------------------------------------------------------------------------
function HeroDemo:OnItemPurchased( event )
    if not self:IsDebugPanelEnabled() then
        return
    end
	--local hBuyer = PlayerResource:GetPlayer( event.PlayerID )
	--local hBuyerHero = hBuyer:GetAssignedHero()
	local hBuyerHero = PlayerResource:GetSelectedHeroEntity(event.PlayerID)
	if IsNotNull(hBuyerHero) then
		hBuyerHero:ModifyGold( event.itemcost, true, 0 )
	end
end

--------------------------------------------------------------------------------
-- GameEvent: OnNPCReplaced
--------------------------------------------------------------------------------
function HeroDemo:OnNPCReplaced( event )
    if not self:IsDebugPanelEnabled() then
        return
    end
	local sNewHeroName = PlayerResource:GetSelectedHeroName( event.new_entindex )
	--print( "sNewHeroName == " .. sNewHeroName ) -- we fail to get in here
	self:BroadcastMsg( "Changed hero to " .. sNewHeroName )
end
