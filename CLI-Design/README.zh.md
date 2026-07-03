# CLI-Design

[English](./README.md) · **中文** · 版本 `2.0.0`

用于设计、构建、审查和优化生产级 CLI 与 terminal TUI surface。这个 README
只是导览文档；真正给 agent 使用的执行说明在 [SKILL.md](./SKILL.md)。

## Purpose

CLI/TUI 输出是 terminal contract，不只是视觉美化。它必须告诉人、脚本或
agent：发生了什么、什么重要、下一步怎么做，以及机器能依赖什么数据契约。

这个 skill 只覆盖 terminal surface：

- Batch CLI output
- Interactive TUI components
- Agent Chat Terminal UI
- Machine-readable output
- Terminal surface 的 visual language
- 生产级 pre-ship checks

它不负责设计 command/flag API，也不负责底层 terminal input loop。

## Default Stance

使用这个优先级：

1. **Accurate**：输出真实状态、准确数量、真实原因、终态和不确定性。
2. **Human-usable**：让结果、阻塞点、下一步和恢复路径容易扫描。
3. **Agent/script-usable**：让 stdout/stderr、schema、状态词、event 和 exit code
   稳定。
4. **Visually calm**：用 layout、spacing、symbol、color 澄清含义，不做装饰。

这不是统一 CLI 模板。保留产品已有 terminal 风格，除非它违反硬契约。

## When To Use

这些场景使用这个 skill：

- command result、help/usage、argument error、diagnostic、recovery copy
- status、progress、spinner、log、summary、dry-run
- table、list、tree、code block、diff、pager、artifact
- prompt、picker、multi-select、form、approval、confirmation
- agent-chat terminal transcript、tool、approval、artifact、background work、
  interrupt、replay、event fallback
- `--json`、NDJSON、pipe/plain output、stdout/stderr、exit code、schema
  versioning、stable enum
- `NO_COLOR`、`FORCE_COLOR`、`TERM=dumb`、CI、non-TTY、pipe、narrow width、
  Unicode fallback、CJK/wide-character alignment

不要把它当固定输出模板。它的用途是选择正确 surface family、contract、
fallback 和 validation gate。

## Surface Router

打开最小必要 reference：

| Surface or decision | Read |
|---|---|
| Batch command output、help/usage、error、progress、log、table、dry-run、destructive preview、pipe/CI behavior | [references/batch-cli-output.md](./references/batch-cli-output.md) |
| Interactive terminal component、focus/selection/input mode、prompt、picker、table、pager、code/log/diff view、approval、completion menu | [references/interactive-tui.md](./references/interactive-tui.md) |
| Agent-chat terminal transcript、role、streaming/final state、tool、approval、background task、artifact、interrupt、replay/log fallback | [references/agent-chat-terminal-ui.md](./references/agent-chat-terminal-ui.md) |
| `--json`、NDJSON、pipe/plain output、stdout/stderr/exit-code contract、schema、versioning、structured error | [references/machine-readable-output.md](./references/machine-readable-output.md) |
| Visual semantic、theme token、status color/symbol、focus/selection/input/disabled/danger、density、border、table/code/diff/log visual | [references/visual-language.md](./references/visual-language.md) |
| Final production check、stop-ship condition、terminal robustness、security/trust/redaction、snapshot/golden test matrix | [references/pre-ship-gate.md](./references/pre-ship-gate.md) |

## Core Contracts

硬约束：

- 先识别 channel，再做视觉增强。
- stdout 是数据；stderr 是对话。
- machine mode 必须是纯数据，即使设置了 `FORCE_COLOR` 或 `--color=always`。
- interactive prompt 必须有 non-TTY path。
- 长任务必须落到真实终态。
- error 在可知时必须包含 cause、scope、impact、recovery。
- 破坏性操作必须 preview impact，并默认安全。
- 没有 color、glyph、animation、live redraw 时含义仍然成立。
- 对齐按 display width，不按 byte 或 rune。
- secret 必须 redacted。

## Representative Cases

例子是 recipe，不是模板。`[green]`、`[cyan+inverse]` 这类 marker 表示视觉意图；
除非 renderer 本身使用这种语法，否则不要原样输出。

### Batch CLI Output

弱输出：

```text
Success!
Everything completed beautifully.
```

生产级输出：

```text
[green]OK[/green] Deploy completed
service: api
version: v1.8.2
pods: 3 ready
duration: 42s
```

失败：

```text
[red]ERR[/red] Deploy failed
target: api
reason: registry token expired
impact: rollout did not start
next:
  shipctl auth refresh
```

### Interactive TUI

```text
? Services to restart
  [dim]Space toggle · a all · Enter submit · Esc cancel[/dim]

[cyan+inverse]▸ [ ] api[/cyan+inverse]        [dim]2 replicas[/dim]
[green]  [✓] worker[/green]     [dim]1 replica[/dim]
[dim]  [ ] legacy[/dim]     [dim]unsupported runtime[/dim]

[dim]1 selected[/dim]
```

这个例子把 focus、selection、disabled reason、key hint 和 count 分开。

### Agent Chat Terminal UI

```text
[cyan]▌ You[/cyan]
  Deploy api to staging and show the final status.

▌ Assistant [dim]streaming[/dim]
  I'll check the current rollout first.

[tool call #17] shipctl status api
[dim]running · 2.1s[/dim]

[tool result #17] [green]completed[/green] [dim]2.4s[/dim]
api ready · version v1.8.2

▌ Assistant [dim]final[/dim]
  api is already running v1.8.2 in staging.
[dim]evidence: tool #17 shipctl status api[/dim]
```

Agent Chat Terminal UI 是组合式 workspace：transcript、draft、tool state、
approval、artifact、background work、event fallback。它不是普通 command-output
模板。

### Machine-Readable Output

```json
{
  "schema_version": "1",
  "ok": false,
  "status": "failed",
  "operation": "deploy",
  "target": {
    "service": "api",
    "environment": "staging"
  },
  "error": {
    "code": "registry_auth_expired",
    "message": "Registry token expired",
    "retryable": true,
    "next_steps": [
      {
        "kind": "command",
        "command": "shipctl auth refresh",
        "reason": "refresh registry credentials"
      }
    ]
  }
}
```

machine output 里不能混入 ANSI、prose wrapper、spinner frame、Markdown fence 或装饰性空行。

## Skill Structure

```text
CLI-Design/
├── SKILL.md
└── references/
    ├── batch-cli-output.md
    ├── interactive-tui.md
    ├── agent-chat-terminal-ui.md
    ├── machine-readable-output.md
    ├── visual-language.md
    └── pre-ship-gate.md
```

`SKILL.md` 是 router 和硬契约层。reference 文件承载不同 surface 的细节。

## References

- `batch-cli-output.md`：command result、help/usage、error、progress、log、table、
  dry-run、destructive preview、pipe/CI behavior。
- `interactive-tui.md`：keyboard-owned terminal component、focus、selection、
  input mode、key hint、picker、form、pager、diff、approval、completion、live progress。
- `agent-chat-terminal-ui.md`：terminal chat transcript、user draft、assistant state、
  tool、approval、artifact、background work、interrupt、replay、event fallback。
- `machine-readable-output.md`：JSON、NDJSON、pipe/plain output、stdout/stderr、
  exit code、schema、stable enum、structured error、versioning。
- `visual-language.md`：semantic role、theme token、status color/symbol、
  focus/selection/input/disabled/danger、table、code、diff、log、accessibility。
- `pre-ship-gate.md`：production check、stop-ship condition、robustness、redaction、
  trust boundary、snapshot/golden matrix。

## Validation

修改后运行 skill validator：

```bash
python3 /Users/zhuangwei/.codex/skills/.system/skill-creator/scripts/quick_validate.py ./CLI-Design
```

建议 forward-test：

- review 一个 CLI error 和 JSON output 是否满足 channel/status/exit-code agreement。
- 设计一个 multi-select TUI，带危险确认和 non-TTY fallback。
- 设计一个 agent-chat terminal surface，包含 tool、approval、artifact 和 replay state。

## Notes For Maintainers

- 保持 `SKILL.md` 简短。细节放进 6 个 reference 之一。
- 不要新增第 7 个 reference，除非出现新的 surface family。
- 不要重新引入 README image gallery 或固定视觉模板。
- 例子保持中性，避免写入产品专属 case。
- 把例子当作信息、状态、fallback 和 contract 的 recipe，不要当 mandatory layout。
