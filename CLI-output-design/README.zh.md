# CLI 输出设计

> 一个 Claude skill，让任何 CLI 的终端输出做到**准确、人类可用、AI 可用、且美观**——
> 颜色、符号、状态与进度、错误、排版、机器/JSON 输出，以及对管道、`NO_COLOR`、CI 的优雅降级。

[English](./README.md) · **中文**

---

## 为什么需要它

大多数 CLI 是一行 `print` 一行 `print` 攒出来的，毛病一眼能看出来：进度条卡在 99%、
`Error: failed` 不说原因、ANSI 转义码漏进管道、`--json` 里混着人类话术、表格在窄终端里
散架。输出看着像临时拼的——因为它就是。

这个 skill 给 AI agent（或与之结对的你）一份精简、有主张的终端输出手册——提炼自优秀 CLI
的真实行为，以及 [clig.dev](https://clig.dev)、Heroku CLI Style Guide 等来源。最终效果：
**先准确，其次人能读，再次脚本/agent 能解析，最后看着舒服。** 它是纯指南——零库、零依赖、
零运行时。

## 快速安装

**用 `skills` CLI**（合集仓库推荐）：

```bash
npx skills add Mai8304/skills -s CLI-output-design -g -y
```

**手动**（任何会读 skill 的 agent 都适用）：

```bash
git clone https://github.com/Mai8304/skills
cp -r skills/CLI-output-design ~/.claude/skills/cli-output-design
```

放到 `~/.claude/skills/`（全局）或项目的 `.claude/skills/` 下后，agent 会自动加载，并在你
让它设计、构建、审查或改进 CLI 输出时自动触发。

## 它是怎么做到的

在“把它弄好看”背后，这个 skill 为**输出的每一层**都给了 agent 一套具体的系统——所以下载、
文件列表、一轮对话、一条错误，都出自同一套连贯设计，而不是临时拼的 `print`。每个决策都用
四个透镜来权衡（准确 → 人类可用 → AI 可用 → 美观，详见下文），并由七套系统落地：

| 系统 | 给 agent 的能力 |
|---|---|
| **语义化颜色** | 颜色 = 含义，不是装饰：绿 = 成功，红 = 错误，黄 = 警告，青 = 命令/路径，dim = 次要。用 ANSI-16 跟随用户的亮/暗主题，永远与文字配对，并在管道 / `NO_COLOR` / CI 下自动关闭。 |
| **固定符号集** | 一套词汇——`✓ ✗ ⚠ → • ◆ …` 加 braille spinner `⠙`——每个都有 ASCII 回退（`[OK] [FAIL] [WARN]`）。默认不用 emoji；宽度稳定，列永不错位。 |
| **诚实的状态与进度** | 每个耗时任务都走 开始 → 进度 → `✓`/`✗`；下载显示 条 + 体积 + 速率 + ETA；spinner 只在 TTY 出现且必定收尾。绝不卡在 99%。 |
| **会引导的文案** | 错误说清*发生了什么 · 为什么 · 下一步做什么*；统一状态词表（`pass / fail / warn / skip …`）；人性化的时长与体积（`1.2 MB`、`4.2s`）。 |
| **宽度感知排版** | 表格、文件树、列表、键值块会对齐、换行，并在窄终端优雅降级；标识符和 URL 永不被折断。 |
| **机器与 agent 契约** | `stdout` = 数据，`stderr` = 对话；`--json` 纯净、稳定、可解析；状态词稳定，AI agent 能直接从日志读出下一步动作。 |
| **一整套 pattern 菜谱** | 覆盖你真正要渲染的每种形态——下载、文件树、对话、diff、表格、诊断、日志、dry-run、空状态、提示符与选择菜单、嵌套任务树……（见下方菜谱）。 |

agent 永远先读简短的 `SKILL.md` 脊椎，再只按需拉取当前要渲染那一项的 reference——所以每个
场景都得到正确处理，又不必加载整本书。

## 改造前 / 改造后

同样的信息，临时拼 vs. 经过 skill。下面用 `diff` 高亮的块在 GitHub 上**真的有红绿色**
（绿 = 成功，红 = 错误/删除）；其余地方用符号和结构代替颜色（黄 = 警告，青 = 命令/路径，
dim = 次要）。

**错误与引导**——说清原因和下一步：

```
# 改造前
Error: failed

# 改造后
✗ Config not found

  Reason: no myapp.toml in this directory
  Next:
    myapp init
```

**下载**——诚实的进度，必定收尾，管道下自动降级：

```
# 改造前
Downloading... done.

# 改造后 —— 交互式
⬇ model.bin   [██████████░░░░]  72%   3.6/5.0 GB   18 MB/s   eta 1m20s
✓ Downloaded model.bin (5.0 GB) in 4m41s

# 改造后 —— 管道 / CI（无动画，只给里程碑）
downloading model.bin (5.0 GB)
downloaded model.bin in 4m41s
```

**文件列表 → 树**——能扫的结构：

```
# 改造前
src/cli/main.go
src/cli/render.go
src/internal/color.go

# 改造后
.
├── src/
│   ├── cli/
│   │   ├── main.go
│   │   └── render.go
│   └── internal/
│       └── color.go
└── README.md
```

**健康检查**——符号 + 对齐 + 汇总行（下方真红绿）：

```diff
  ◆ Checking environment

+ ✓ Node version     v24.11.1
+ ✓ Lockfile         in sync
  ⚠ Disk space       2.1 GB free
- ✗ Auth token       missing

  3 passed · 1 warning · 1 failed
```

**对话**（agent / 聊天 CLI）——分得清的轮次：

```
# 改造前
You: how do I reset the cache?
Bot: Run mycli cache clear.

# 改造后
▌ You
  How do I reset the cache?

▌ Assistant
  Run `mycli cache clear`.
```

**表格**——无边框、对齐、grep 友好：

```
# 改造前 —— ASCII 网格：噪声大、resize 易碎
+--------+--------------------+--------+
| NUMBER | TITLE              | STATE  |
+--------+--------------------+--------+
| 128    | Fix color fallback | open   |
+--------+--------------------+--------+

# 改造后
NUMBER  TITLE                STATE   UPDATED
#128    Fix color fallback   open    2h ago
#127    Bump deps            merged  1d ago
```

**代码与 diff**——`+`/`-` 承载语义，颜色只是补强（下方真配色）：

```diff
@@ src/config.go @@
- log.Print("start")
+ log.Info("start", "version", v)
```

**机器模式**（`mycli check --json | jq`）——stdout 只放数据；进度移到 stderr：

```json
{
  "ok": false,
  "checks": [
    { "name": "config", "status": "fail",
      "next_steps": [ { "command": "myapp init", "reason": "create a config" } ] }
  ]
}
```

## 核心原则

每个输出决策都用四个透镜来判断，**按优先级排序**——两者冲突时，高的赢（再漂亮的排版也
不能正当化一个错误的状态）：

1. **Accurate（准确）**——只说真话。状态诚实，不伪造/不卡死进度，错误指明真正的原因。
2. **Human-usable（人类可用）**——读者一眼看到结果、卡点和下一步。
3. **Agent-usable（AI 可用）**——人类日志*和*机器模式都能被脚本或 AI agent 解析。
4. **Beautiful（美观）**——平静、克制：语义化颜色、克制的符号、用留白构建结构。

## 目录结构

```
CLI-output-design/
├── SKILL.md                       # 脊椎：4 透镜、操作规则、
│                                  #   决策表、红旗、发布前 checklist
└── references/                    # 按需加载的深入文档
    ├── color.md                   # 语义化 ANSI-16 调色板、何时不该上色
    ├── symbols.md                 # 字形集 + ASCII 回退、默认不用 emoji
    ├── status-and-progress.md     # spinner、进度条、checklist、终态
    ├── copywriting.md             # 错误 = 是什么 / 为什么 / Next；语气；人性化数值
    ├── layout.md                  # 宽度、换行、对齐、表格、留白
    ├── output-patterns.md         # pattern 菜谱（见下）
    ├── agent-readable-output.md   # AI 可读日志 + --json 契约
    └── robustness.md              # TTY / NO_COLOR / CI 检测、退出码
```

`SKILL.md` 短小、每次都读；每个 reference 只在用到对应主题时才加载（渐进披露），所以在你
需要深度之前，这个 skill 一直很轻。

## pattern 菜谱

`output-patterns.md` 为每种形态给一份菜谱——结构、TTY 示例、以及管道/窄屏/agent 下的降级
——分为四组：

- **数据形态**——表格 · 列表 · 文件树 · 对象 / `describe` 视图 · 代码与 diff ·
  内容块 · 分页
- **生命周期与结局**——进度 · 嵌套任务树 · checklist · 诊断（带源码帧）· 结果 / 测试汇总 ·
  dry-run / 变更预览 · 空状态
- **流式与对话**——聊天 / agent transcript · 流式输出
- **通知与日志**——分级日志与 verbosity 档位 · 版本 / 弃用通知
- **提示符与选择**——确认与危险动作（y/N）· 单选（圆形 radio）· 多选（方形 checkbox）·
  控制层、导航与取消

## 何时使用

只要你在打磨终端输出，这个 skill 就会自动触发。典型时刻：

- **设计新 CLI**——从一开始就决定输出该长什么样、怎么表现。
- **审查或打磨**现有 CLI 的输出，对照发布前 checklist。
- **加 `--json` / 机器模式**，让脚本和 agent 能可靠依赖。
- **修降级 bug**——颜色漏进管道、`NO_COLOR` 失效、乱码、硬编码宽度。
- **做 agent 或聊天 CLI**，日志要同时对人和机器都好读。
