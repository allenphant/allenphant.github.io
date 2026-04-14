# Frieren Liquid Text — Pixel Art Sprite Guide

## 格式規範

| 項目 | 規格 |
|------|------|
| 每格尺寸 | **64×64 px** per frame（所有角色統一） |
| 背景 | 純綠色 `#00FF00` 綠幕 |
| Sheet 格式 | **2×2 格**（4 幀）或 **1×2 格**（2 幀），直接給 process_sprite.py 處理 |
| 處理工具 | `python process_sprite.py <input.png> 64 <prefix>` |
| 輸出 | SVG only（去背 + 縮放），preview PNG 供選幀後刪除 |
| Canvas 渲染 | `ctx.imageSmoothingEnabled = false`，個別 SVG 載入，按幀序 drawImage |
| 風格 | Chibi 像素風，符合《葬送的芙莉蓮》角色造型 |

---

## ✅ 成功提示詞模板

所有提示詞基於以下格式（已驗證可用）：

> A clean 2x2 grid (A-D) consisting of four highly consistent **64x64 pixel art** frames of [角色描述] set against a solid pure green (`#00FF00`) background. [動作描述]. The variations across the four frames are minimal and subtle, focusing on [動態細節]. Highly consistent character appearance. Frame A (top-left) [說明]; Frame B (top-right) [說明]; Frame C (bottom-left) [說明]; Frame D (bottom-right) [說明].

---

## 角色 1：芙莉蓮（Frieren）— 玩家游標

**Canvas 顯示尺寸：128×128 px**（64×64 px SVG × 2）
**處理指令：** `python process_sprite.py <input.png> 64 frieren_<state>`

| 狀態 | 幀數 | 觸發條件（程式邏輯） | 檔案 |
|------|------|-------------------|------|
| `idle` | 4 幀 → 選用 f1, f3 | 速度 < 1 px/frame | `frieren_idle_f1.svg`, `frieren_idle_f3.svg` |
| `gliding` | 4 幀 → 待選 | 速度 1–8 px/frame | `frieren_gliding_f*.svg` |
| `dashing` | 2 幀 | 速度 > 8 px/frame | 待生成 |
| `attacking` | 4 幀 | 點擊後約 20 幀（0.33s） | 待生成 |
| `trapped` | 4 幀 | 被寶箱怪咬住期間 | 待生成 |

### 提示詞

#### `idle`（4 幀）✅ 已完成
靜止懸浮，馬尾與斗篷邊緣輕微飄動，身體微微上下浮動。

```
A clean 2x2 grid (A-D) horizontal sprite sheet consisting of four Highly consistent 64x64 pixel art frames of Chibi Frieren from *Frieren: Beyond Journey's End* (floating, front-facing or slight 3/4 view) set against a solid pure green (#00FF00) background. All four images depict Frieren in a calm, hovering idle pose. The variations across the four frames are minimal and subtle, focusing on the gentle, rhythmic floating motion — slight vertical shifts, gentle swaying of her white silver twin tails, and soft fluttering of her white cape hem. Highly consistent character appearance. Frame A (top-left) shows the base idle position; Frame B (top-right) has a slight upward float with hair shifted; Frame C (bottom-left) shows a slight downward dip; Frame D (bottom-right) returns near base ready to loop. Frieren is alone.
```

#### `gliding`（4 幀）✅ 已完成
身體微斜前傾，法杖平舉（側面），衣擺與頭髮向後飄，緩慢飛行感。

```
A clean 2x2 grid (A-D) horizontal sprite sheet consisting of four Highly consistent 64x64 pixel art frames of Chibi Frieren from *Frieren: Beyond Journey's End* (side profile view) set against a solid pure green (#00FF00) background. All four images depict Frieren in a continuous, graceful flying/gliding pose with her body tilted slightly forward. She holds her ornate mage staff (with the golden crescent head and red gem) horizontally (side view profile) in one hand. The variations across the four frames are minimal and subtle, focusing on the gentle, non-disruptive, rhythmic fluttering of her white hair and cape as they flow back behind her, captured in the slipstream, with only minor postural changes. Highly consistent character appearance. Frame A (top-left) shows the base fluttering pattern; Frame B (top-right) has a subtle vertical shift and a slightly higher billowing peak in the cape; Frame C (bottom-left) shows a lower billow with a ripple effect; Frame D (bottom-right) shows a minimal variant, ready to loop. These delicate variations focus solely on the dynamic flow to create a smooth, non-disruptive gliding animation cycle. Frieren is alone.
```

#### `dashing`（2 幀）⏳ 待生成
身體壓低流線，頭髮和衣擺完全拉向後方，高速衝刺感。

```
A clean 2x2 grid (A-D) consisting of four Highly consistent 64x64 pixel art frames of Chibi Frieren from *Frieren: Beyond Journey's End* (side profile view) set against a solid pure green (#00FF00) background. All frames depict Frieren in a high-speed dash pose — body crouched low and streamlined, white hair and cape swept completely straight back, speed-line effect. The four frames show subtle leg/cape variation for a looping dash cycle. Highly consistent character appearance. Frieren is alone.
```

#### `attacking`（4 幀）⏳ 待生成
施法準備→杖尖蓄力→施放瞬間→後座力退身。**注意：法杖在所有幀中始終在手，不消失；施放效果（光束）由遊戲程式另行渲染，sprite 只需呈現角色身體動作。**

已知問題（前版）：
- f2 爆炸特效太大，把角色和法杖都遮住了
- f3 法杖完全消失，手上什麼都沒有
- f0 揮桿動作太誇張，像棒球揮擊

```
A clean 2x2 grid (A-D) consisting of four Highly consistent 64x64 pixel art frames of Chibi Frieren from *Frieren: Beyond Journey's End* (side profile view, facing right) set against a solid pure green (#00FF00) background. Frieren is ALWAYS floating/hovering in the air — her feet never touch the ground in any frame. All four frames depict Frieren casting a spell while airborne — she is ALWAYS holding her ornate mage staff (with golden crescent head and red gem) in her hand throughout all frames. There are NO projectiles, NO beams, NO large explosions in any frame — only the character's body pose and a subtle glow at the staff tip where relevant. Frame A (top-left): Frieren floats in a firm casting stance — body slightly upright, staff held forward and level, feet dangling in the air; Frame B (top-right): staff crescent tip glows with a small teal-blue magical charge, body leaning slightly forward while still airborne; Frame C (bottom-left): peak release — Frieren's floating body is fully extended forward in effort, staff still firmly in hand pointing forward, only a brief bright flash/glow at the staff tip (not a full explosion); Frame D (bottom-right): recoil recovery — body floats slightly backward from the spell's force, staff pulled slightly back, minimal residual teal glow at the tip, feet still off the ground. Highly consistent character appearance. Frieren is alone.
```

#### `trapped`（4 幀）⏳ 待生成
上半身卡在寶箱怪嘴裡，雙腿在空中亂踢，手臂揮舞。

```
A clean 2x2 grid (A-D) consisting of four Highly consistent 64x64 pixel art frames of Chibi Frieren from *Frieren: Beyond Journey's End* (front view) set against a solid pure green (#00FF00) background. All frames depict Frieren with only her lower body visible — upper body swallowed/grabbed, legs kicking frantically in the air, arms flailing in panic. Frame A (top-left) shows legs kicking left; Frame B (top-right) shows legs kicking right; Frame C (bottom-left) shows a wild flail variant; Frame D (bottom-right) loops back toward Frame A. Highly consistent character appearance. Frieren is alone.
```

---

## 角色 2：費倫（Fern）— NPC 援救

**Canvas 顯示尺寸：128×128 px**
**處理指令：** `python process_sprite.py <input.png> 64 fern_<state>`

| 狀態 | 幀數 | 觸發條件 |
|------|------|---------|
| `running` | 4 幀 | 陷阱觸發後從左側跑來 |
| `pulling` | 2 幀 | 抵達 Mimic 旁，拔出芙莉蓮 |

#### `running`（4 幀）⏳ 待生成

```
A clean 2x2 grid (A-D) consisting of four Highly consistent 64x64 pixel art frames of Chibi Fern from *Frieren: Beyond Journey's End* (side profile view, facing right) set against a solid pure green (#00FF00) background. All frames depict Fern in an urgent running sprint cycle — dark purple dress, twin braids flying behind, worried serious expression. Frame A (top-left) right foot forward; Frame B (top-right) mid-stride airborne; Frame C (bottom-left) left foot forward; Frame D (bottom-right) mid-stride return. Highly consistent character appearance. Fern is alone.
```

#### `pulling`（2 幀）⏳ 待生成

```
A clean 1x2 grid (A-B) consisting of two Highly consistent 64x64 pixel art frames of Chibi Fern from *Frieren: Beyond Journey's End* (side profile view, facing right) set against a solid pure green (#00FF00) background. All frames depict Fern pulling someone with both arms extended forward, feet planted and braced, body leaning back with effort. Frame A (left) full strain pose; Frame B (right) slight shift variant for looping. Highly consistent character appearance. Fern is alone.
```

---

## 角色 3：寶箱怪（Mimic）— 右下角陷阱

**處理指令：** `python process_sprite.py <input.png> 64 mimic_<state>`

| 狀態 | 幀數 | 觸發條件 |
|------|------|---------|
| `closed` | 1 幀 | 常態 |
| `chomping` | 3 幀（1×3）| 進入 70px 範圍後瞬間張嘴 |
| `chewing` | 4 幀 | 咬住後搖晃循環 2.2 秒 |

#### `closed`（1 幀）⏳ 待生成

```
A single 64x64 pixel art frame of a fantasy treasure chest Mimic monster set against a solid pure green (#00FF00) background. The chest appears normal and closed — gold and brown wooden box, decorative metal latch, closed lid. Chibi style consistent with *Frieren: Beyond Journey's End* art direction.
```

#### `chomping`（3 幀）⏳ 待生成

```
A clean 1x3 grid (A-C) consisting of three Highly consistent 64x64 pixel art frames of a Mimic treasure chest monster set against a solid pure green (#00FF00) background. Frame A (left) lid barely cracked open; Frame B (center) lid half open revealing sharp teeth and red glowing interior; Frame C (right) lid fully snapped open, full teeth and tongue visible, menacing expression. Chibi style. Mimic is alone.
```

#### `chewing`（4 幀）⏳ 待生成

```
A clean 2x2 grid (A-D) consisting of four Highly consistent 64x64 pixel art frames of a Mimic treasure chest monster set against a solid pure green (#00FF00) background. All frames depict the Mimic chewing — jaw cycling open and closed, teeth and tongue visible, slight body wobble. Frame A open; Frame B mid-close; Frame C closed; Frame D mid-open. Chibi style. Mimic is alone.
```

---

## 角色 4：魔族（Demon）— 浮游標靶

**處理指令：** `python process_sprite.py <input.png> 64 demon_<state>`

| 狀態 | 幀數 | 觸發條件 |
|------|------|---------|
| `floating` | 3 幀（1×3）| 生成後持續飄浮 |
| `dying` | 4 幀 | Zoltraak 光束命中 |

#### `floating`（3 幀）⏳ 待生成

```
A clean 1x3 grid (A-C) consisting of three Highly consistent 64x64 pixel art frames of a small floating Demon from *Frieren: Beyond Journey's End* set against a solid pure green (#00FF00) background. Dark purple orb-like body, red glowing eyes, gentle hovering idle cycle with subtle rotation and size variation. Frame A base; Frame B slight swell; Frame C slight shrink, ready to loop. Chibi style. Demon is alone.
```

#### `dying`（4 幀）⏳ 待生成

```
A clean 2x2 grid (A-D) consisting of four Highly consistent 64x64 pixel art frames of a Demon orb death animation set against a solid pure green (#00FF00) background. Frame A (top-left) hit by magic — white flash impact; Frame B (top-right) cracking apart with teal blue energy; Frame C (bottom-left) dissolving into particles; Frame D (bottom-right) final sparse particles fading. Chibi style. Demon is alone.
```

---

## 使用方式（程式端備忘）

```typescript
// 載入個別 SVG 幀
import f1Src from '../animation/frieren_idle_f1.svg'
import f3Src from '../animation/frieren_idle_f3.svg'

const IDLE_FPS = 2  // fps
const idleFrames: HTMLImageElement[] = []
let idleLoaded = false, loadedCount = 0
for (const src of [f1Src, f3Src]) {
  const img = new Image()
  img.onload = () => { loadedCount++; if (loadedCount === 2) idleLoaded = true }
  img.src = src
  idleFrames.push(img)
}

// 渲染（以角色中心為原點）
ctx.imageSmoothingEnabled = false
const frameIdx = Math.floor(timestamp / (1000 / IDLE_FPS)) % idleFrames.length
ctx.drawImage(idleFrames[frameIdx], -CURSOR_SIZE/2, -CURSOR_SIZE/2, CURSOR_SIZE, CURSOR_SIZE)
```
