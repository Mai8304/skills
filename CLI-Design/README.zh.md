# CLI-Design

> 这个 skill 用来设计生产级 terminal surface：先保证准确，再保证人能快速读懂，再保证脚本和 AI agent 能解析，最后才是视觉上的克制和好看。

[English](./README.md) · **中文** · 版本 `2.0.2`

它关注 CLI 和 terminal TUI 在终端里“怎么说话、怎么交互”：颜色、符号、状态、进度、
错误、布局、表格、树、diff、JSON、管道、CI、`NO_COLOR`，以及 Agent Chat Terminal UI
里的对话、输入草稿、工具调用、审批、选择项、后台任务、artifact 和机器事件。

它不负责设计命令名、flag、业务逻辑或底层 terminal input loop。

## 快速安装

```bash
npx skills add Mai8304/skills -s CLI-Design -g -y
```

手动安装：

```bash
git clone https://github.com/Mai8304/skills
cp -r skills/CLI-Design ~/.codex/skills/cli-design
```

安装后，让 agent 在设计、实现、review 或改进 CLI / terminal TUI 输出时使用
`cli-design`。

GitHub 项目目录叫 `CLI-Design`。安装到 Codex 后的 skill 名是 `cli-design`，因为
skill name 必须是小写 hyphen-case。

## 默认基线

这个 skill 的默认基线不是“更花哨”，而是：

- **terminal surface 是协议**：输出是人、脚本、agent 之间的契约
- **严格语义**：颜色、符号、留白、标签、状态词都必须有含义
- **契约先于样式**：先定 stdout/stderr、schema、exit code、fallback 和风险
- **低装饰**：普通输出不加彩虹，不默认 emoji，不给普通数据套框
- **可脚本化优先**：`stdout` 放数据，`stderr` 放进度、诊断、提示；`--json` 必须纯净
- **TTY 感知**：动画、光标技巧、链接、live redraw 只在交互式 TTY 出现
- **主题与降级安全**：适配亮/暗终端，尊重 `NO_COLOR`、CI、`TERM=dumb`、窄屏、
  CJK 宽字符和 ASCII fallback
- **默认安全**：危险操作必须先展示影响范围，并默认 No

唯一明确放宽的是 **expressive TTY notice**：低频、非阻塞、交互式通知可以用轻框、
小 icon、链接下划线，例如版本更新提示。但一旦进入 pipe、CI、`NO_COLOR` 或
`TERM=dumb`，必须退回普通文本。

## 核心决策模型

决定颜色、符号、布局 chrome 或文案之前，先按这个顺序判断：

```text
reader task -> surface family -> interaction contract -> channel contract -> visual semantics
```

- **reader task**：发现、检查、行动、恢复、自动化、对话。
- **surface family**：Batch CLI、Interactive TUI、Agent Chat Terminal UI、
  Machine-readable output。
- **interaction contract**：被动输出、确认、单选、多选、审批、中断、回放、live agent
  session。
- **channel contract**：TTY、pipe、`--json`、NDJSON、CI、`NO_COLOR`、`TERM=dumb`、
  width、Unicode support、stdout/stderr、exit code。
- **visual semantics**：状态、焦点、选中、disabled reason、危险、下一步、可复制目标、
  次要信息、正文。

通俗地说：先定信息结构，第二是布局，第三才是语义颜色。命令、flag、路径、URL、
环境变量、配置 key 只有在它们是被说明的对象、选中项、可复制目标、当前操作或下一步动作时
才用 accent。

## 四个判断顺序

每个 terminal 设计都按这个顺序判断：

1. **准确**：状态、进度、数量、风险、原因、不确定性不能错。
2. **人类可用**：用户一眼看见结果、阻塞点、下一步和恢复路径。
3. **Agent / 脚本可用**：日志、schema、event、状态词和 exit code 能被稳定解析。
4. **美观**：颜色克制，层次清楚，符号稳定，留白有结构。

如果冲突，前面的优先。漂亮不能掩盖错误状态，也不能污染机器契约。

## 覆盖范围

| 类别 | 覆盖内容 |
|---|---|
| Surface routing | Batch CLI、Interactive TUI、Agent Chat Terminal UI、Machine-readable output |
| Batch CLI output | command result、help/usage、argument error、diagnostic、progress、log、summary、table、dry-run、destructive preview、pipe/CI behavior |
| Interactive TUI | picker、multi-select、form、table/list browser、pager、code/log block、diff、approval、completion menu、live progress |
| Agent Chat Terminal UI | transcript role、input draft、streaming/final state、tool、approval、choice、artifact、interrupt、queue、background work、replay、event fallback |
| Machine-readable output | `--json`、NDJSON、pipe/plain output、stdout/stderr、exit code、schema、stable enum、structured error、versioning |
| Visual language | semantic role、theme token、status color/symbol、focus/selection/input/disabled/danger、density、border、table/code/diff/log visual |
| Runtime robustness | `NO_COLOR`、`FORCE_COLOR`、`TERM=dumb`、CI、non-TTY、窄屏、CJK/wide-character alignment、ASCII fallback、terminal cleanup |
| Safety and trust | 危险确认、approval state、redaction、secret handling、audit-friendly tool output、recovery copy |

## 普通 CLI：改造前 / 改造后

README 主体只展示少数典型 case；完整视觉参考放在本节末尾图片中。每张典型图都是
before/after 对比，图片里的 terminal 文案统一使用英文。例子是 recipe，不是模板：保留信息契约，
根据眼前 CLI 的风格调整布局。

### 1. 会引导的错误

**改造前**

```text
Error: invalid
Error: failed
```

**改造后**

![Before / after: Errors That Guide](./assets/readme-cases/batch-errors.png)

错误不是“红一点”就够了；它必须在可知时说清楚操作、原因、影响范围、影响结果和下一步。

### 2. 语义颜色、进度和结果状态

**改造前**

```text
Important: run shipctl auth refresh now
See docs: https://example.com/docs/auth

Uploading release.tgz 3.8/5.1 MB 74% 1.2 MB/s eta 1s
Uploaded release.tgz 5.1 MB in 4.2s
Deploy finished. Some checks failed. Lots of log output...
```

**改造后**

![Before / after: Semantic Color, Progress, and Result State](./assets/readme-cases/batch-progress.png)

颜色服务于语义：绿色给成功，黄色给 warning 或 degraded state，红色给当前失败，青色给
focus/current/next-action 角色。进度必须诚实，并且必须落到终态。

### 3. 数据形态和诊断

**改造前**

```text
+--------+--------------------+--------+
| NUMBER | TITLE              | STATE  |
+--------+--------------------+--------+
| 128    | Fix color fallback | open   |
+--------+--------------------+--------+

ID TITLE AUTHOR BRANCH CHECKS FILES
128 Fix color fallback open zw fix-color->main pass=4 files=6 +128 -34

error E0382 borrow of moved value cfg
src/main.go line 14 column 9
line 12 load(cfg) moved cfg
line 14 print(cfg) used after move
```

**改造后**

![Before / after: Data Shapes and Diagnostics](./assets/readme-cases/batch-data-diagnostics.png)

同质数据用表格，单个对象用 key-value，诊断要呈现 source、cause、evidence 和 next action。
对齐必须按 display width，不按 byte 或 rune。

### 4. 机器契约和敏感信息

**改造前**

```text
Checking...
{
  "schema_version": "1",
  "ok": false,
  "duration_ms": 412,
  "checks": [
    {
      "name": "registry_auth",
      "status": "\x1b[31mfail\x1b[0m",
      "message": "not configured",
      "next_steps": [
        { "command": "shipctl auth refresh", "reason": "refresh credentials" }
      ]
    }
  ]
}
Run shipctl auth refresh to fix this!

NAME      STATUS
配置文件      missing
gateway   pass

connected with token sk-live-123456
```

**改造后**

![Before / after: Runtime Contracts and Redaction](./assets/readme-cases/machine-contracts.png)

机器模式是契约，不能混进 ANSI、spinner frame、prose wrapper 或装饰性空行。secret 必须在
human output、log、transcript、fixture、machine event 中先 redaction。

### 更多 CLI / TUI 例子

完整视觉参考覆盖 CLI/TUI 输出原子：help、bad arguments、recoverable error、progress
lifecycle、result summary、table、destructive preview、empty state、multi-select、machine
JSON、pipe/`NO_COLOR` fallback 和 redaction。

![Ordinary CLI Before / After](./assets/ordinary-cli-before-after.png?v=readable-20260623)

## Interactive TUI：改造前 / 改造后

Interactive terminal component 不只是“更好看的 prompt”。它必须先定义 focus、selection、
input mode、submit、confirm、cancel、disabled state、danger、key hint、fallback 和 terminal
cleanup，再谈样式。

### 多选和安全确认

**改造前**

```text
Restart services? y/n
1 api
2 worker
3 legacy
DELETE? y
```

**改造后**

![Before / after: Interactive TUI multi-select](./assets/readme-cases/interactive-multiselect.png)

这个 case 把 focus、selection、disabled reason、key hint、危险确认和安全默认值分开。它不是
强制使用某一种 pointer、checkbox 或配色。

## Agent Chat TUI：改造前 / 改造后

Agent Chat Terminal UI 和普通 CLI 输出不同。它有 live input、transcript、assistant
streaming/final state、tool、choice、approval、background work、artifact、interrupt、replay
和机器事件 fallback。这个 skill 定义的是可组合原子和契约，不是某个具体产品的一整套全屏模板。

### 1. 角色、输入草稿、提交后的 transcript

**改造前**

```text
User: deploy api to staging
Bot: I will do it.
You: explain this er█
You: explain this error and suggest the smallest fix
```

**改造后**

![Before / after: Transcript roles and input composer](./assets/readme-cases/agent-transcript.png)

输入草稿是 live UI，不是历史记录。光标移动、删除、候选项、IME 组合态都不能污染 transcript。

### 2. Thinking 和 Tool Use

**改造前**

```text
thinking thinking thinking
Running shell: shipctl status api
exit 1 after 2.3s
raw output mixed into assistant prose
partial hidden reasoning shown to user
```

**改造后**

![Before / after: Thinking and Tool Use](./assets/readme-cases/agent-tools.png)

不要展示 hidden chain-of-thought。可以展示可观察摘要和受限 tool 输出，并带上终态、
duration、command identity 和必要 evidence。

### 3. 审批、后台任务和 artifact

**改造前**

```text
DELETE EVERYTHING? y/n
approval: no
approval: yes
approval: stopped
approval: changed
WARNING output too long
ERROR command failed exit 2
WAIT retrying in 30 seconds
LATER task sync-42 queued
```

**改造后**

![Before / after: Approvals, Background Work, and Artifacts](./assets/readme-cases/agent-approval-artifact.png)

审批是 decision atom。后台任务要有 identity、state、owner、timing 和 resume behavior。大
artifact 只展示摘要和稳定引用，不把完整数据塞进聊天正文。

### 4. 非 TTY 和 NDJSON 事件

**改造前**

```text
\x1b[?25lAssistant thinking\r
\x1b[36mTool shell running shipctl status api\x1b[0m
Tool shell fail exit=1 duration_ms=2300
Thinking...
{"tool":"shell"}
Done!
Partial assistant prose...
```

**改造后**

![Before / after: Non-TTY and NDJSON Event Mode](./assets/readme-cases/agent-events.png)

非 TTY 下不保留 live UI、光标控制、动画、边框、隐藏 role state 或 raw ANSI。机器事件使用
稳定 event type 和已文档化 schema。

### 更多 Agent Chat TUI 例子

完整视觉参考覆盖 Agent Chat 原子：transcript role、输入草稿、多行粘贴、IME/CJK、
assistant streaming、tool use、tool result、choice、approval、alert、timer、background task、
主题适配、suggestion、file mention、cancel、approval outcome、artifact、plain non-TTY fallback
和 NDJSON event mode。

![Agent Chat TUI Before / After](./assets/agent-chat-tui-before-after.png?v=readable-20260623)

## 文件结构

```text
CLI-Design/
├── README.md
├── README.zh.md
├── SKILL.md
├── assets/
│   ├── ordinary-cli-before-after.png
│   ├── agent-chat-tui-before-after.png
│   └── readme-cases/
└── references/
    ├── batch-cli-output.md
    ├── interactive-tui.md
    ├── agent-chat-terminal-ui.md
    ├── machine-readable-output.md
    ├── visual-language.md
    └── pre-ship-gate.md
```

`SKILL.md` 是短 router 和硬契约层；references 按需加载。README assets 是给人看的视觉导览，
不是强制 agent 套用的模板。

## Reference 怎么用

- `batch-cli-output.md`：command result、help/usage、error、progress、log、table、
  dry-run、destructive preview、empty state、pipe/CI behavior。
- `interactive-tui.md`：prompt、picker、multi-select、form、table/list browser、pager、
  code/log/diff view、approval、completion menu、key semantics、fallback behavior。
- `agent-chat-terminal-ui.md`：transcript role、input draft、assistant state、tool、
  approval、artifact、background work、interrupt、replay、event/log fallback。
- `machine-readable-output.md`：JSON、NDJSON、pipe/plain output、stdout/stderr、exit code、
  schema、stable enum、structured error、compatibility、versioning。
- `visual-language.md`：semantic role、theme token、status color/symbol、
  focus/selection/input/disabled/danger、density、border、table/code/diff/log visual。
- `pre-ship-gate.md`：production check、stop-ship condition、robustness、security、
  redaction、trust boundary、snapshot/golden test matrix。

## 发布前检查

- pipe 输出没有 ANSI、spinner frame、cursor code 或装饰性空边。
- `--json` 和 NDJSON mode 是纯 stdout 数据，字段和 enum 稳定。
- 状态词来自同一套 vocabulary，并且能清楚映射到 UI role。
- 长任务都有真实终态。
- 错误在可知时有 cause、scope、impact 和 recovery。
- 危险操作先展示影响范围，默认 No，并提供非交互 flag。
- 技术 token 只有在它是被说明的对象、选中项、复制目标、当前操作或下一步动作时才用 accent。
- color、glyph、animation、live redraw 都不能是唯一信号。
- `NO_COLOR=1`、`FORCE_COLOR=1`、`TERM=dumb`、CI、non-TTY、窄屏、ASCII fallback 都不丢语义。
- machine mode 即使强制 color，也必须保持纯数据。
- CJK / 宽字符按 display width 对齐。
- secret 在 log、transcript、debug output、fixture、machine event 中都必须 redacted。
- Agent Chat live UI 有 plain log fallback 和 NDJSON/event fallback。
