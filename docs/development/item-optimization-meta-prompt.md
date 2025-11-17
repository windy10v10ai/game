# Dota 2 自定义物品性能优化 Meta Prompt

本文档提供一个完整的 meta prompt,用于指导 AI 优化 Dota 2 自定义物品性能,将 Lua 实现迁移到 DataDriven 实现。

**官方文档**: https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven

---

## Meta Prompt

你是一个 Dota 2 自定义游戏物品性能优化专家。你的任务是将基于 Lua 的物品实现优化为 DataDriven 实现,以减少游戏卡顿和提升性能。

### 核心优化原则

1. **BaseClass 迁移**: 将物品 `BaseClass` 从 `item_lua` 改为 `item_datadriven`
2. **属性 DataDriven 化**: 将静态属性从 Lua `GetModifier*()` 函数迁移到 DataDriven `Properties` 块
3. **最小化 Lua 代码**: 仅在 DataDriven 无法实现的功能时使用 Lua
4. **保持功能完整**: 优化后物品功能必须与优化前完全一致

### 实现方式优先级

优化物品时，按以下优先级选择实现方式：

**1. 优先 DataDriven** ⭐⭐⭐

- 静态属性加成 → 使用 `Properties` 块
- 状态控制 → 使用 `States` 块
- 主动技能 → 使用 `OnSpellStart` + DataDriven Actions
- 特效音效 → 使用 `EffectName` + `FireSound`

**2. 其次 Dota 2 原生 Modifier** ⭐⭐

- 复杂被动效果 → 复用原生 modifier（如 `modifier_item_eternal_shroud`）
- 在 Lua 的 OnCreated 中添加: `caster:AddNewModifier(caster, ability, "modifier_xxx", {})`
- 原生 modifier 自动从 `AbilityValues` 读取参数

**3. 最后 Lua Modifier** ⭐

- 仅在 DataDriven 和原生 modifier 都无法实现时使用
- 动态计算的属性（基于层数、生命值百分比等）
- 特殊功能（`MODIFIER_PROPERTY_ABSORB_SPELL` 等）
- 复杂的伤害计算和冷却管理

**优化目标**: 尽可能使用 DataDriven（性能最优）> 原生 modifier（次优）> Lua modifier（最差）

### 可使用 DataDriven 实现的属性列表

**⚠️ 重要**: 只有以下列表中的属性可以迁移到 DataDriven,不在列表中的属性必须保留在 Lua 中。

#### 基础属性

- `MODIFIER_PROPERTY_STATS_STRENGTH_BONUS` - 力量加成
- `MODIFIER_PROPERTY_STATS_AGILITY_BONUS` - 敏捷加成
- `MODIFIER_PROPERTY_STATS_INTELLECT_BONUS` - 智力加成

#### 攻击相关

- `MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE` - 攻击力加成
- `MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT` - 攻击速度加成(固定值)
- `MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE` - 基础伤害加成百分比
- `MODIFIER_PROPERTY_ATTACK_RANGE_BONUS` - 攻击距离加成

#### 防御相关

- `MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS` - 物理护甲加成
- `MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS` - 魔法抗性加成
- `MODIFIER_PROPERTY_EVASION_CONSTANT` - 闪避率

#### 移动相关

- `MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT` - 移动速度加成(固定值)
- `MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE` - 移动速度加成百分比
- `MODIFIER_PROPERTY_MOVESPEED_BONUS_UNIQUE` - 移动速度加成(唯一)
- `MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE` - 绝对移动速度
- `MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE` - 转身速率百分比

#### 生命/魔法相关

- `MODIFIER_PROPERTY_HEALTH_BONUS` - 生命值加成
- `MODIFIER_PROPERTY_MANA_BONUS` - 魔法值加成
- `MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT` - 生命恢复(固定值)
- `MODIFIER_PROPERTY_MANA_REGEN_CONSTANT` - 魔法恢复(固定值)

#### 法术相关

- `MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE` - 法术增强百分比

### 可使用 DataDriven 实现的状态 (States)

DataDriven modifier 支持通过 `States` 块控制单位状态:

```kv
"States"
{
    "MODIFIER_STATE_ROOTED"     "MODIFIER_STATE_VALUE_ENABLED"
    "MODIFIER_STATE_DISARMED"   "MODIFIER_STATE_VALUE_ENABLED"
}
```

**常用状态列表**:

- `MODIFIER_STATE_ROOTED` - 禁锢（无法移动）
- `MODIFIER_STATE_DISARMED` - 缴械（无法攻击）
- `MODIFIER_STATE_SILENCED` - 沉默（无法施法）
- `MODIFIER_STATE_MUTED` - 锁闭（无法使用物品）
- `MODIFIER_STATE_STUNNED` - 眩晕
- `MODIFIER_STATE_HEXED` - 妖术
- `MODIFIER_STATE_INVISIBLE` - 隐身
- `MODIFIER_STATE_INVULNERABLE` - 无敌
- `MODIFIER_STATE_MAGIC_IMMUNE` - 魔法免疫
- `MODIFIER_STATE_FLYING` - 飞行
- `MODIFIER_STATE_NO_HEALTH_BAR` - 隐藏血条
- `MODIFIER_STATE_NO_UNIT_COLLISION` - 无视单位碰撞
- `MODIFIER_STATE_ATTACK_IMMUNE` - 攻击免疫
- `MODIFIER_STATE_UNSELECTABLE` - 无法选中
- `MODIFIER_STATE_CANNOT_MISS` - 攻击不会 Miss
- `MODIFIER_STATE_BLIND` - 致盲（攻击会 Miss）

**状态值**:

- `MODIFIER_STATE_VALUE_ENABLED` - 启用状态
- `MODIFIER_STATE_VALUE_DISABLED` - 禁用状态

### 必须保留在 Lua 中的功能

以下功能**无法**用 DataDriven 实现,必须使用 Lua modifier:

- `MODIFIER_PROPERTY_ABSORB_SPELL` - 法术格挡(如莲花球)
- `MODIFIER_PROPERTY_PROCATTACK_FEEDBACK` - 攻击触发反馈
- 复杂的伤害计算和状态管理
- 需要维护冷却时间的被动效果
- 动态计算的属性值(基于生命值百分比、层数等)

### 复用原生 Modifier

对于复杂被动效果,优先考虑复用 Dota 2 原生 modifier,无需虚拟物品:

**直接添加原生 modifier**:

```lua
-- OnCreated 回调
caster:AddNewModifier(caster, ability, "modifier_item_eternal_shroud", {})

-- OnDestroy 回调
caster:RemoveModifierByName("modifier_item_eternal_shroud")
```

**要点**:

- 原生 modifier 会从传入的 `ability` 读取 `AbilityValues`
- 在自定义物品的 `AbilityValues` 中添加原生 modifier 需要的参数
- 无需创建虚拟物品或 dummy item
- 不要在 DataDriven Modifiers 块中定义已有的原生 modifier

**示例**: 复用法师泳衣 (Eternal Shroud) 被动

```kv
"AbilityValues"
{
    // 自定义物品属性
    "bonus_strength"     "150"

    // Eternal Shroud modifier 需要的参数
    "mana_restore_pct"   "50"
    "stack_threshold"    "600"
    "stack_duration"     "10"
    "max_stacks"         "8"
    "stack_resist"       "4"
}
```

### 优化实施步骤

#### 步骤 1: 分析现有 Lua 实现

读取以下文件:

1. `game/scripts/vscripts/items/item_<物品名>.lua` - Lua 逻辑
2. `game/scripts/npc/npc_items_custom.txt` - 物品定义(搜索 `item_<物品名>`)

识别:

- ✅ 可以迁移到 DataDriven 的静态属性(在上述列表中)
- ❌ 必须保留在 Lua 中的复杂逻辑
- 🔍 主动技能逻辑
- 🔍 特殊被动效果(光环、反伤等)

#### 步骤 2: 修改 npc_items_custom.txt

**2.1 修改物品定义头部**

```kv
"item_<物品名>"
{
    "BaseClass"         "item_datadriven"  // 从 item_lua 改为 item_datadriven
    "ScriptFile"        "items/item_<物品名>"  // 保留 ScriptFile
    "ID"                "<物品ID>"
    "AbilityTextureName" "<贴图名>"
    // ... 其他属性

    "AbilityValues"
    {
        // 所有属性值(用于 tooltip 和 DataDriven 引用)
        "bonus_strength"    "100"
        "bonus_damage"      "50"
        // ... 其他值

        // Lua 逻辑专用参数
        "active_duration"   "5"     // Lua 逻辑需要
        "cooldown_time"     "15"    // Lua 逻辑需要
    }
}
```

**2.2 添加主动技能逻辑(如果有)**

```kv
"OnSpellStart"
{
    "RunScript"
    {
        "ScriptFile"    "items/item_<物品名>"
        "Function"      "OnSpellStart"  // Lua 全局函数
    }
}
```

**2.3 添加 Modifiers 块**

```kv
"Modifiers"
{
    // 主 modifier - 包含所有静态属性
    "modifier_item_<物品名>"
    {
        "Passive"           "1"
        "IsHidden"          "1"
        "RemoveOnDeath"     "0"

        // 属性配置
        // 可叠加: MODIFIER_ATTRIBUTE_MULTIPLE
        // 不可叠加: 移除 MODIFIER_ATTRIBUTE_MULTIPLE
        "Attributes"        "MODIFIER_ATTRIBUTE_PERMANENT | MODIFIER_ATTRIBUTE_MULTIPLE | MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE"

        "Properties"
        {
            // 从可优化属性列表中选择,使用 %变量名 引用 AbilityValues
            "MODIFIER_PROPERTY_STATS_STRENGTH_BONUS"    "%bonus_strength"
            "MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE"  "%bonus_damage"
            // ... 其他静态属性
        }

        // 如果需要 Lua 处理特殊逻辑(如 ABSORB_SPELL)
        "OnCreated"
        {
            "RunScript"
            {
                "ScriptFile"    "items/item_<物品名>"
                "Function"      "<物品名>OnCreated"  // Lua 全局函数
            }
        }

        "OnDestroy"
        {
            "RunScript"
            {
                "ScriptFile"    "items/item_<物品名>"
                "Function"      "<物品名>OnDestroy"  // Lua 全局函数
            }
        }
    }

    // 辅助 modifier - 临时 buff/debuff
    "modifier_item_<物品名>_<效果名>"
    {
        "IsDebuff"      "1"  // 或 "IsBuff"
        "IsPurgable"    "1"  // 是否可驱散

        "Properties"
        {
            "MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE"  "-40"
            // ... 其他属性
        }

        // 如果需要周期性逻辑
        "ThinkInterval"     "1.0"
        "OnIntervalThink"
        {
            "RunScript"
            {
                "ScriptFile"    "items/item_<物品名>"
                "Function"      "<效果名>Tick"  // Lua 全局函数
            }
        }
    }

    // 光环 modifier(如果需要)
    "modifier_item_<物品名>_aura"
    {
        "Passive"           "1"
        "IsHidden"          "0"
        "IsPurgable"        "0"

        "Aura"                  "modifier_item_<物品名>_aura_effect"
        "Aura_Radius"           "%aura_radius"
        "Aura_Teams"            "DOTA_UNIT_TARGET_TEAM_ENEMY"
        "Aura_Types"            "DOTA_UNIT_TARGET_HERO | DOTA_UNIT_TARGET_BASIC"
        "Aura_ApplyToCaster"    "0"

        "EffectName"            "particles/xxx.vpcf"  // 光环特效
        "EffectAttachType"      "PATTACH_ABSORIGIN_FOLLOW"
        "TextureName"           "item_xxx"  // 图标
    }

    "modifier_item_<物品名>_aura_effect"
    {
        "IsDebuff"      "1"

        "Properties"
        {
            "MODIFIER_PROPERTY_MISS_PERCENTAGE"     "%blind_pct"
        }

        "ThinkInterval"     "1.0"
        "OnIntervalThink"
        {
            "RunScript"
            {
                "ScriptFile"    "items/item_<物品名>"
                "Function"      "AuraDamage"
            }
        }
    }
}
```

#### 步骤 3: 重写 Lua 文件

**重要**:
- Lua 文件使用 **4 个空格**缩进,不使用 tab。
- **Lua 中组合 MODIFIER_ATTRIBUTE 必须使用 `+` 而不是 `|`**
  - 正确: `return MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE + MODIFIER_ATTRIBUTE_MULTIPLE`
  - 错误: `return MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE | MODIFIER_ATTRIBUTE_MULTIPLE`
  - 注意: KV 文件（DataDriven）中使用 `|` 是正确的

**3.1 文件头部(LinkLuaModifier)**

```lua
-- 只为必须用 Lua 实现的 modifier 声明 LinkLuaModifier
LinkLuaModifier("modifier_item_<物品名>_<特殊功能>", "items/item_<物品名>.lua", LUA_MODIFIER_MOTION_NONE)
```

**3.2 DataDriven 回调函数(全局函数)**

**重要**: 当在 OnCreated 中添加辅助 modifier 时,必须将 modifier 引用保存到 ability 对象上,以便在 OnDestroy 时精确移除。这样可以避免在有多个相同物品时误删其他物品的 modifier。

```lua
-- ========================================
-- DataDriven modifier_item_<物品名> 的 OnCreated 回调
-- ========================================
function <物品名>OnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 添加原生 modifier(如果需要)
    local native_modifier = caster:AddNewModifier(caster, ability, "modifier_item_xxx", {})

    -- 添加 Lua 辅助 modifier 处理特殊功能(如 ABSORB_SPELL)
    local special_modifier = caster:AddNewModifier(caster, ability, "modifier_item_<物品名>_<特殊功能>", {})

    -- 添加其他需要的 modifier(如光环等)
    local aura_modifier = caster:AddNewModifier(caster, ability, "modifier_item_<物品名>_aura", {})

    -- 将添加的 modifier 保存到 ability 上,以便 OnDestroy 时精确移除
    if not ability.added_modifiers then
        ability.added_modifiers = {}
    end

    if native_modifier then
        table.insert(ability.added_modifiers, native_modifier)
    end
    if special_modifier then
        table.insert(ability.added_modifiers, special_modifier)
    end
    if aura_modifier then
        table.insert(ability.added_modifiers, aura_modifier)
    end
end

-- ========================================
-- DataDriven modifier_item_<物品名> 的 OnDestroy 回调
-- ========================================
function <物品名>OnDestroy(keys)
    if not IsServer() then return end

    local ability = keys.ability

    if not ability or not ability.added_modifiers then return end

    -- 只移除此物品实例添加的 modifier
    for _, modifier in pairs(ability.added_modifiers) do
        if modifier and not modifier:IsNull() then
            modifier:Destroy()
        end
    end

    -- 清空记录,防止内存泄漏
    ability.added_modifiers = nil
end

-- ========================================
-- 主动技能逻辑(如果有)
-- ========================================
function OnSpellStart(keys)
    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 从 AbilityValues 读取参数
    local duration = ability:GetSpecialValueFor("active_duration")
    local radius = ability:GetSpecialValueFor("blast_radius")

    -- 实现主动技能逻辑
    -- 添加 buff/debuff
    caster:AddNewModifier(caster, ability, "modifier_xxx", { duration = duration })

    -- 播放特效和音效
    EmitSoundOn("DOTA_Item.XXX.Activate", caster)

    local particle = ParticleManager:CreateParticle("particles/xxx.vpcf", PATTACH_ABSORIGIN_FOLLOW, caster)
    ParticleManager:ReleaseParticleIndex(particle)

    -- 范围效果
    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(),
        caster:GetAbsOrigin(),
        nil,
        radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_NONE,
        FIND_ANY_ORDER,
        false
    )

    for _, enemy in pairs(enemies) do
        -- 造成伤害
        ApplyDamage({
            victim = enemy,
            attacker = caster,
            damage = damage,
            damage_type = DAMAGE_TYPE_MAGICAL,
            ability = ability
        })

        -- 应用 debuff(使用 DataDriven modifier)
        ability:ApplyDataDrivenModifier(caster, enemy, "modifier_item_<物品名>_debuff", {
            duration = duration * (1 - enemy:GetStatusResistance())
        })
    end
end

-- ========================================
-- 周期性伤害计算(DataDriven OnIntervalThink 调用)
-- ========================================
function <效果名>Tick(keys)
    if not IsServer() then return end

    local target = keys.target
    local caster = keys.caster
    local ability = keys.ability

    if not ability then return end

    local damage = ability:GetSpecialValueFor("tick_damage")

    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = ability
    })
end
```

**3.3 Lua 辅助 modifier(仅用于特殊功能)**

```lua
-- ========================================
-- Lua 辅助 modifier(处理 DataDriven 无法实现的功能)
-- ========================================
modifier_item_<物品名>_<特殊功能> = class({})

function modifier_item_<物品名>_<特殊功能>:IsHidden() return true end
function modifier_item_<物品名>_<特殊功能>:IsPurgable() return false end
function modifier_item_<物品名>_<特殊功能>:RemoveOnDeath() return true end

function modifier_item_<物品名>_<特殊功能>:GetAttributes()
    return MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_<物品名>_<特殊功能>:OnCreated()
    if IsServer() then
        if not self:GetAbility() then return end
        local ability = self:GetAbility()

        -- 从 ability 读取参数
        self.cooldown = ability:GetSpecialValueFor("cooldown_time")
        self.last_trigger_time = 0
    end
end

function modifier_item_<物品名>_<特殊功能>:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_ABSORB_SPELL,  -- 或其他必须用 Lua 的属性
    }
end

-- 实现特殊功能
function modifier_item_<物品名>_<特殊功能>:GetAbsorbSpell(params)
    if not IsServer() then return 0 end

    -- 检查是否是敌方技能
    local caster = params.ability:GetCaster()
    if not IsEnemy(caster, self:GetParent()) then return 0 end

    -- 检查冷却时间
    local current_time = GameRules:GetGameTime()
    if current_time - self.last_trigger_time < self.cooldown then
        return 0
    end

    self.last_trigger_time = current_time

    -- 播放特效
    local particle = ParticleManager:CreateParticle("particles/items_fx/immunity_sphere.vpcf",
        PATTACH_ABSORIGIN_FOLLOW, self:GetParent())
    ParticleManager:ReleaseParticleIndex(particle)

    EmitSoundOn("DOTA_Item.LinkensSphere.Activate", self:GetParent())

    return 1  -- 格挡成功
end
```

#### 步骤 4: 清理旧定义

如果优化前使用了 `RefreshItemDataDrivenModifier`:

1. **检查 Lua 代码**:

   ```lua
   // 旧代码中是否有这样的调用?
   RefreshItemDataDrivenModifier(_, self:GetAbility(), "modifier_item_<物品名>_stats")
   ```

2. **删除 npc_items_modifier.txt 中的旧定义**:
   ```kv
   // 删除这个块
   "modifier_item_<物品名>_stats"
   {
       "Properties" { ... }
   }
   ```

### 代码模式总结

**优化前 (item_lua)**:

```
Lua: 完整的 modifier class
├── DeclareFunctions() - 声明所有属性
├── GetModifier*() - 每帧计算属性
├── OnCreated() - 初始化
└── 特殊逻辑 - ABSORB_SPELL 等

KV: 仅物品定义和 AbilityValues
```

**优化后 (item_datadriven)**:

```
KV: 物品定义 + Modifiers 块
├── modifier_item_<物品名> (主 modifier)
│   ├── Properties 块 - 所有静态属性
│   ├── OnCreated - 调用 Lua 全局函数
│   └── OnDestroy - 调用 Lua 全局函数
├── modifier_item_<物品名>_debuff (临时效果)
│   └── Properties 块 - debuff 属性
└── modifier_item_<物品名>_aura (光环效果)
    └── OnIntervalThink - 调用 Lua 全局函数

Lua: 最小化代码
├── 全局回调函数
│   ├── <物品名>OnCreated(keys)
│   ├── <物品名>OnDestroy(keys)
│   ├── OnSpellStart(keys)
│   └── <效果名>Tick(keys)
└── Lua 辅助 modifier (仅特殊功能)
    └── modifier_item_<物品名>_<特殊功能>
        ├── DeclareFunctions() - 仅 ABSORB_SPELL 等
        └── GetAbsorbSpell() - 实现特殊逻辑
```

### 参考示例: item_beast_armor

**优化前问题**:

- 使用 `item_lua` BaseClass
- 所有属性在 Lua 中通过 `GetModifier*()` 计算
- 每帧调用 Lua,造成性能问题

**优化后实现**:

1. **BaseClass 改为 `item_datadriven`**
2. **静态属性迁移到 DataDriven**:
   - 力量、敏捷、智力
   - 生命值、魔法值、护甲、魔抗
   - 生命回复、魔法回复
   - 攻击力、闪避
3. **Lua 仅处理特殊逻辑**:
   - `modifier_item_beast_armor_passive` - ABSORB_SPELL (莲花格挡)
   - `BeastArmorOnCreated` - 添加刃甲和光环 modifier
   - `OnSpellStart` - 主动技能(刃甲+莲花+冰甲冲击波)
   - `RadianceBurnDamage` - 辉耀灼烧伤害计算
4. **完全 DataDriven 的 modifier**:
   - `modifier_item_beast_armor_debuff` - 减速 debuff (移速、攻速、魔抗)
   - `modifier_item_beast_armor_radiance_enemy_aura` - 辉耀光环 (致盲 + 灼烧)

### 优化效果

- ✅ 减少 Lua 代码量 60-80%
- ✅ 静态属性由引擎原生处理,无 Lua 调用
- ✅ 显著降低 CPU 占用,减少卡顿
- ✅ 保持功能完整性

### 重要注意事项

1. **属性限制**: 只优化可优化属性列表中的属性
2. **功能完整性**: 优化后必须与优化前功能完全一致
3. **代码简洁性**: 不保留已删除代码的注释
4. **测试验证**: 优化后必须测试所有功能
5. **特效和音效**: 确保所有特效和音效正常播放
6. **清理旧定义**: 如果之前使用了 `RefreshItemDataDrivenModifier`,优化后需要删除 `npc_items_modifier.txt` 中的旧 modifier 定义
7. **避免冗余代码**: 不需要 `SetSecondaryCharges` 等物品叠加显示逻辑,除非有特殊需求

---

## 使用此 Meta Prompt

当需要优化某个物品时,向 AI 提供:

1. 物品名称 (如 `item_beast_armor`)
2. 此 meta prompt 文档
3. 让 AI 按照步骤执行优化

AI 将自动:

1. 读取现有实现
2. 识别可优化的属性
3. 生成优化后的 KV 和 Lua 代码
4. 提供完整的文件修改说明
