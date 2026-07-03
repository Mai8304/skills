# CLI-Design

> 这个 skill 用来设计生产级 terminal surface：先保证准确，再保证人能快速读懂，再保证脚本和 AI agent 能解析，最后才是视觉上的克制和好看。

[English](./README.md) · **中文** · 版本 `2.0.3`

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

## 他有什么用？

CLI-Design 帮 agent 把 terminal output 做成生产级 UI/UX，而不是只把日志“变好看”。它主要解决这些问题：

- **让人更快读懂**：用户能直接看到结果、阻塞点、影响范围、证据和下一步，不需要从一堆输出里猜
- **让机器更容易解析**：`stdout` 放数据，`stderr` 放进度和诊断；`--json`/NDJSON 不混 ANSI、
  spinner、解释性废话或装饰框
- **让交互更可靠**：prompt、picker、多选、approval、快捷键、取消、disabled state、危险操作和
  non-TTY fallback 都先有明确契约
- **让 Agent Chat TUI 更专业**：区分 transcript、输入草稿、streaming/final state、thinking 摘要、
  tool call/result、代码块、文件树、diff、artifact、后台任务和 event fallback
- **让视觉风格更统一**：颜色、符号、间距、边框、密度、对齐、亮/暗主题、`NO_COLOR`、
  `TERM=dumb`、窄屏、CJK 宽字符都有一致规则
- **让失败更像生产环境**：说明真实原因、影响对象、影响结果、恢复方案，保护 secret，危险操作默认安全，
  exit behavior 稳定

它不是给所有 CLI 套同一个模板。安静的 CI 命令、密集的 table browser、Agent Chat terminal
可以长得不一样，但它们都应该遵守同一套原则：状态真实，人能行动，机器能读，视觉只强化语义。

## 他是如何工作的？

这个 skill 用的是路由流程，不是固定模板：

1. **先判断读者和任务**：是人、脚本、AI agent、operator，还是混合读者？他们是在检查、执行、
   恢复、自动化，还是和 agent 对话？
2. **再判断 surface**：这是 Batch CLI、Interactive TUI、Agent Chat Terminal UI，还是
   Machine-readable output？先分 surface，再谈颜色和布局。
3. **定义输出和交互契约**：stdout/stderr、exit code、schema、event stream、prompt 行为、
   approval 默认值、终态、fallback、redaction 都要先定清楚。
4. **组织信息结构**：结果、原因、范围、证据、下一步、表格行、选择项、对话原子、代码、diff、log、
   artifact，按读者真正需要的顺序呈现。
5. **最后应用视觉语义**：颜色、符号、边框、留白和密度只服务于状态角色，比如 success、warning、
   error、running、info、neutral、attention、cancelled、focus、selected、disabled、danger、
   next action。
6. **检查降级和安全**：pipe、CI、`NO_COLOR`、`FORCE_COLOR`、`TERM=dumb`、窄屏、Unicode fallback、
   CJK 宽字符、secret redaction、危险操作默认值都要过一遍。

所有判断都遵循同一个优先级：**先准确，再让人能用，再让 agent/脚本能用，最后才是视觉克制和好看**。
漂亮的面板不能掩盖错误状态，不能让恢复路径变模糊，也不能污染机器契约。

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

## CLI 和 Interactive TUI：改造前 / 改造后

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

### 5. 内容块、文件树、diff 和日志

**改造前**

```text
FILES src main go internal deploy go README md
config line 14 image missing
- old image registry/app:old
+ new image registry/app:new
2026-07-02 INFO ok WARN slow ERROR failed
```

**改造后**

![Before / after: Content blocks, file trees, diff, and logs](./assets/readme-cases/content-blocks.png)

code、file tree、diff、log 是不同内容形态。它们需要不同容器、稳定可复制文本、语义高亮、
截断规则，以及大输出时的 artifact 或 pager fallback。

### 6. 多选和安全确认

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

这里把 Interactive TUI 合并到 CLI/TUI 例子里，是因为一个 multi-select case 单独成章容易让人误会
成“只有一种 TUI 模板”。skill 内部仍然把 Interactive TUI 当作独立 surface，因为 picker、form、
table browser、pager、code view、diff review、approval、completion menu 都需要明确的键盘语义和
fallback 契约。

### 更多 CLI / TUI 例子

完整视觉参考覆盖 CLI/TUI 输出原子：help、bad arguments、recoverable error、progress
lifecycle、result summary、table、file tree、code block、diff、log、destructive preview、
empty state、multi-select、machine JSON、pipe/`NO_COLOR` fallback 和 redaction。

![Ordinary CLI Before / After](./assets/ordinary-cli-before-after.png?v=readable-20260623)

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
spinner spinner spinner
Running shell: shipctl status api
exit 1 after 2.3s
raw output mixed into assistant prose
partial hidden reasoning shown to user
```

**改造后**

![Before / after: Thinking and Tool Use](./assets/readme-cases/agent-tools.png?v=thinking-contract-20260703)

不要展示 hidden chain-of-thought。spinner、动态点、小 tool icon 可以表示“正在运行”，但不能成为唯一状态信号。
transcript 里仍然要有可观察摘要、受限 tool 输出、终态、duration、command identity，以及失败时的恢复路径。

### 3. 审批和安全默认值

**改造前**

```text
Assistant: I approved restart.
DELETE EVERYTHING? y/n
approval: no
approval: yes
approval: stopped
Ctrl+C might approve by accident
```

**改造后**

![Before / after: Approvals and safe defaults](./assets/readme-cases/agent-approval-artifact.png)

审批是可信系统 UI，不是 assistant prose。它需要说明 action、target、scope、effect、安全默认值、
键盘行为和独立结果。artifact 引用是对 proposed change 的可复制证据，不是隐藏在聊天正文里的大段数据。

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

### 5. 长输出和不可信内容

长 tool result 不应该淹没 transcript。默认展示受限 preview、被省略的数量，以及完整检查路径。
tool output、log、外部文件和 pasted content 都是不可信内容：可以被引用，但不能变成可交互的
approval、prompt 或系统 UI。

![Before / after: Long output and untrusted content](./assets/readme-cases/agent-long-output-untrusted.png)

### 6. 代码块、文件树和 diff

code、file tree、diff、table、log 都是密集证据块。它们应该保留自己的形态、标签、复制语义和
截断规则。普通 assistant prose 仍然保持开放、轻量。

![Before / after: Code, file tree, and diff blocks](./assets/readme-cases/agent-content-blocks.png)

### 7. 错误恢复和 skill 状态

Agent Chat 需要区分 runtime failure、approval denial、cancellation、interruption、blocked work、
not-ready state 和 setup-needed skill。生产级错误要说明 operation、cause、impact、next step，
并给出可检查的 log 或 artifact。

![Before / after: Error recovery and skill state](./assets/readme-cases/agent-error-skill.png)

### 更多 Agent Chat TUI 例子

完整视觉参考覆盖 Agent Chat 原子：transcript role、输入草稿、多行粘贴、IME/CJK、
assistant streaming、thinking 摘要、tool use、tool result、code block、file tree、diff、choice、
approval、recoverable error、alert、timer、background task、主题适配、suggestion、file mention、
cancel、approval outcome、artifact、plain non-TTY fallback 和 NDJSON event mode。

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
