import { describe, it, afterEach } from "node:test";
import assert from "node:assert";
import { detectEnvironment } from "../src/terminal.js";

describe("terminal.js", () => {
  describe("detectEnvironment", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      // Restore original env
      process.env = { ...originalEnv };
    });

    it("detects Antigravity", () => {
      process.env.ANTIGRAVITY_CLI_ALIAS = "agy";
      process.env.TERM_PROGRAM = "vscode";
      assert.strictEqual(detectEnvironment(), "antigravity");
    });

    it("detects Antigravity via ANTIGRAVITY_EDITOR_READY", () => {
      process.env.ANTIGRAVITY_EDITOR_READY = "1";
      process.env.TERM_PROGRAM = "vscode";
      assert.strictEqual(detectEnvironment(), "antigravity");
    });

    it("detects Cursor", () => {
      delete process.env.ANTIGRAVITY_CLI_ALIAS;
      delete process.env.ANTIGRAVITY_EDITOR_READY;
      process.env.CURSOR_CHANNEL = "stable";
      process.env.TERM_PROGRAM = "vscode";
      assert.strictEqual(detectEnvironment(), "cursor");
    });

    it("detects VS Code", () => {
      delete process.env.ANTIGRAVITY_CLI_ALIAS;
      delete process.env.ANTIGRAVITY_EDITOR_READY;
      delete process.env.CURSOR_CHANNEL;
      delete process.env.CURSOR_TRACE_DIR;
      process.env.TERM_PROGRAM = "vscode";
      assert.strictEqual(detectEnvironment(), "vscode");
    });

    it("detects iTerm2", () => {
      delete process.env.ANTIGRAVITY_CLI_ALIAS;
      delete process.env.ANTIGRAVITY_EDITOR_READY;
      delete process.env.CURSOR_CHANNEL;
      delete process.env.CURSOR_TRACE_DIR;
      process.env.TERM_PROGRAM = "iTerm.app";
      assert.strictEqual(detectEnvironment(), "iterm");
    });

    it("detects Terminal.app", () => {
      delete process.env.ANTIGRAVITY_CLI_ALIAS;
      delete process.env.ANTIGRAVITY_EDITOR_READY;
      delete process.env.CURSOR_CHANNEL;
      delete process.env.CURSOR_TRACE_DIR;
      process.env.TERM_PROGRAM = "Apple_Terminal";
      assert.strictEqual(detectEnvironment(), "terminal");
    });

    it("returns unknown for unrecognized environment", () => {
      delete process.env.ANTIGRAVITY_CLI_ALIAS;
      delete process.env.ANTIGRAVITY_EDITOR_READY;
      delete process.env.CURSOR_CHANNEL;
      delete process.env.CURSOR_TRACE_DIR;
      delete process.env.TERM_PROGRAM;
      assert.strictEqual(detectEnvironment(), "unknown");
    });

    it("Antigravity takes priority over Cursor", () => {
      process.env.ANTIGRAVITY_CLI_ALIAS = "agy";
      process.env.CURSOR_CHANNEL = "stable";
      process.env.TERM_PROGRAM = "vscode";
      assert.strictEqual(detectEnvironment(), "antigravity");
    });

    it("Cursor takes priority over VS Code", () => {
      delete process.env.ANTIGRAVITY_CLI_ALIAS;
      delete process.env.ANTIGRAVITY_EDITOR_READY;
      process.env.CURSOR_CHANNEL = "stable";
      process.env.TERM_PROGRAM = "vscode";
      assert.strictEqual(detectEnvironment(), "cursor");
    });
  });
});
