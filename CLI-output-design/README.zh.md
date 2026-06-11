# CLI Output Design

**语言 / Language:** [English](./README.md) | 中文

让命令行输出更清楚、更可信、更容易行动。

这个 skill 用来设计、检查或改进 CLI 在终端里打印出来的内容。它关注的不是让终端看起来更花哨，而是让用户更快理解：发生了什么、改了什么、还在运行什么、哪里失败了，以及下一步该怎么做。

适合产品 CLI、开发工具、Agent 工具、部署工具、测试命令、诊断命令，以及任何用户需要从终端输出里快速判断状态的场景。

## 如何使用

### 1. 安装

从 GitHub 安装这个目录：

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --url https://github.com/Mai8304/skills/tree/main/CLI-output-design
```

安装后重启你的 agent 环境，让新能力被自动发现。

### 2. 请求 CLI 输出设计

当你在设计或改进终端输出时使用它：

```text
Use $cli-output-design to review this command output and make it easier to understand.
```

也可以提供截图、复制出来的终端文本，或者描述一个命令场景：

```text
Use $cli-output-design to redesign the output for a deploy command.
It should show progress, changed resources, failures, and the next action clearly.
```

### 3. 补充用户场景

给一点上下文，效果会更好：

- 谁会读这些输出：新用户、日常运维者、开发者、支持团队，还是 agent。
- 输出出现在哪里：交互式终端、CI 日志、重定向文件、JSON 模式，还是窄窗口。
- 用户读完以后需要做什么判断。
- 哪些状态最重要：成功、失败、进度、空状态、警告，还是汇总。

## 这个 Skill 能帮你改善什么

- **状态更清楚：** 让运行中、通过、失败、警告、跳过、已变更、未变更这些状态更容易扫读。
- **进度更可信：** 长任务要有反馈，但不要假进度、卡在 99%，或留下没有结束状态的 spinner。
- **错误更有帮助：** 说明发生了什么、为什么重要、下一步该做什么。
- **布局更好读：** 整理表格、摘要、检查清单、日志、diff 和结果区块。
- **视觉更克制：** 颜色和符号只表达含义，不做装饰。
- **更方便复制：** 命令、URL、路径和 ID 不要被随意换行或打断。
- **更适合自动化：** 让 `--json`、管道和 CI 日志保持干净、稳定、可解析。
- **更能适应环境：** 支持无颜色、纯文本、ASCII fallback 和窄屏终端。

## 默认输出

用于 CLI 输出设计任务时，这个 skill 可以产出：

- 修改后的终端输出示例。
- before / after 对比。
- 成功、警告、错误、空状态的推荐文案。
- 一套适用于整个 CLI 的状态词表。
- 关于进度、表格、日志、摘要的设计建议。
- 关于 `stdout`、`stderr`、`--json` 和非交互环境的处理建议。
- 发布前检查清单。

目标不是把终端做得复杂，而是让 CLI 给人的感觉更可靠：先准确，再好读，然后适合自动化，最后保持视觉上的安静和秩序。

## 体验原则

### 先给结果

用户不应该读完一大段日志才知道命令是否成功。结果、阻塞点或当前状态应该放在最容易看到的位置。

### 让失败可以行动

好的错误信息不止写 `failed`。它会说清楚原因，并给出具体下一步。

```text
✗ Config file not found

  Reason: the command needs a local config before it can deploy.
  Next:
    mycli config init
```

### 去掉装饰后仍然完整

颜色、符号和动画应该帮助用户更快扫读，但不能成为唯一信息来源。管道、CI 日志、读屏器、不支持颜色或 Unicode 的终端里，也应该读得懂。

### 把机器输出也当成产品体验

如果用户或 agent 会依赖 `--json`，它就应该稳定、干净、没有说明文字、spinner 或 ANSI 样式。进度和诊断信息不要污染数据流。

## 适合的任务

适合用这个 skill：

- 设计一个新命令的终端输出。
- 检查混乱、嘈杂或难理解的 CLI 输出。
- 改进错误信息和下一步提示。
- 让进度反馈更真实、更完整。
- 为 CI、脚本或 AI agent 准备输出。
- 给一个 CLI 产品建立统一的输出风格。

这个 skill 不负责设计命令名、参数结构或交互式向导流程。它关注的是用户运行命令之后，终端里应该怎样呈现结果。

## 发布前可以检查

发布 CLI 输出前，先问：

- 用户能不能在几秒内看懂结果？
- 每个失败有没有原因和下一步？
- 整个 CLI 是否使用同一套状态词？
- 进度是否真实，并且最终会落到明确状态？
- 管道输出是否干净？
- `--json` 是否只输出有效数据？
- 在 `NO_COLOR`、`TERM=dumb`、CI 和窄屏终端下是否仍然可读？
