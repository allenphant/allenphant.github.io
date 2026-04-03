# CVwebsite 完整網站指南

> 這份文件涵蓋網站的所有設計、架構、以及每一個可自訂的部分。
> 目標：讓你不需要問任何人，就能自己修改網站的任何內容。

---

## 目錄

1. [專案架構總覽](#1-專案架構總覽)
2. [技術棧說明](#2-技術棧說明)
3. [檔案結構與用途](#3-檔案結構與用途)
4. [全域設定：改一次影響全站](#4-全域設定改一次影響全站)
5. [逐頁修改指南](#5-逐頁修改指南)
6. [元件修改指南](#6-元件修改指南)
7. [視覺風格自訂](#7-視覺風格自訂)
8. [GitHub API 資料層](#8-github-api-資料層)
9. [自動部署與更新機制](#9-自動部署與更新機制)
10. [常見操作速查表](#10-常見操作速查表)

---

## 1. 專案架構總覽

```
CVwebsite/
├── .github/workflows/
│   └── deploy.yml              ← 自動部署設定
├── public/                     ← 靜態檔案（直接複製到輸出）
│   ├── favicon.svg             ← 瀏覽器標籤圖示
│   ├── robots.txt              ← SEO 爬蟲設定
│   └── resume.pdf              ← 履歷下載（需自行放入）
├── src/
│   ├── components/             ← 可重用元件
│   │   ├── Hero.astro          ← 首頁大橫幅
│   │   ├── Navbar.astro        ← 導覽列
│   │   ├── Footer.astro        ← 頁尾
│   │   ├── ProjectCard.astro   ← 專案卡片（靜態版）
│   │   ├── ProjectSearch.tsx   ← 專案搜尋篩選（React 互動）
│   │   ├── SkillChart.tsx      ← 語言分佈甜甜圈圖（React 互動）
│   │   └── ContactForm.tsx     ← 聯絡表單（React 互動）
│   ├── data/
│   │   └── projects.json       ← 精選/隱藏 repo 設定
│   ├── layouts/
│   │   └── BaseLayout.astro    ← 全站 HTML 模板
│   ├── lib/
│   │   ├── github.ts           ← GitHub API 整合
│   │   └── types.ts            ← TypeScript 型別定義
│   ├── pages/                  ← 每個檔案 = 一個頁面路由
│   │   ├── index.astro         ← 首頁 (/)
│   │   ├── about.astro         ← 關於頁 (/about)
│   │   ├── projects.astro      ← 專案頁 (/projects)
│   │   ├── skills.astro        ← 技能頁 (/skills)
│   │   └── contact.astro       ← 聯絡頁 (/contact)
│   └── styles/
│       └── global.css          ← 全域樣式 + 色彩主題
├── .env                        ← 環境變數（PAT、username）
├── astro.config.mjs            ← Astro 框架設定
├── package.json                ← 依賴管理
└── tsconfig.json               ← TypeScript 設定
```

**核心概念**：Astro 是靜態網站產生器。`src/pages/` 裡的每個 `.astro` 檔在建構時被編譯成 HTML。React 元件（`.tsx`）只在需要互動時才載入 JavaScript（Astro 稱為 Island Architecture）。

---

## 2. 技術棧說明

| 技術 | 用途 | 為什麼選它 |
|------|------|-----------|
| **Astro 6.x** | 網站框架 | 零 JS 預設、超快載入、Island 架構 |
| **Tailwind CSS 4.x** | 樣式 | 直接在 HTML 寫 class、不需要獨立 CSS 檔 |
| **React 19** | 互動元件 | 搜尋篩選、圖表、表單需要 JavaScript |
| **Framer Motion** | 動畫 | 專案卡片進出場動畫 |
| **Chart.js** | 圖表 | 語言分佈甜甜圈圖 |
| **@octokit/graphql** | GitHub API | 一次查詢取得所有 repo 資料 |
| **GitHub Actions** | 部署 | 自動建構 + 部署到 GitHub Pages |

---

## 3. 檔案結構與用途

### `.astro` 檔案的結構

每個 `.astro` 檔分為兩個區塊：

```astro
---
// 這是「frontmatter」區塊（上半部，三條橫線之間）
// 在這裡寫 JavaScript/TypeScript 邏輯
// 只在建構時執行，不會送到瀏覽器
const greeting = "Hello";
---

<!-- 這是「模板」區塊（下半部） -->
<!-- 寫 HTML + Tailwind CSS class -->
<h1>{greeting}</h1>
```

### `.tsx` 檔案

React 元件，用於需要**瀏覽器端互動**的功能。在 `.astro` 檔中用 `client:load` 指令載入：

```astro
<MyReactComponent client:load someProp={data} />
```

---

## 4. 全域設定：改一次影響全站

### 4-A：環境變數（`.env`）

```env
GITHUB_PAT=你的token       ← GitHub API 存取權杖
GITHUB_USERNAME=allenphant  ← 你的 GitHub 帳號名
```

**注意**：`.env` 不會被 git 追蹤（在 `.gitignore` 裡）。部署時需要在 GitHub Secrets 另外設定。

### 4-B：網站 URL（`astro.config.mjs`）

```javascript
// 第 11 行
site: 'https://allenphant.github.io',
```

**什麼時候改**：如果你的 repo 不叫 `allenphant.github.io`，或你用自訂網域。
- 如果 repo 叫 `portfolio`，改成 `'https://allenphant.github.io/portfolio'`
- 如果用自訂網域，改成 `'https://你的網域.com'`

### 4-C：全站標題與 SEO（`src/layouts/BaseLayout.astro`）

| 行數 | 內容 | 說明 |
|------|------|------|
| 14 | `description = "Full-stack developer passionate about building great software."` | 當個別頁面沒設定 description 時的預設值。**改成你的自我描述** |
| 18 | `${title} \| allenphant` | 瀏覽器標籤顯示的格式，例如「About \| allenphant」。**改成你的名字** |
| 19 | `"https://allenphant.github.io"` | canonical URL 的 fallback |
| 43 | `href="/favicon.svg"` | 網站小圖示，替換 `public/favicon.svg` 即可 |
| 49 | Google Fonts 連結 | 目前用 Inter（內文）+ JetBrains Mono（程式碼）。想換字體改這裡 |

### 4-D：導覽列（`src/components/Navbar.astro`）

| 行數 | 內容 | 說明 |
|------|------|------|
| 2-8 | `navLinks` 陣列 | 控制導覽列有哪些連結。想加頁面就加一項，例如 `{ href: "/blog", label: "Blog" }` |
| 17 | `allenphant` | 左上角的 Logo 文字。**改成你的名字或品牌名** |

**新增頁面的方式**：
1. 在 `src/pages/` 建立新的 `.astro` 檔（例如 `blog.astro`）
2. 在 `Navbar.astro` 第 2-8 行的 `navLinks` 加一項

### 4-E：頁尾（`src/components/Footer.astro`）

| 行數 | 內容 | 說明 |
|------|------|------|
| 5 | `href: "https://github.com/allenphant"` | GitHub 連結 |
| 11 | `href: "https://linkedin.com/in/allenphant"` | LinkedIn 連結。**改成你的真實網址，或刪除整個物件** |
| 16 | `href: "mailto:contact@allenphant.dev"` | Email 連結。**改成你的信箱** |
| 25 | `allenphant` | 版權文字中的名字 |

**想加其他社群（例如 Twitter/X）**：在 `socialLinks` 陣列加一個物件，格式：

```javascript
{
  label: "Twitter",
  href: "https://twitter.com/你的帳號",
  icon: `<path d="..." />`,  // 去 heroicons.com 或 simpleicons.org 找 SVG path
},
```

---

## 5. 逐頁修改指南

### 5-A：首頁（`src/pages/index.astro`）

**頁面結構**：Hero 大橫幅 → 精選專案 → 技能概覽

| 行數 | 內容 | 說明 |
|------|------|------|
| 44 | `description="...Full-stack developer portfolio..."` | 此頁的 SEO 描述。**改成你的描述** |
| 57 | `Featured Projects` | 標題文字 |
| 58 | `Highlights from my recent work` | 副標題文字 |
| 107 | `Skills` | 技能區塊標題 |
| 108 | `Technologies I work with` | 技能區塊副標題 |

**精選專案的邏輯**（第 25-36 行）：
- 如果 `projects.json` 有設定 `featured` → 顯示你指定的 repo
- 如果沒設定 → 自動顯示星星數最高的 4 個 repo
- 最多顯示 4 個（第 29 行的 `.slice(0, 4)` 控制）

### 5-B：關於頁（`src/pages/about.astro`）

| 行數 | 內容 | 說明 |
|------|------|------|
| 14-27 | `experiences` 陣列 | **你的經歷時間軸**。每個物件有 `title`（職稱/學位）、`company`（公司/學校）、`period`（期間）、`description`（描述） |
| 62 | `profile?.bio \|\| "I'm a software developer..."` | 如果 GitHub bio 是空的，會顯示這段 fallback 文字。**改成你的介紹** |
| 65-68 | `I enjoy solving complex problems...` | About Me 的第二段文字。**改成你自己的話** |
| 84 | `new Date().getFullYear() - 2020` | 計算 coding 年資。`2020` 是起算年份。**改成你開始寫程式的年份** |
| 120-129 | `Download Resume` 按鈕 | 連到 `/resume.pdf`。你需要把 PDF 放到 `public/resume.pdf` |

**想增減經歷**：直接在 `experiences` 陣列加減物件就好，由上到下 = 由新到舊。

**想拿掉「Years Coding」卡片**：刪除第 82-88 行。

**想拿掉整個 Quick Stats 區塊**：刪除第 72-89 行。

### 5-C：專案頁（`src/pages/projects.astro`）

| 行數 | 內容 | 說明 |
|------|------|------|
| 26 | `Projects` | 頁面標題 |
| 27-29 | 描述文字 | 可自訂 |

專案的搜尋篩選邏輯在 `ProjectSearch.tsx`，詳見[元件修改指南](#6-元件修改指南)。

### 5-D：技能頁（`src/pages/skills.astro`）

| 行數 | 內容 | 說明 |
|------|------|------|
| 25-42 | `skillCategories` 陣列 | **你的技能分類**。每個物件有 `title`（分類名）和 `skills`（技能列表） |
| 49 | `Skills` | 頁面標題 |
| 51 | 描述文字 | 會自動帶入 repo 數量 |

**修改技能分類**：

```javascript
const skillCategories = [
  {
    title: "分類名稱",        // 例：AI / ML
    skills: ["技能1", "技能2", "技能3"],
  },
  // ...可以有任意多個分類
];
```

**語言分佈甜甜圈圖**：資料從 GitHub API 自動取得，不需手動設定。它統計你所有 public repo 的語言比例。

### 5-E：聯絡頁（`src/pages/contact.astro`）

| 行數 | 內容 | 說明 |
|------|------|------|
| 11 | `Get in Touch` | 頁面標題 |
| 12-13 | `Have a question or want to work together?...` | 副標題 |
| 20 | `mailto:contact@allenphant.dev` | Email 連結。**改成你的信箱** |
| 29 | `https://github.com/allenphant` | GitHub 連結 |
| 40 | `https://linkedin.com/in/allenphant` | LinkedIn 連結。**改成你的網址** |

**Formspree 表單設定**：見 `src/components/ContactForm.tsx` 第 14 行，把 `YOUR_FORM_ID` 換成你在 Formspree 建立的表單 ID。

---

## 6. 元件修改指南

### 6-A：Hero 大橫幅（`src/components/Hero.astro`）

| 行數 | 內容 | 說明 |
|------|------|------|
| 28 | `Hello, I'm` | 打招呼文字 |
| 71-76 | `roles` 陣列 | **打字動畫輪播的身份文字**。預設是 `"Full-Stack Developer"` 等工程師描述 |

**重要**：第 71-76 行是你最需要改的地方之一。改成符合你的身份：

```javascript
const roles = [
  "Hobbyist Developer",
  "Creative Coder",
  "Tech Enthusiast",
  "Lifelong Learner",
];
```

| 行數 | 內容 | 說明 |
|------|------|------|
| 53-56 | `View Projects` 按鈕 | 可改文字或連結 |
| 59-63 | `Get in Touch` 按鈕 | 可改文字或連結 |
| 13-18 | 背景光球動畫 | 三個漸層色球。改顏色調整 `bg-primary-500/20` 等 class |

### 6-B：專案卡片（`src/components/ProjectCard.astro`）

這是首頁精選區塊使用的靜態卡片元件。

| 行數 | 內容 | 說明 |
|------|------|------|
| 37 | `"No description provided."` | repo 沒有 description 時的 fallback 文字 |
| 75 | `.slice(0, 4)` | 每張卡片最多顯示 4 個 topics 標籤 |

### 6-C：專案搜尋（`src/components/ProjectSearch.tsx`）

這是專案頁使用的 React 互動元件，有即時搜尋和語言篩選功能。

| 行數 | 內容 | 說明 |
|------|------|------|
| 65 | `"Search projects..."` | 搜尋框 placeholder 文字 |
| 181 | `.slice(0, 3)` | 搜尋結果卡片最多顯示 3 個 topics |
| 196-199 | `No projects found...` | 搜尋無結果時的提示文字 |

### 6-D：技能圖表（`src/components/SkillChart.tsx`）

| 行數 | 內容 | 說明 |
|------|------|------|
| 17 | `.slice(0, 10)` | 甜甜圈圖最多顯示幾種語言 |
| 47 | `cutout: "70%"` | 甜甜圈的中心空洞大小 |

### 6-E：聯絡表單（`src/components/ContactForm.tsx`）

| 行數 | 內容 | 說明 |
|------|------|------|
| 14 | `https://formspree.io/f/YOUR_FORM_ID` | **Formspree 表單 endpoint**。替換 `YOUR_FORM_ID` |
| 39 | `Message Sent!` | 送出成功的標題 |
| 40 | `Thanks for reaching out...` | 送出成功的描述 |
| 111-113 | `Something went wrong...` | 送出失敗的提示 |

---

## 7. 視覺風格自訂

所有視覺主題定義在 `src/styles/global.css`。

### 7-A：色彩主題（第 3-28 行）

```css
@theme {
  /* 主色（目前是靛藍色 indigo） */
  --color-primary-50: #eef2ff;    /* 最淺 */
  --color-primary-500: #6366f1;   /* 主要 */
  --color-primary-900: #312e81;   /* 最深 */

  /* 強調色（目前是青色 cyan） */
  --color-accent-400: #22d3ee;
  --color-accent-500: #06b6d4;

  /* 背景色（深灰） */
  --color-surface-950: #010410;   /* 頁面背景 */
  --color-surface-800: #0f172a;   /* 卡片背景 */

  /* 字體 */
  --font-sans: "Inter", ...;      /* 內文字體 */
  --font-mono: "JetBrains Mono";  /* 程式碼字體 */
}
```

**想換主色**：把所有 `--color-primary-*` 的值換掉。可以用 [Tailwind Color Generator](https://uicolors.app/create) 產生一整套色階。

**想換字體**：
1. 在 `BaseLayout.astro` 第 48-50 行改 Google Fonts 連結
2. 在 `global.css` 第 26-27 行改 `--font-sans` 和 `--font-mono`

### 7-B：自訂 CSS 效果

| 效果名 | 行數 | 外觀 | 用在哪 |
|--------|------|------|--------|
| `glass` | 50-55 | 半透明磨砂玻璃卡片 | 卡片、區塊背景 |
| `glass-hover` | 57-68 | 同上 + hover 時發光邊框 | 可互動的卡片 |
| `glow` | 70-73 | 靛藍色外發光 | 按鈕、重點元素 |
| `glow-accent` | 75-78 | 青色外發光 | 強調元素 |
| `gradient-text` | 80-85 | 漸層色文字 | 標題、Logo |
| `section-container` | 87-101 | 頁面內容最大寬度 + 響應式 padding | 所有區段 |

**想改玻璃卡片的透明度**：調 `glass` 中的 `rgba(255, 255, 255, 0.05)` 數值，越大越不透明。

**想改發光顏色**：調 `glow` 中的 `rgba(99, 102, 241, 0.15)` — `99, 102, 241` 是 indigo 的 RGB。

---

## 8. GitHub API 資料層

### 8-A：資料如何運作

1. **建構時**（`npm run build` 或 `npm run dev`），`src/lib/github.ts` 用 GraphQL API 查詢你的 GitHub 資料
2. API 回傳的資料被傳入各頁面的 frontmatter 區塊
3. 頁面用這些資料產生靜態 HTML
4. **不是即時的** — 訪客看到的是建構那一刻的快照

### 8-B：API 抓了什麼資料

**使用者資料**（`fetchUserProfile`）：
- 名字、頭像、bio、位置、公司
- followers 數、public repo 數
- GitHub 個人頁網址

**Repo 資料**（`fetchUserRepos`）：
- 名稱、描述、網址、首頁連結
- 星星數、fork 數
- 建立 / 更新時間
- 是否 archived、是否 fork
- 主要語言（含顏色）
- 所有語言的大小分佈
- Topics 標籤

### 8-C：精選與隱藏 Repo（`src/data/projects.json`）

```json
{
  "featured": [
    {
      "repoName": "my-awesome-project",
      "customDescription": "可選：自訂描述，覆蓋 GitHub 上的 description"
    },
    {
      "repoName": "another-project"
    }
  ],
  "hidden": [
    "repo-i-dont-want-to-show",
    "old-test-repo"
  ]
}
```

- `repoName` 必須跟 GitHub repo 名稱**完全一致**（大小寫敏感）
- `featured` 的順序 = 首頁顯示的順序
- `hidden` 裡的 repo 不會出現在任何頁面

### 8-D：GitHub Topics（給 Repo 加標籤）

API 已經在抓 Topics 資料了（`github.ts` 第 88-91 行）。專案卡片也已經會顯示 Topics。

**如何在 GitHub 加 Topics**：
1. 打開你的 repo 頁面
2. 點擊 repo 名稱下方齒輪圖示（About 區塊旁邊）
3. 在 **Topics** 欄位輸入標籤（例如 `python`、`web-app`、`game`）
4. 按 Enter 儲存

Topics 會在下次網站重建時自動顯示在專案卡片上。

---

## 9. 自動部署與更新機制

### 9-A：部署檔案（`.github/workflows/deploy.yml`）

**觸發條件**：

| 觸發方式 | 說明 |
|----------|------|
| `push: branches: [main]` | 每次 push 到 main 分支自動重建 |
| `schedule: cron: "0 0 * * 0"` | 每週日 UTC 00:00 自動重建（拉取最新 GitHub 資料） |
| `workflow_dispatch` | 手動觸發（在 GitHub Actions 頁面按 Run workflow） |
| `repository_dispatch: types: [repo-updated]` | 被其他 repo 的 webhook 觸發 |

### 9-B：當你更新其他 Repo 時自動重建網站

網站在**建構時**從 GitHub API 拉資料產生靜態頁面。當你更新了其他 repo（例如加了新的 commit 或改了 description），網站不會立刻反映。

要讓其他 repo 有更新時自動觸發重建，需要以下設定：

**步驟 1**：在你要監控的 repo 建立一個 workflow 檔

在該 repo 建立 `.github/workflows/notify-portfolio.yml`：

```yaml
name: Notify Portfolio

on:
  push:
    branches: [main]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger portfolio rebuild
        run: |
          curl -X POST \
            -H "Accept: application/vnd.github.v3+json" \
            -H "Authorization: token ${{ secrets.PORTFOLIO_PAT }}" \
            https://api.github.com/repos/allenphant/allenphant.github.io/dispatches \
            -d '{"event_type": "repo-updated"}'
```

**步驟 2**：在該 repo 的 Settings → Secrets → Actions 加入 `PORTFOLIO_PAT`
- 值就是你的 GitHub PAT（跟部署用的同一個）
- 這個 PAT 需要有 `repo` scope 才能觸發 dispatch

**步驟 3**：完成！之後這個 repo 的 main 分支有 push 時，會自動通知 portfolio 網站重建。

**想監控多個 repo**：對每個 repo 重複步驟 1-2。

**更簡單的替代方案**：如果不想設定 webhook，可以調高 cron 頻率：

```yaml
schedule:
  # 每天重建一次
  - cron: "0 0 * * *"

  # 每 6 小時重建一次
  - cron: "0 */6 * * *"
```

修改 `.github/workflows/deploy.yml` 第 8 行的 cron 表達式即可。

### 9-C：手動觸發重建

1. 前往 GitHub repo 的 **Actions** 頁面
2. 點擊左側的 **Deploy to GitHub Pages**
3. 點擊 **Run workflow** → **Run workflow**

### 9-D：GitHub Secrets 設定

部署需要的 secret（在 repo Settings → Secrets → Actions）：

| Secret 名稱 | 值 | 用途 |
|-------------|------|------|
| `GH_PAT` | 你的 GitHub Personal Access Token | 建構時讓 API 抓取 repo 資料 |

---

## 10. 常見操作速查表

### 改文字內容

| 我想改... | 檔案 | 行數 |
|----------|------|------|
| 導覽列 Logo 文字 | `src/components/Navbar.astro` | 17 |
| 導覽列連結 | `src/components/Navbar.astro` | 2-8 |
| 首頁打字動畫文字 | `src/components/Hero.astro` | 71-76 |
| 首頁 Hero 打招呼文字 | `src/components/Hero.astro` | 28 |
| 首頁 SEO 描述 | `src/pages/index.astro` | 44 |
| 全站預設 SEO 描述 | `src/layouts/BaseLayout.astro` | 14 |
| 全站標題後綴 | `src/layouts/BaseLayout.astro` | 18 |
| About Me 介紹文字 | `src/pages/about.astro` | 62-68 |
| 經歷時間軸 | `src/pages/about.astro` | 14-27 |
| Coding 年資起算年份 | `src/pages/about.astro` | 84 |
| 技能分類 | `src/pages/skills.astro` | 25-42 |
| 聯絡頁標題和副標題 | `src/pages/contact.astro` | 11-13 |
| 頁尾版權文字 | `src/components/Footer.astro` | 25 |

### 改連結

| 我想改... | 檔案 | 行數 |
|----------|------|------|
| GitHub 連結 | `src/components/Footer.astro` | 5 |
| LinkedIn 連結 | `src/components/Footer.astro` | 11 |
| Email 地址（頁尾） | `src/components/Footer.astro` | 16 |
| Email 地址（聯絡頁） | `src/pages/contact.astro` | 20 |
| GitHub 連結（聯絡頁） | `src/pages/contact.astro` | 29 |
| LinkedIn 連結（聯絡頁） | `src/pages/contact.astro` | 40 |
| Formspree 表單 ID | `src/components/ContactForm.tsx` | 14 |
| 網站 URL | `astro.config.mjs` | 11 |

### 改視覺

| 我想改... | 檔案 | 行數 |
|----------|------|------|
| 主色（indigo → 其他） | `src/styles/global.css` | 4-13 |
| 強調色（cyan → 其他） | `src/styles/global.css` | 15-17 |
| 頁面背景色 | `src/styles/global.css` | 19-24 |
| 字體 | `src/styles/global.css` 26-27 + `BaseLayout.astro` 48-50 |
| 玻璃卡片透明度 | `src/styles/global.css` | 51 |
| 網站小圖示 | 替換 `public/favicon.svg` |

### 管理專案

| 我想... | 怎麼做 |
|---------|--------|
| 精選某些 repo | 編輯 `src/data/projects.json` 的 `featured` 陣列 |
| 隱藏某些 repo | 編輯 `src/data/projects.json` 的 `hidden` 陣列 |
| 給 repo 加標籤 | 在 GitHub repo 頁面 → About 齒輪 → 加 Topics |
| 放履歷 PDF | 把 `resume.pdf` 放到 `public/` 資料夾 |
| 加新頁面 | 在 `src/pages/` 建新 `.astro` 檔 + 在 `Navbar.astro` 加連結 |
| 手動觸發重建 | GitHub → Actions → Run workflow |

### 常用指令

```bash
npm run dev        # 本機預覽（http://localhost:4321）
npm run build      # 建構靜態網站到 dist/
npm run preview    # 預覽建構結果
```
