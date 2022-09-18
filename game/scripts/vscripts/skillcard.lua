function FindTelentValue(caster, name)
  local ability = caster:FindAbilityByName(name)
  if ability ~= nil then
    return ability:GetSpecialValueFor("value")
  else
    return 0
  end
end

if Skillcard == nil then
  Skillcard = class({})
end
function Skillcard:PlayerSay(keys)
  --PrintTable(keys)
  local ply = self.vUserIds[keys.userid]
  if ply == nil then
    return
  end
  -- 获取玩家的ID，0-9
  local plyID = ply:GetPlayerID()
  -- 检验是否有效玩家
  if not PlayerResource:IsValidPlayer(plyID) then
    return
  end
  -- 获取所说内容
  -- text这个key可以在上方通过PrintTable在控制台看到
  local text = keys.text
  -- 如果文本符合 -swap 1 3这样的内容
  local matchA, matchB = string.match(text, "^-swap%s+(%d)%s+(%d)")
  if matchA ~= nil and matchB ~= nil then
    -- 那么就，做点什么
  end



end

function Change_skill_GOKU(hero, plyhd)
  if GameRules:GetDOTATime(false, false) > 15 then
    Say(plyhd, "游戏开始15秒后无法更换技能", true)
    return
  end
  local gold = hero:GetGold()
  local exp = hero:GetCurrentXP()
  -- local hero = PlayerResource:ReplaceHeroWith(plyhd:GetPlayerID(), "npc_dota_hero_enchantress", gold, exp)
  --  print("hero.HasSkillChange")
  -- print(hero.HasSkillChange)
  if hero.HasSkillChange == true then
    Say(plyhd, "已更换技能，无法再更换", true)
    return
  end
  --  删除技能天赋
  for i = 0, 17 do
    if hero:GetAbilityByIndex(i) and hero:GetAbilityByIndex(i) ~= "" then
      --print(hero:GetAbilityByIndex(i):GetName())
      hero:RemoveAbilityByHandle(hero:GetAbilityByIndex(i))
    end
  end
  --删除被动技能
  --local ability = nil
  hero:AddAbility("goku_kamehameha")
  hero:AddAbility("goku_tp")
  hero:AddAbility("goku_kaioken2")
  hero:AddAbility("goku_spirit_bomb")
  hero:AddAbility("generic_hidden")
  hero:AddAbility("goku_super_saiyan")
  hero:AddAbility("ability_goku_telent")
  local ability = hero:FindAbilityByName("ability_goku_telent")
  ability:SetLevel(1)
  hero:AddAbility("generic_hidden")
  hero:AddAbility("generic_hidden")
  hero:AddAbility("special_bonus_unique_goku_1")
  hero:AddAbility("special_bonus_unique_goku_4")
  hero:AddAbility("special_bonus_unique_goku_2_1")
  hero:AddAbility("special_bonus_unique_goku_2_2")
  hero:AddAbility("special_bonus_unique_goku_2")
  hero:AddAbility("special_bonus_unique_goku_5")
  hero:AddAbility("special_bonus_unique_goku_6")
  hero:AddAbility("special_bonus_unique_goku_7")

  hero.HasSkillChange = true
  GameRules:SendCustomMessage("<font color='#00FFFF'>孙悟空使用了限定技能卡</font>", 0, 0)
end
