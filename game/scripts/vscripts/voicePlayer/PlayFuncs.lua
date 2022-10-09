BaseNPC = IsServer() and CDOTA_BaseNPC or C_DOTA_BaseNPC

function BaseNPC:PlayVoice(VoiceName)
    local vo_modi = self:FindModifierByName("modifier_hero_vo_player")
    if vo_modi and not vo_modi.EmitingVoice then
        vo_modi.EmitingVoice = true
        self:SetContextThink(DoUniqueString("SetEmitingToFalse"), function() vo_modi.EmitingVoice = false end , 10)
        EmitAnnouncerSoundForPlayer(VoiceName , self:GetPlayerOwnerID())
    end
end

function BaseNPC:PlayVoiceIgnoreCooldown(VoiceName)
    local vo_modi = self:FindModifierByName("modifier_hero_vo_player")
    if vo_modi then
        vo_modi.EmitingVoice = true
        self:SetContextThink(DoUniqueString("SetEmitingToFalse"), function() vo_modi.EmitingVoice = false end , 10)
        EmitAnnouncerSoundForPlayer(VoiceName , self:GetPlayerOwnerID())
    end
end

function BaseNPC:PlayVoiceAllPlayerIgnoreCooldown(VoiceName)
    local vo_modi = self:FindModifierByName("modifier_hero_vo_player")
    if vo_modi then
        vo_modi.EmitingVoice = true
        self:SetContextThink(DoUniqueString("SetEmitingToFalse"), function() vo_modi.EmitingVoice = false end , 10)
        EmitAnnouncerSound(VoiceName)
    end
end
