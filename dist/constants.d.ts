/**
 * Autocompact buffer percentage.
 *
 * NOTE: This value is applied as a percentage of Codex CLI's reported
 * context window size. The `33k/200k` example is just the 200k-window case.
 * It is empirically derived from current Codex CLI `/context` output, is
 * not officially documented by Anthropic, and may need adjustment if users
 * report mismatches in future Codex CLI versions.
 */
export declare const AUTOCOMPACT_BUFFER_PERCENT = 0.165;
//# sourceMappingURL=constants.d.ts.map