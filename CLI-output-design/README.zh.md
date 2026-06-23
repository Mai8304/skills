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

README 主体只展示少数典型 case；完整 24 项视觉参考放在本节末尾的 2K 图片里。下面每个 case 都把改造前和改造后分开写，改造后用 README HTML 直接显示语义颜色。

### 1. 会引导的错误

**改造前**

```text
Error: invalid
Error: failed
```

**改造后**

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto"><span style="color:#e67875">✗ error:</span> missing required flag <span style="color:#8bcac3">--env</span>

  <span style="color:#777d80">Usage:</span>
    <span style="color:#8bcac3">mycli deploy --env &lt;name&gt;</span>

  <span style="color:#777d80">Next:</span>
    <span style="color:#8bcac3">mycli deploy --env staging</span>

<span style="color:#e67875">✗ error:</span> config not found

  <span style="color:#777d80">Reason:</span> no <span style="color:#8bcac3">myapp.toml</span> in this directory
  <span style="color:#777d80">Next:</span>
    <span style="color:#8bcac3">myapp init</span></pre>

错误不是“红一点”就够了；它必须说清楚原因、上下文和下一步。

### 2. 语义颜色、进度和结果状态

**改造前**

```text
Important: run mycli cache clear now
See docs: https://example.com/docs/cache

Downloading model.bin 3.8/5.1 MB 74% 1.2 MB/s eta 1s
Downloaded model.bin 5.1 MB in 4.2s
Ran tests. Some failed. Lots of log output...
```

**改造后**

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto">Run <span style="color:#8bcac3">mycli cache clear</span> to remove local cache.
Docs:
  <span style="color:#8bcac3">https://example.com/docs/cache</span>

<span style="color:#8bcac3">model.bin</span>  [<span style="color:#8ecf8a">████████████</span><span style="color:#777d80">░░░░</span>] 74%  3.8/5.1 MB  (1.2 MB/s) eta 1s
<span style="color:#8ecf8a">✓ pass</span> downloaded <span style="color:#8bcac3">model.bin</span> (5.1 MB) in 4.2s

<span style="color:#8ecf8a">✓ pass 142</span>   <span style="color:#e67875">✗ fail 1</span>   <span style="color:#777d80">⊘ skip 3</span>        4.2s
  <span style="color:#e67875">✗ fail</span> internal/cache: TestEvict/expired
      cache_test.go:88: expected 0 entries, got 1</pre>

红色给当前失败，绿色给通过，黄色给风险，青色给技术 token。进度必须诚实，并且必须落到终态。

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

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto"><span style="color:#777d80">NUMBER  TITLE                STATE   UPDATED</span>
#128    Fix color fallback   open    2h ago
#127    Bump deps            merged  1d ago

Pull request <span style="color:#8bcac3">#128</span>                                  open
  Title     Fix color fallback
  Author    zw
  Branch    <span style="color:#8bcac3">fix-color</span> -> <span style="color:#8bcac3">main</span>
  Checks    <span style="color:#8ecf8a">✓ pass</span> 4
  Files     6 changed (+128 -34)

<span style="color:#e67875">error[E0382]:</span> borrow of moved value: <span style="color:#8bcac3">cfg</span>
   <span style="color:#777d80">┌─ src/main.go:14:9</span>
12 │   load(cfg)
   │        <span style="color:#e5c069">--- value moved here</span>
14 │   print(cfg)
   │         <span style="color:#e67875">^^^ value used after move</span>
   = help: clone <span style="color:#8bcac3">cfg</span> before load()</pre>

同质数据用表格，单个对象用 key-value，诊断要能被人和工具同时读取。

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
```

**改造后**

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto">{
  "schema_version": "1",
  "ok": false,
  "duration_ms": 412,
  "checks": [
    {
      "name": "config_file",
      "status": "<span style="color:#e67875">fail</span>",
      "message": "not configured",
      "next_steps": [
        { "command": "mycli config init", "reason": "create config" }
      ]
    }
  ]
}

<span style="color:#777d80">NAME        STATUS</span>
配置文件    <span style="color:#e5c069">missing</span>
gateway     <span style="color:#8ecf8a">pass</span>

<span style="color:#8ecf8a">✓ pass</span> connected
  token: <span style="color:#777d80">[redacted]</span>

<span style="color:#777d80">NO_COLOR fallback:</span>
pass connected
token: [redacted]
</pre>

机器模式是契约，不能混进 ANSI、spinner、提示性 prose 或不稳定字段；secret 必须先 redaction。

### 更多普通 CLI 例子

完整 2K 图覆盖 24 个普通 CLI 输出原子：help、bad arguments、error、技术 token、进度、表格、对象详情、文件树、diff、内容块、嵌套任务、诊断、结果汇总、dry-run、空状态、日志、expressive notice、prompt、machine mode、CJK 宽度、pager、deprecation、中断、主题适配和 redaction。

![Ordinary CLI Before / After](./assets/ordinary-cli-before-after.png)

## Agent Chat TUI：改造前 / 改造后

Agent Chat 和普通 CLI 输出不同。它有 live input、transcript、assistant 流式输出、thinking、tools、approval、choice、background task、subagent、artifact 和机器事件。这个 skill 定义的是可组合原子，不是某个具体产品的一整套 UI 模板。

README 只放典型 case；完整 16 组 TUI 对比放在本节末尾图片中。

### 1. 角色、输入草稿、提交后的 transcript

**改造前**

```text
User: how do I reset the cache?
Bot: Run mycli cache clear.
You: explain this er█
You: explain this error and suggest the smallest fix
```

**改造后**

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto"><span style="color:#8bcac3">▌ You</span>
  How do I reset the cache?

<span style="color:#f4f1ea">▌ Assistant</span>
  Run <span style="color:#8bcac3">mycli cache clear</span>.

<span style="color:#8bcac3">❯ You</span>  explain this error and suggest the smallest fix

<span style="color:#777d80">Submitted transcript:</span>
<span style="color:#8bcac3">▌ You</span>
  explain this error and suggest the smallest fix
</pre>

输入草稿是 live UI，不是历史记录。光标移动、删除、候选项、IME 组合态都不能污染 transcript。

### 2. Thinking 和 Tool Use

**改造前**

```text
thinking thinking thinking
Running shell: go test ./internal/cache
exit 1 after 2.3s
cache_test.go:88: expected 0 entries, got 1
raw output mixed into assistant prose
```

**改造后**

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto"><span style="color:#8bcac3">◐ thinking</span>
<span style="color:#777d80">∴ thinking</span> inspected 4 files; running tests next
<span style="color:#8ecf8a">✓ thinking pass</span> 8s

<span style="color:#8bcac3">◐ ⚙ shell</span> running
  <span style="color:#777d80">⎿ command:</span> <span style="color:#8bcac3">go test ./internal/cache</span>

<span style="color:#e67875">✗ ⚙ shell</span> fail 2.3s
  <span style="color:#777d80">⎿ exit:</span> 1
  <span style="color:#777d80">⎿ output:</span> cache_test.go:88: expected 0 entries, got 1</pre>

不要展示 hidden chain-of-thought。可以展示可观察摘要和受限 tool 输出。

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

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto">approval required
  title: Delete stale branches
  risk: <span style="color:#e5c069">high</span>
  changes: 12 branches
  next: approve with y, deny with n

Approve? [y/N]

<span style="color:#e5c069">⚠ warning:</span> tool output truncated to 200 lines
<span style="color:#e67875">✗ error:</span> command failed with exit 2
timer: retrying in 30s
background: task queued · id=<span style="color:#8bcac3">sync-42</span>

<span style="color:#f4f1ea">▌ Assistant</span>
  Generated <span style="color:#8bcac3">checks.csv</span> with 10,002 rows.
  Preview: 2 rows shown, 10,000 hidden.
<span style="color:#777d80">artifact:</span> checks.csv</pre>

审批是 key-value 原子。大 artifact 只展示摘要和稳定引用，不把完整数据塞进聊天正文。

### 4. 非 TTY 和 NDJSON 事件

**改造前**

```text
\x1b[?25lAssistant thinking\r
\x1b[36mTool shell running go test ./internal/cache\x1b[0m
Tool shell fail exit=1 duration_ms=2300
Thinking...
{"tool":"shell"}
Done!
Partial assistant prose...
```

**改造后**

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto">Assistant: thinking started
Tool shell: running command=<span style="color:#8bcac3">"go test ./internal/cache"</span>
Tool shell: fail exit=1 duration_ms=2300
Assistant: failing test is internal/cache TestEvict/expired

{"type":"turn.start","role":"user","message":"Find the failing test."}
{"type":"thinking.start","status":"running"}
{"type":"tool.start","tool_name":"shell","call_id":"c1","status":"running"}
{"type":"tool.end","tool_name":"shell","call_id":"c1","status":"fail","exit_code":1}
{"type":"turn.end","role":"assistant","status":"pass"}</pre>

非 TTY 下不保留 live UI、光标控制、动画、边框或 raw ANSI。机器事件使用稳定 type。

### 更多 Agent Chat TUI 例子

完整 2K 图覆盖 16 组 Agent Chat TUI：transcript role、输入草稿、多行粘贴、IME/CJK、assistant streaming、thinking summary、tool use、tool result、choice、approval、alert、timer、background task、subagent、主题适配、suggestion、file mention、cancel、approval outcome、artifact、plain non-TTY fallback 和 NDJSON event mode。

![Agent Chat TUI Before / After](./assets/agent-chat-tui-before-after.png)

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
