import { dim } from '../colors.js';
export function renderEnvironmentLine(ctx) {
    const display = ctx.config?.display;
    if (display?.showConfigCounts === false) {
        return null;
    }
    const totalCounts = ctx.agentsMdCount + ctx.rulesCount + ctx.mcpCount + ctx.hooksCount;
    const threshold = display?.environmentThreshold ?? 0;
    if (totalCounts === 0 || totalCounts < threshold) {
        return null;
    }
    const parts = [];
    if (ctx.agentsMdCount > 0) {
        parts.push(`${ctx.agentsMdCount} AGENTS.md`);
    }
    if (ctx.rulesCount > 0) {
        parts.push(`${ctx.rulesCount} rules`);
    }
    if (ctx.mcpCount > 0) {
        parts.push(`${ctx.mcpCount} MCPs`);
    }
    if (ctx.hooksCount > 0) {
        parts.push(`${ctx.hooksCount} hooks`);
    }
    if (parts.length === 0) {
        return null;
    }
    return dim(parts.join(' | '));
}
//# sourceMappingURL=environment.js.map