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

## 改造前 / 改造后

指南带来的改变，直接体现在输出本身。

**错误**——说清原因和下一步，别只甩一句 `failed`：

```
# 改造前
Error: failed

# 改造后
✗ Config not found

  Reason: no myapp.toml in this directory
  Next:
    myapp init
```

**进度**——诚实，且永远抵达一个终态：

```
# 改造前
processing... done          （或进度条卡 99%，或 spinner 永不收尾）

# 改造后
⠙ Building…        →        ✓ Built 142 files in 4.2s
```

**机器模式**（`mycli check --json | jq`）——stdout 只放数据；颜色、spinner、日志都走 stderr：

```
# 改造前 —— 话术 + 样式漏进管道
Checking… {ok:false, "Status":"FAILED"}  ✗ done

# 改造后 —— 纯净、稳定、可解析
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
    ├── output-patterns.md         # 17 个 pattern 菜谱（见下）
    ├── agent-readable-output.md   # AI 可读日志 + --json 契约
    └── robustness.md              # TTY / NO_COLOR / CI 检测、退出码
```

`SKILL.md` 短小、每次都读；每个 reference 只在用到对应主题时才加载（渐进披露），所以在你
需要深度之前，这个 skill 一直很轻。

## 17 个 pattern 菜谱

`output-patterns.md` 为每种形态给一份菜谱——结构、TTY 示例、以及管道/窄屏/agent 下的降级
——分为四组：

- **数据形态**——表格 · 列表 · 文件树 · 对象 / `describe` 视图 · 代码与 diff ·
  内容块 · 分页
- **生命周期与结局**——进度 · checklist · 诊断（带源码帧）· 结果 / 测试汇总 ·
  dry-run / 变更预览 · 空状态
- **流式与对话**——聊天 / agent transcript · 流式输出
- **通知与日志**——分级日志与 verbosity 档位 · 版本 / 弃用通知

## 何时使用

只要你在打磨终端输出，这个 skill 就会自动触发。典型时刻：

- **设计新 CLI**——从一开始就决定输出该长什么样、怎么表现。
- **审查或打磨**现有 CLI 的输出，对照发布前 checklist。
- **加 `--json` / 机器模式**，让脚本和 agent 能可靠依赖。
- **修降级 bug**——颜色漏进管道、`NO_COLOR` 失效、乱码、硬编码宽度。
- **做 agent 或聊天 CLI**，日志要同时对人和机器都好读。
