# Codex HUD

一个受 `claude-hud` 启发的 Codex HUD 工具：从 stdin JSON 渲染实时状态信息（模型、上下文占用、Git、工具/子代理/Todo 活动）。

## 项目目标

`codex-hud` 提供一个独立命令行渲染器，方便你在 Codex 工作流中观察运行状态。

当前能力：

- 渲染模型与项目信息
- 渲染上下文占用条与百分比
- 渲染 Git 分支与脏状态
- 解析 transcript JSONL，展示 tools / agents / todos
- 可通过 `~/.codex/plugins/codex-hud/config.json` 自定义显示

## 重要说明（先看）

Codex 当前原生 `tui.status_line` 只支持内置字段项，不支持 Claude 那种 `statusLine.command` 常驻外部渲染。

这意味着：

- `codex-hud` 可以安装并运行
- 可以挂到 `notify` 钩子在回合结束触发
- 但不能作为 Codex 底部“持久自定义 HUD 行”直接嵌入

## 安装

### 方式 1：项目内使用（推荐开发）

```bash
npm ci
npm run build
```

运行测试：

```bash
npm test
```

### 方式 2：用户级全局安装（推荐日常）

```bash
npm ci
npm run build
npm install -g --prefix "$HOME/.local" .
```

确认命令可用：

```bash
codex-hud --help
```

如果 `codex-hud` 未找到，请确保 `~/.local/bin` 在 `PATH` 里。

## 快速验证

```bash
echo '{"cwd":"'$PWD'","model":{"display_name":"gpt-5-codex"},"context_window":{"current_usage":{"input_tokens":22000},"context_window_size":200000}}' | codex-hud
```

预期会输出两行 HUD（模型行 + Context 行）。

## 输入协议（stdin JSON）

最小示例：

```json
{
  "cwd": "/path/to/project",
  "model": { "display_name": "gpt-5-codex" },
  "context_window": {
    "current_usage": { "input_tokens": 22000 },
    "context_window_size": 200000
  }
}
```

常用字段：

- `cwd`: 工作目录
- `transcript_path`: transcript JSONL 路径
- `model.id` / `model.display_name`: 模型信息
- `context_window.current_usage.*`: token 使用
- `context_window.context_window_size`: 上下文窗口大小
- `context_window.used_percentage`: 原生占用百分比（优先使用）

## Codex 接入（notify 触发）

### 1) 准备配置目录

```bash
mkdir -p ~/.codex/plugins/codex-hud
```

### 2) 新建或修改 `~/.codex/config.toml`

顶层加入：

```toml
notify = ["bash", "-lc", "~/.codex/plugins/codex-hud/notify.sh"]

[plugins.codex-hud]
enabled = true
```

### 3) 创建通知脚本

路径：`~/.codex/plugins/codex-hud/notify.sh`

这个脚本从 notify payload 提取常见字段后调用 `codex-hud`。

## 配置

默认配置路径：

- `~/.codex/plugins/codex-hud/config.json`
- 若设置 `CODEX_HOME`，则为 `${CODEX_HOME}/plugins/codex-hud/config.json`

可配置项定义见：`src/config.ts` 中 `HudConfig`。

常用开关（`display.*`）：

- `showTools`
- `showAgents`
- `showTodos`
- `showConfigCounts`
- `showSessionName`

## 开发

```bash
npm run build
npm test
npm run test:stdin
```

## 目录结构

- `src/index.ts`：程序入口与主流程
- `src/stdin.ts`：stdin 读取与上下文比例计算
- `src/transcript.ts`：transcript JSONL 解析
- `src/render/*`：HUD 行渲染
- `src/config.ts`：配置模型与加载
- `src/config-reader.ts`：AGENTS/rules/MCP/hooks 统计
- `src/usage-api.ts`：使用量 API（可选）

## 常见问题

### 1) 重启 Codex 后“看不到变化”

先确认 `notify` 是否写在顶层（不是 `[plugins.codex-hud]` 表内）。

检查触发日志（如果你在脚本里加了日志）：

```bash
tail -n 50 ~/.codex/plugins/codex-hud/notify.log
```

### 2) `codex-hud` 命令不存在

确认安装命令是否使用了用户前缀，并检查 `PATH` 是否包含 `~/.local/bin`。

### 3) 想要像 Claude HUD 那样常驻底栏

目前 Codex 不提供等价 `statusLine.command` 能力，暂无法做到外部命令常驻渲染。

## 致谢

灵感与实现参考来源：

- https://github.com/jarrodwatts/claude-hud

