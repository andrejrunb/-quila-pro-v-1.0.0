import { HaloSpan, haloTraceRegistry } from '../HaloTraceRegistry';
import { generativeAIService } from '../GenerativeAIService';
import { PromptRegistry } from './PromptRegistry';

export class HaloOptimizer {
  private static instance: HaloOptimizer;

  private constructor() {}

  public static getInstance(): HaloOptimizer {
    if (!HaloOptimizer.instance) {
      HaloOptimizer.instance = new HaloOptimizer();
    }
    return HaloOptimizer.instance;
  }

  /**
   * Performs Hierarchical Trace Compaction (HTC)
   * Collapses repetitive or low-level spans into high-level milestones.
   */
  public async compactTraces(spans: HaloSpan[]): Promise<string> {
    if (spans.length === 0) return "No traces found.";

    // Group spans by traceId
    const traceGroups = this.groupSpansByTrace(spans);
    let summary = "";

    for (const [traceId, traceSpans] of Object.entries(traceGroups)) {
      summary += `### Trace ID: ${traceId}\n`;
      
      // Sort spans by start time
      const sortedSpans = traceSpans.sort((a, b) => a.startTime - b.startTime);
      
      const compactLog = sortedSpans.map(s => {
        const duration = s.endTime ? `${s.endTime - s.startTime}ms` : 'N/A';
        return `- [${s.name}] (${duration}) ${s.status.toUpperCase()}: ${JSON.stringify(s.input).substring(0, 100)}... -> ${JSON.stringify(s.output).substring(0, 100)}...`;
      }).join('\n');
      
      // If trace is very complex, use LLM to compact it
      if (sortedSpans.length > 5) {
        summary += await generativeAIService.analyzeContent(
          PromptRegistry.HALO_TRACE_COMPACTION(compactLog)
        );
      } else {
        summary += compactLog;
      }
      summary += "\n\n";
    }

    return summary;
  }

  /**
   * Refinement Loop Model (RLM)
   * Analyzes compacted traces to identify failure patterns and suggest prompt improvements.
   */
  public async generateRefinementReport(agentId: string, currentPrompt: string): Promise<string> {
    const traces = await haloTraceRegistry.getRecentTraces(agentId, 30);
    const compactedLogs = await this.compactTraces(traces);

    const refinementPrompt = PromptRegistry.HALO_REFINEMENT_ANALYSIS({
      agentId,
      currentPrompt,
      compactedLogs
    });

    return await generativeAIService.analyzeContent(refinementPrompt);
  }

  private groupSpansByTrace(spans: HaloSpan[]): Record<string, HaloSpan[]> {
    return spans.reduce((acc, span) => {
      if (!acc[span.traceId]) acc[span.traceId] = [];
      acc[span.traceId].push(span);
      return acc;
    }, {} as Record<string, HaloSpan[]>);
  }
}

export const haloOptimizer = HaloOptimizer.getInstance();
