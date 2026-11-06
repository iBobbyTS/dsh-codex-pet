# 每宠插件导出工具

本指南的每宠导出及安装、选择和回滚流程面向 CLI 的 `web` profile，命令均从仓库根目录执行。Desktop 请按[运行时安装说明](../README.md#安装)安装 `packages/dsh-codex-pet`，再到「设置 → 桌宠」导入图集；运行时无需执行 `node build.js`。

### 安装步骤（零基础，照着做就行）

**开始前需要两样**：① 电脑装了 [Node.js](https://nodejs.org/)（运行 `node` 用）；② 已经装好、能跑起来的 DeepSeek Harness（DSH）。

**第 1 步：拿到代码**

- 点仓库页绿色 **Code → Download ZIP**，下载后**解压**，得到一个 `dsh-codex-pet` 文件夹；
- 或命令行克隆：`git clone https://github.com/iBobbyTS/dsh-codex-pet.git`

**第 2 步：打开 PowerShell（位置要对）**

1. 用文件资源管理器进入解压出来的 `dsh-codex-pet` 文件夹；
2. 在文件夹**空白处**，按住 **Shift** 键 + **鼠标右键**；
3. 菜单里选 **"在此处打开 PowerShell 窗口"**（Windows 11 可能是"在终端中打开"，一样）。

窗口里光标前面显示着 `...\codex-to-dsh-pet`，就说明位置对了。

**第 3 步：放图集**

把桌宠图集（`.webp` 图片）**改名成你想叫的宠物名**（如 `nastya.webp`），**拖进** `dsh-codex-pet` 文件夹。

**第 4 步：运行两条命令**

在 PowerShell 窗口里依次输入下面两条，**每条输完按 Enter**：

```powershell
node build.js
```

```powershell
.\install-to-dsh.ps1
```

看到 `Done.` 就成功了。

**第 5 步：刷新生效**

对于 CLI 的 `web` profile，按需重启 `dsh web` 并硬刷新对应浏览器页面。这些脚本不会安装或刷新 Desktop 的 `desktop` profile。

> **常见报错**：
> - 出现「禁止运行脚本」→ 先输入 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 回车（选 `Y`），再重跑第 4 步。
> - 出现「`node` 不是内部或外部命令」→ 还没装 Node.js，去 [nodejs.org](https://nodejs.org/) 装一下。
> - 装了多个桌宠后想切换，用 `.\select-pet.ps1`（见下文）。

---

### 1. 准备素材

把一张 Codex 桌宠的 spritesheet **命名成你的宠物名**（如 `fluffy.webp`）放进本目录。
插件名会自动取自这个文件名——一张图集 = 一个插件。

### 2. 配置（可选）

`name` / `label` **不用填**（自动从图集文件名推导）。只有需要改尺寸、归一化、
气泡文案等时才建 `config.json`：

```powershell
Copy-Item config.example.json config.json
```

`config.json` 字段（`name`/`label` 可省略，缺省取图集文件名）：

| 字段 | 说明 | 默认 |
|---|---|---|
| `name` | 插件名（也是 node_modules 目录名 / 注册名） | **图集文件名** |
| `label` | 悬浮层里显示的标签 | **图集文件名** |
| `spritesheetPath` | 图集相对路径 | 自动检测 |
| `spriteVersionNumber` | 图集版本：`1`（8×9）或 `2`（8×11，含注视帧） | **自动检测**（按图集尺寸 1872/2288） |
| `size` | 显示宽度 px | `120` |
| `pin` | 初始位置（`bottom-right` / `bottom-left` / …） | `bottom-right` |
| `normalize` | 可选：逐行尺寸归一化 `[null, …, { s, cx, cy }, …]` | 无 |
| `look.enabled` | 是否开启「眼睛跟随鼠标」；旧版桌宠（无注视帧）设为 `false` | `true` |
| `look.deadzone` | 注视死区（px，指针距桌宠中心小于该值不触发） | `28` |
| `bubble.enabled` | 是否显示进度气泡 | `true` |
| `bubble.maxChars` | 流式文本截取长度 | `140` |
| `bubble.runningText` | 工具运行时文案（`{tool}` 会被替换成工具名） | `运行中：{tool}…` |
| `bubble.workingText` | 工作但无工具名时的文案 | `工作中…` |
| `bubble.thinkingText` | 思考时的文案 | `思考中…` |

> 💡 **版本自动识别**：build.js 会按图集尺寸自动判断 v1/v2——高 **1872px = v1**
> （9 行，无注视帧，自动关闭鼠标追踪），高 **2288px = v2**（11 行，含 16 方向注视帧，
> 自动开启鼠标追踪）。所以**一般不需要手动设 `spriteVersionNumber`**；只有当你的图集
> 不是标准尺寸时，才需要在 `config.json` 里显式指定。

### 3. 构建

```powershell
node build.js
```

会自动检测图集、从文件名推导宠物名，生成自包含的 `lib/client.js` 和
`config.effective.json`。

只想构建**指定的一张图集**时，可以用一步命令（写 `config.json` + 跑 `build.js`）：

```powershell
.\build-pet.ps1 nastya                                   # 名字与图集文件名一致
.\build-pet.ps1 nastya -NodePath C:\path\to\node.exe     # 指定 node 路径（一般不用）
```

构建后可以运行冒烟测试验证产物：

```powershell
node verify-bundle.cjs
```

### 4. 安装到 DSH

```powershell
.\install-to-dsh.ps1
```

脚本会自动定位 DSH home，复制插件到 `<DSH home>/profiles/node_modules/<name>`，
并注册到 `<DSH home>/profiles/web/cordis.patch.yml`（幂等、自动备份）。

> **DSH home 定位**（`install-to-dsh.ps1` / `select-pet.ps1` 通用，按序探测）：
> 1. `$env:DSH_HOME`（若已设置则优先）；
> 2. `~/.dsh`（命令行版 dsh 的常规位置，存在才用）；
> 3. `%APPDATA%\io.github.hairyf.deepseek-harness-desktop\data\dsh`
>    （DeepSeek Harness **桌面应用**的数据目录）。
>
> 命令行版用户通常在 `~/.dsh`；桌面应用版用户通常在 `%APPDATA%\...\data\dsh`。
> 探测到桌面应用数据目录不等于选中 `desktop` profile：脚本仍固定写入 `profiles/web`。Desktop 请使用[运行时安装说明](../README.md#安装)，不使用这套每宠安装流程。
> 探测逻辑统一放在 `dsh-home.ps1`（install / select 脚本共用），想自定义改它即可。

### 5. 刷新生效

对于 CLI 的 `web` profile，按需重启 `dsh web` 并硬刷新对应浏览器页面。这些脚本不会安装或刷新 Desktop 的 `desktop` profile。

```powershell
dsh web
```

### 6. 选择激活哪个桌宠（仅旧式每宠插件）

`select-pet.ps1` 只管理**旧式每宠插件**（`build.js` 构建、位于 `node_modules` 顶层、
只有 `dsh.client` 的插件）：

```powershell
.\select-pet.ps1          # 交互菜单：输入序号切换，q 保存退出
.\select-pet.ps1 -List    # 只查看当前状态，不修改
```

它会扫描 `node_modules`（含 `@scope/` 子目录）里所有桌宠插件：旧式每宠插件可切换
激活状态；scoped 运行时插件（如 `@signalight/dsh-codex-pet`）仅作为信息列出、**不会
被本脚本改动**（其桌宠请在「设置 → 桌宠」里管理）。保存时只重写旧式每宠插件的
`- insert:` 行，其余补丁条目一律保留（自动备份）。改完浏览器硬刷新即可生效。

## 图集格式

Codex 桌宠图集是固定布局的精灵图：

| 项 | 值 |
|---|---|
| 帧尺寸 | 192 × 208 px |
| 列数 | 8 |
| v1 行数 | 9（1536 × 1872） |
| v2 行数 | 11（1536 × 2288，第 9、10 行是 16 方向注视帧） |

逐行动画（帧间隔 ms）：

| 行 | 动画 | 帧数 | 间隔 |
|---|---|---|---|
| 0 | idle 待机 | 6 | 160 |
| 1 | runningRight 向右跑 | 8 | 120 |
| 2 | runningLeft 向左跑 | 8 | 120 |
| 3 | waving 挥手 | 4 | 140 |
| 4 | jumping 跳跃 | 5 | 140 |
| 5 | failed 失败 | 8 | 140 |
| 6 | waiting / sleeping 等待·睡觉 | 6 | 150 |
| 7 | running 奔跑 | 6 | 120 |
| 8 | review 审阅 | 6 | 150 |
| 9–10 | look（16 方向注视） | 16 | — |

## 目录结构

```
.
├── config.example.json     # 示例配置
├── build.js                # 内联图集 + 配置 → lib/client.js（名字取自图集文件名）
├── verify-bundle.cjs       # 构建产物冒烟测试
├── build-pet.ps1           # 一条命令构建指定桌宠（可选 -NodePath）
├── dsh-home.ps1            # 共享的 DSH home 探测（install / select 共用）
├── install-to-dsh.ps1      # 一键安装
├── select-pet.ps1          # 选择激活哪个桌宠
├── README.md               # 中文说明
├── README.en.md            # English README
├── lib/
│   ├── index.js            # 宿主（Node）半身
│   ├── client.template.js  # 生成模板（源码：src/client.template.ts）
│   └── client.js           # 构建产物（build.js 生成，已 gitignore）
├── LEGAL.md                # 版权与许可说明
└── LICENSE
```

## 回滚

```powershell
# 复用与安装脚本相同的 DSH home 探测（dsh-home.ps1）
. .\dsh-home.ps1
$profileDir = Join-Path (Get-DshHome) 'profiles\web'
$nodeModules = Join-Path (Split-Path -Parent $profileDir) 'node_modules'

Remove-Item -Recurse -Force (Join-Path $nodeModules '<name>')
Copy-Item "$profileDir\cordis.patch.yml.bak" "$profileDir\cordis.patch.yml" -Force
# 仅限 CLI web profile：按需重启 dsh web 后刷新对应浏览器页面
```

[返回项目入口](../README.md)。所有命令均从仓库根目录执行。运行时插件无需执行此导出流程。
