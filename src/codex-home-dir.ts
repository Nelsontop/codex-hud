import * as path from 'node:path';

function expandHomeDirPrefix(inputPath: string, homeDir: string): string {
  if (inputPath === '~') {
    return homeDir;
  }
  if (inputPath.startsWith('~/') || inputPath.startsWith('~\\')) {
    return path.join(homeDir, inputPath.slice(2));
  }
  return inputPath;
}

export function getCodexHomeDir(homeDir: string): string {
  const envCodexHome = process.env.CODEX_HOME?.trim();
  if (!envCodexHome) {
    return path.join(homeDir, '.codex');
  }
  return path.resolve(expandHomeDirPrefix(envCodexHome, homeDir));
}

export function getCodexConfigJsonPath(homeDir: string): string {
  return `${getCodexHomeDir(homeDir)}.json`;
}

export function getHudPluginDir(homeDir: string): string {
  return path.join(getCodexHomeDir(homeDir), 'plugins', 'codex-hud');
}
