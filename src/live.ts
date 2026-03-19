#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execFileSync } from 'node:child_process';

type TurnContextPayload = {
  cwd?: string;
  model?: string;
};

type TokenCountPayload = {
  info?: {
    total_token_usage?: {
      input_tokens?: number;
    };
    model_context_window?: number;
  };
};

type SessionSnapshot = {
  cwd: string;
  model: string;
  inputTokens: number;
  contextWindowSize: number;
  transcriptPath: string;
};

function listFilesRecursively(root: string): string[] {
  if (!fs.existsSync(root)) return [];

  const files: string[] = [];
  const stack: string[] = [root];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && full.endsWith('.jsonl')) {
        files.push(full);
      }
    }
  }

  return files;
}

function getLatestSessionFile(): string | null {
  const sessionsDir = path.join(os.homedir(), '.codex', 'sessions');
  const files = listFilesRecursively(sessionsDir);
  if (files.length === 0) return null;

  files.sort((a, b) => {
    try {
      return fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs;
    } catch {
      return 0;
    }
  });

  return files[files.length - 1] ?? null;
}

function readSnapshot(sessionFile: string): SessionSnapshot | null {
  let content = '';
  try {
    content = fs.readFileSync(sessionFile, 'utf8');
  } catch {
    return null;
  }

  const lines = content.split('\n').filter(Boolean);
  if (lines.length === 0) return null;

  let cwd = process.cwd();
  let model = 'gpt-5-codex';
  let inputTokens = 0;
  let contextWindowSize = 200_000;

  const start = Math.max(0, lines.length - 800);
  for (let i = start; i < lines.length; i += 1) {
    const raw = lines[i];
    try {
      const row = JSON.parse(raw) as {
        type?: string;
        payload?: unknown;
      };

      if (row.type === 'turn_context') {
        const payload = (row.payload ?? {}) as TurnContextPayload;
        if (typeof payload.cwd === 'string' && payload.cwd.trim()) {
          cwd = payload.cwd;
        }
        if (typeof payload.model === 'string' && payload.model.trim()) {
          model = payload.model;
        }
      }

      if (row.type === 'event_msg') {
        const payload = (row.payload ?? {}) as { type?: string } & TokenCountPayload;
        if (payload.type === 'token_count') {
          const tokens = payload.info?.total_token_usage?.input_tokens;
          const window = payload.info?.model_context_window;
          if (typeof tokens === 'number' && Number.isFinite(tokens)) {
            inputTokens = Math.max(0, Math.floor(tokens));
          }
          if (typeof window === 'number' && Number.isFinite(window) && window > 0) {
            contextWindowSize = Math.floor(window);
          }
        }
      }
    } catch {
      // Ignore malformed JSONL rows.
    }
  }

  return {
    cwd,
    model,
    inputTokens,
    contextWindowSize,
    transcriptPath: sessionFile,
  };
}

function renderHud(snapshot: SessionSnapshot): string {
  const payload = {
    cwd: snapshot.cwd,
    transcript_path: snapshot.transcriptPath,
    model: {
      display_name: snapshot.model,
      id: snapshot.model,
    },
    context_window: {
      current_usage: {
        input_tokens: snapshot.inputTokens,
      },
      context_window_size: snapshot.contextWindowSize,
    },
  };

  try {
    return execFileSync('codex-hud', {
      input: `${JSON.stringify(payload)}\n`,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  } catch {
    return '[codex-hud-live] failed to render via codex-hud\n';
  }
}

function clearScreen(): void {
  process.stdout.write('\u001bc');
}

function loop(): void {
  const latest = getLatestSessionFile();
  if (!latest) {
    clearScreen();
    process.stdout.write('[codex-hud-live] No session file found under ~/.codex/sessions\n');
    return;
  }

  const snapshot = readSnapshot(latest);
  if (!snapshot) {
    clearScreen();
    process.stdout.write('[codex-hud-live] Failed to parse latest session\n');
    return;
  }

  const out = renderHud(snapshot);
  const now = new Date().toLocaleTimeString();
  clearScreen();
  process.stdout.write(out);
  process.stdout.write(`\n[live] ${now} | session: ${latest}\n`);
  process.stdout.write('[live] press Ctrl+C to exit\n');
}

loop();
setInterval(loop, 1000);
