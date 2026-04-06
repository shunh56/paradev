import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const PARADEV_DIR = join(homedir(), ".paradev");
const CONFIG_PATH = join(PARADEV_DIR, "config.json");

export function ensureParadevDir() {
  if (!existsSync(PARADEV_DIR)) {
    mkdirSync(PARADEV_DIR, { recursive: true });
  }
}

export function getConfig() {
  ensureParadevDir();
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    console.error(
      "Warning: ~/.paradev/config.json is corrupted.\n" +
      "Run `paradev auth` to reconfigure, or delete ~/.paradev/config.json"
    );
    return {};
  }
}

export function saveConfig(config) {
  ensureParadevDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getGitHubToken() {
  const config = getConfig();
  return config.githubToken || null;
}

export { PARADEV_DIR };
