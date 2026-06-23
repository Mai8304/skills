# CLI 输出设计

> 这个 skill 用来设计和审查终端输出：先保证准确，再保证人能快速读懂，再保证脚本和 AI agent 能解析，最后才是视觉上的克制和好看。

[English](./README.md) · **中文** · 版本 `1.0.3`

它关注的是 CLI 在终端里“怎么说话”：颜色、符号、状态、进度、错误、布局、表格、树、diff、JSON、管道、CI、`NO_COLOR`，以及 Agent Chat TUI 里的对话、输入草稿、thinking、工具调用、审批、选择项、后台任务、subagent 和机器事件。

它不负责设计命令名、flag、业务逻辑或输入处理内部实现。

## 快速安装

```bash
npx skills add Mai8304/skills -s CLI-output-design -g -y
```

手动安装：

```bash
git clone https://github.com/Mai8304/skills
cp -r skills/CLI-output-design ~/.codex/skills/cli-output-design
```

安装后，让 agent 在设计、实现、review 或改进 CLI 输出时使用 `cli-output-design`。

## 默认基线

这个 skill 的默认基线不是“更花哨”，而是：

- **严格语义**：颜色、符号、留白、标签、状态词都必须有含义
- **低装饰**：普通输出不加框，不彩虹，不默认 emoji，不用颜色当唯一信号
- **可脚本化优先**：`stdout` 放数据，`stderr` 放进度、诊断、提示；`--json` 必须纯净
- **TTY 感知**：动画、光标技巧、链接下划线、轻量边框只在交互式 TTY 出现
- **主题与降级安全**：适配亮/暗终端，尊重 `NO_COLOR`、CI、`TERM=dumb`、窄屏、CJK 宽字符和 ASCII fallback

唯一明确放宽的是 **expressive TTY notice**：低频、非阻塞、交互式通知可以用轻框、小 icon、链接下划线，例如版本更新提示。但一旦进入 pipe、CI、`NO_COLOR` 或 `TERM=dumb`，必须退回普通文本。

## 四个判断顺序

每个输出设计都按这个顺序判断：

1. **准确**：状态、进度、数量、风险、原因不能错。
2. **人类可用**：用户一眼看见结果、阻塞点和下一步。
3. **Agent / 脚本可用**：日志和机器模式能被程序稳定解析。
4. **美观**：颜色克制，层次清楚，留白有结构。

如果冲突，前面的优先。漂亮不能掩盖错误状态。

## 覆盖范围

| 类别 | 覆盖内容 |
|---|---|
| 颜色与属性 | ANSI-16 语义色、技术 token accent、dim/bold 层次、underline/italic/strikethrough 的限制 |
| 符号 | 固定 glyph 词表、ASCII fallback、默认不用 emoji、宽度安全 |
| 状态与进度 | canonical 状态词、spinner、下载条、嵌套任务、checklist、终态 |
| 文案 | note、warning、deprecated、error、Reason、Next、人性化数值 |
| 布局 | 换行、表格、对象详情、文件树、diff、内容块、源码帧、CJK 对齐 |
| 命令输出面 | help、usage、bad arguments、unknown command、dry-run、确认、单选、多选 |
| 运行契约 | stdout/stderr、日志、verbosity、pager、中断/取消、secret redaction |
| 机器输出 | `--json`、pipe、CI、NDJSON events、稳定 schema 和 status enum |
| Agent Chat TUI | role、输入草稿、光标/删除、流式输出、thinking、tools、审批、选择、提醒、定时、后台任务、subagent、artifact、非 TTY fallback |

## 普通 CLI：改造前 / 改造后

下面的例子分两种：多数是 **同语义表现层改造**，即 Before 和 After 表达同一件事；少数是 **语义修复**，因为 Before 本身缺了必要信息。

### 1. Help、参数错误、错误文案

```text
# 改造前
Usage: mycli {init,deploy,status,destroy,config,auth,logs,doctor,completion} [options]
Error: invalid
Error: failed

# 改造后
USAGE
  mycli deploy [--env <name>] [--dry-run]

COMMANDS
  init      Create a config file
  deploy    Deploy the current project
  status    Show deployment status

OPTIONS
  --env <name>    Target environment
  --dry-run       Preview changes without applying them

✗ error: missing required flag --env

  Usage:
    mycli deploy --env <name>

  Next:
    mycli deploy --env staging

✗ error: config not found

  Reason: no myapp.toml in this directory
  Next:
    myapp init
```

好的错误不是“红一点”，而是说清楚发生了什么、为什么、下一步做什么。参数错误应该给相关 usage slice，并返回合适的 exit code。

### 2. 颜色、重点、URL、弃用提示

```text
# 改造前
Important: run mycli cache clear now
See docs: https://example.com/docs/cache
ERROR: --token is deprecated but command continued
Replacement --auth-token
Removal 2026-09-01
authenticated pass

# 改造后
Run mycli cache clear to remove local cache.
Docs:
  https://example.com/docs/cache

⚠ deprecated: --token is deprecated
  Replacement: --auth-token
  Removal:     2026-09-01

✓ pass authenticated
```

颜色规则：

- 红色只给当前失败，不给“重要”
- 黄色给 warning / deprecated，并给 replacement
- 青色给命令、flag、路径、URL、函数、公式等技术 token
- dim 给时间戳、hint、metadata 等次要信息
- URL 必须保留 raw URL，OSC 8 和 underline 只是 TTY 增强

### 3. 进度、任务树、结果汇总

```text
# 改造前
Downloading model.bin 3.8/5.1 MB 74% 1.2 MB/s eta 1s
Downloaded model.bin 5.1 MB in 4.2s
Deploy build pass 12.4s migrate running schema pass 0.8s seed data running
Ran tests. Some failed. Lots of log output...

# 改造后
model.bin  [████████████░░░░] 74%  3.8/5.1 MB  (1.2 MB/s) eta 1s
✓ pass downloaded model.bin (5.1 MB) in 4.2s

◆ Deploy
  ✓ pass build              12.4s
  ⠙ running migrate
    ✓ pass schema           0.8s
    ⠙ running seed data
  • queued smoke tests

✓ pass 142   ✗ fail 1   ⊘ skip 3        4.2s

  ✗ fail internal/cache: TestEvict/expired
      cache_test.go:88: expected 0 entries, got 1

FAIL  (1 of 146)
```

知道总量才显示百分比；不知道总量就用 spinner 或 milestone。任何 spinner / progress bar 都必须落到 `pass` 或 `fail`，不能孤儿化。

### 4. 表格、对象详情、文件树、diff、内容块

```text
# 改造前
+--------+--------------------+--------+
| NUMBER | TITLE              | STATE  |
+--------+--------------------+--------+
| 128    | Fix color fallback | open   |
+--------+--------------------+--------+

ID TITLE AUTHOR BRANCH CHECKS FILES
128 Fix color fallback open zw fix-color->main pass=4 files=6 +128 -34

src/cli/main.go
src/cli/render.go
src/internal/color.go

# 改造后
NUMBER  TITLE                STATE   UPDATED
#128    Fix color fallback   open    2h ago
#127    Bump deps            merged  1d ago

Pull request #128                                  open
  Title     Fix color fallback
  Author    zw
  Branch    fix-color -> main
  Checks    ✓ pass 4
  Files     6 changed  (+128 -34)

src/
├── cli/
│   ├── main.go
│   └── render.go
└── internal/
    └── color.go

src/config.go
@@ -10,6 +10,7 @@
  ctx := context.Background()
- log.Print("start")
+ log.Info("start", "version", v)

note: configuration file created

  mycli config set api.url https://api.example.com

Docs:
  https://example.com/docs/config
```

同质多行用表格；单个对象用 key-value；TTY 可用树，pipe 下回到一行一个 path；diff 的 `+` / `-` 才是语义，颜色只是增强。

### 5. 诊断、dry-run、选择、取消

```text
# 改造前
error E0382 borrow of moved value cfg
src/main.go line 14 column 9
line 12 load(cfg) moved cfg
line 14 print(cfg) used after move
help clone cfg before load
fail 3 errors warn 1

Plan add web
Plan change api image 1.2 to 1.3
Plan destroy none
Use --apply to execute

Delete stuff? y/n
Pick features:
> auth
> billing

# 改造后
error[E0382]: borrow of moved value: cfg
   ┌─ src/main.go:14:9
12 │   load(cfg)
   │        --- value moved here
14 │   print(cfg)
   │         ^^^ value used after move
   = help: clone cfg before load()

fail 3 errors · warn 1

Plan: 2 to add · 1 to change · 0 to destroy

  + service "web"        will be created
  ~ service "api"        image  1.2 -> 1.3

Run with --apply to execute.

This will delete 3 buckets and 1 database — cannot be undone:
  - s3://logs-prod
  - s3://logs-staging
  - rds: analytics-primary

Continue?  [y/N]

? Select features   space toggle · enter confirm · esc cancel
❯ [x] auth
  [ ] billing
  [x] analytics
  2 selected

■ cancelled: upload interrupted by user
  Restored terminal state
  Exit code: 130
```

危险动作先展示影响范围，默认 No，并提供非交互方式。确认、单选、多选要有不同形状，不要把所有 prompt 都做成 `y/n`。

### 6. 机器模式、日志、pager、CJK、redaction

```text
# 改造前
Checking...
{
  "schema_version": "1",
  "ok": false,
  "duration_ms": 412,
  "checks": [
    {
      "name": "config_file",
      "status": "\x1b[31mfail\x1b[0m",
      "message": "not configured",
      "next_steps": [
        { "command": "mycli config init", "reason": "create config" }
      ]
    }
  ]
}
Run mycli init to fix this!

NAME      STATUS
配置文件      missing
gateway   pass

connected with token sk-live-123456

# 改造后
{
  "schema_version": "1",
  "ok": false,
  "duration_ms": 412,
  "checks": [
    {
      "name": "config_file",
      "status": "fail",
      "message": "not configured",
      "next_steps": [
        { "command": "mycli config init", "reason": "create config" }
      ]
    }
  ]
}

NAME        STATUS
配置文件    missing
gateway     pass

✓ pass connected
  token: [redacted]

NO_COLOR fallback:
pass connected
token: [redacted]

Pager:
  TTY       long output can page, with position and quit hint
  pipe/CI   no pager, no prompts, stream all rows
```

机器模式是契约，不是“带 JSON 的人类输出”。不能有 ANSI、spinner、cursor code、提示性 prose 或不稳定字段。

## Agent Chat TUI：改造前 / 改造后

Agent Chat 和普通 CLI 输出不同。它有 live input、transcript、assistant 流式输出、thinking、tools、approval、choice、background task、subagent、artifact 和机器事件。这个 skill 定义的是可组合原子，不是某个具体产品的一整套 UI 模板。

### 1. 角色、输入草稿、提交后的 transcript

```text
# 改造前
User: how do I reset the cache?
Bot: Run mycli cache clear.
You: explain this er█
You: explain this error and suggest the smallest fix

# 改造后
▌ You
  How do I reset the cache?

▌ Assistant
  Run mycli cache clear.

❯ You  explain this error and suggest the smallest fix

Submitted transcript:
▌ You
  explain this error and suggest the smallest fix
```

输入草稿是 live UI，不是历史记录。光标移动、删除、候选项、IME 组合态都不能污染 transcript。

### 2. 多行粘贴、slash command、文件引用、CJK

```text
# 改造前
❯ You review this function:
func cacheKey(user string) string {
Assistant: I can help with that...

You: /re
Assistant: did you mean /review?

# 改造后
❯ You  review this function:
        ```go
        func cacheKey(user string) string {
          return strings.ToLower(user)
        }
        ```

IME/CJK:
  compose first, submit only final text, align by display width

❯ You  /re
  /review   review selected files
  /reset    clear conversation state

❯ You  review @src/render.go

Submitted transcript:
review @src/render.go
```

autocomplete、slash command、file mention 都是输入提示原子。只有用户确认后，它们才进入 transcript。

### 3. Streaming 和 thinking

```text
# 改造前
thinking thinking thinking
I found the failing test in internal/cache.
thinking
The smallest fix is to clear expired entries before counting.
I am thinking step by step about every hidden inference...

# 改造后
◐ thinking

▌ Assistant
  I found the failing test in internal/cache.
  The smallest fix is to clear expired entries before counting.

◐ thinking
∴ thinking  inspected 4 files; running tests next
✓ thinking  pass  8s
```

不要展示 hidden chain-of-thought。可以展示的是简短、可观察的 thinking summary，例如看了几个文件、下一步要跑测试。

### 4. Tool use、subagent、artifact

```text
# 改造前
Running shell: go test ./internal/cache
exit 1 after 2.3s
cache_test.go:88: expected 0 entries, got 1
raw output mixed into assistant prose

agent researcher running
task inspect parser edge cases
agent researcher pass in 1m12s
found 3 relevant files

Assistant:
Here is the CSV:
id,name,status
1,api,pass
2,cache,warn
... 10,000 more rows ...

# 改造后
◐ ⚙ shell  running
  ⎿ command: go test ./internal/cache

✗ ⚙ shell  fail  2.3s
  ⎿ exit: 1
  ⎿ output: cache_test.go:88: expected 0 entries, got 1

◐ agent researcher  running
  ⎿ task: inspect parser edge cases

✓ agent researcher  pass  1m12s
  ⎿ found: 3 relevant files

▌ Assistant
  Generated checks.csv with 10,002 rows.
  Preview: 2 rows shown, 10,000 hidden.

artifact: checks.csv
machine: {"type":"artifact.created","name":"checks.csv","rows":10002}
```

Tool 要有名字、状态、参数摘要、受限输出和终态。Subagent 是 nested actor，不要把第二段完整 transcript 倒进主对话。大 artifact 用摘要和稳定引用，不把上万行塞进聊天正文。

### 5. 选择、审批、提醒、后台任务、取消

```text
# 改造前
DELETE EVERYTHING? y/n
approval: no
approval: yes
approval: stopped
approval: changed
WARNING output too long
ERROR command failed exit 2
WAIT retrying in 30 seconds
LATER task sync-42 queued

# 改造后
approval required
  title: Delete stale branches
  risk: high
  changes: 12 branches
  next: approve with y, deny with n

Approve? [y/N]

{"type":"approval.result","decision":"approve","request_id":"a1"}
{"type":"approval.result","decision":"deny","request_id":"a2"}
{"type":"approval.result","decision":"cancel","request_id":"a3"}
{"type":"approval.result","decision":"edit","request_id":"a4"}

⚠ warning: tool output truncated to 200 lines
✗ error: command failed with exit 2
timer: retrying in 30s
background: task queued · id=sync-42

■ cancelled by user
  turn: current
  cursor: restored
  exit: 130
```

审批不是一个必须加框的大卡片，而是一组 key-value 原子。`approve`、`deny`、`cancel`、`edit` 必须区分，不能都压成 yes/no。

### 6. 非 TTY、纯文本 fallback、NDJSON

```text
# 改造前
\x1b[?25lAssistant thinking\r
\x1b[36mTool shell running go test ./internal/cache\x1b[0m
Tool shell fail exit=1 duration_ms=2300
failing test is internal/cache TestEvict/expired
Thinking...
{"tool":"shell"}
Done!
Partial assistant prose...

# 改造后：plain fallback
Assistant: thinking started
Tool shell: running command="go test ./internal/cache"
Tool shell: fail exit=1 duration_ms=2300
Assistant: failing test is internal/cache TestEvict/expired

# 改造后：NDJSON
{"type":"turn.start","role":"user","message":"Find the failing test."}
{"type":"thinking.start","status":"running"}
{"type":"tool.start","tool_name":"shell","call_id":"c1","status":"running"}
{"type":"tool.end","tool_name":"shell","call_id":"c1","status":"fail","exit_code":1}
{"type":"message.delta","role":"assistant","text":"I found one failing test"}
{"type":"turn.end","role":"assistant","status":"pass"}
```

离开 TTY 后，live UI 全部消失：不保留动画帧、光标控制、隐藏角色状态、边框、下划线或 raw ANSI。机器事件使用稳定 type。

## 文件结构

```text
CLI-output-design/
├── SKILL.md
└── references/
    ├── color.md
    ├── symbols.md
    ├── status-and-progress.md
    ├── copywriting.md
    ├── layout.md
    ├── output-patterns.md
    ├── agent-chat-tui.md
    ├── agent-readable-output.md
    └── robustness.md
```

`SKILL.md` 是短脊椎；references 按需加载。这样 agent 只在需要颜色、进度、Agent Chat、机器输出等具体问题时才读对应深水区。

## Reference 怎么用

- `color.md`：颜色、属性、技术 token、主题适配
- `symbols.md`：glyph 词表、ASCII fallback、显示宽度
- `status-and-progress.md`：spinner、进度条、checklist、状态词
- `copywriting.md`：note、warning、deprecated、error、Reason、Next
- `layout.md`：宽度、换行、对齐、表格、key-value
- `output-patterns.md`：help、usage、错误、表格、树、diff、诊断、prompt、pager、日志、notice、dry-run、空状态
- `agent-chat-tui.md`：对话原子、输入草稿、thinking、tool、choice、approval、background、subagent、artifact、非 TTY / NDJSON fallback
- `agent-readable-output.md`：稳定 JSON 和 AI-readable logs
- `robustness.md`：`isatty`、`NO_COLOR`、CI、`TERM=dumb`、退出码、中断恢复

## 发布前检查

- pipe 输出没有 ANSI、spinner 帧、cursor code 或装饰性空行。
- `--json` 是纯 stdout 数据，字段和 status enum 稳定。
- 状态词统一：`running`、`pass`、`fail`、`warn`、`skip`、`changed`、`unchanged`。
- 长任务都有可见终态。
- 错误有原因和下一步。
- deprecated 是黄色 warning，已知时给 replacement。
- URL 可复制，OSC 8 / underline 只是 TTY 增强。
- `NO_COLOR=1`、`TERM=dumb`、CI、窄屏、ASCII fallback 都不丢语义。
- CJK / 宽字符按 display width 对齐。
- 危险操作先展示影响范围，默认 No，并提供非交互 flag。
- Agent Chat 的 live UI 有 plain fallback 和 NDJSON fallback。
