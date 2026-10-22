import os
import json
import glob
from datetime import datetime
from collections import defaultdict

class HaloOptimizer:
    """
    Hierarchical Agent Loop Optimizer (HALO) for Áquila Pro.
    Analyzes local execution traces to identify 'Trace Explosions' and bottlenecks.
    """
    def __init__(self, trace_dir):
        self.trace_dir = trace_dir

    def load_traces(self, days_back=1):
        """Loads traces from the last N days."""
        all_spans = []
        # Get all traces files
        files = glob.glob(os.path.join(self.trace_dir, "traces_*.jsonl"))
        files.sort(reverse=True)
        
        for file_path in files[:days_back]:
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        all_spans.append(json.loads(line))
                    except:
                        continue
        return all_spans

    def analyze_hierarchies(self, spans):
        """Reconstructs the trace tree to find deep nesting or loops."""
        traces = defaultdict(list)
        for span in spans:
            traces[span['traceId']].append(span)
        
        optimizations = []
        for trace_id, trace_spans in traces.items():
            # Check for depth
            if len(trace_spans) > 20:
                optimizations.append({
                    "traceId": trace_id,
                    "issue": "Trace Explosion",
                    "severity": "high",
                    "count": len(trace_spans),
                    "recommendation": "Deconstruct into hierarchical sub-tasks or use parallel execution."
                })
            
            # Check for loops (repeated names in same trace)
            names = [s['name'] for s in trace_spans]
            for name in set(names):
                if names.count(name) > 5:
                    optimizations.append({
                        "traceId": trace_id,
                        "issue": f"Potential Loop: {name}",
                        "severity": "medium",
                        "count": names.count(name),
                        "recommendation": "Implement early exit or caching for this agentic step."
                    })
        
        return optimizations

    def run_optimization_cycle(self):
        """Main entry point for the optimizer worker."""
        print(f"[HALO_OPTIMIZER] Starting analysis in {self.trace_dir}")
        spans = self.load_traces()
        if not spans:
            print("[HALO_OPTIMIZER] No traces found.")
            return []
            
        results = self.analyze_hierarchies(spans)
        print(f"[HALO_OPTIMIZER] Found {len(results)} optimization candidates.")
        return results

if __name__ == "__main__":
    # Path provided by Electron main process
    trace_path = os.environ.get('HALO_TRACE_DIR', './traces')
    optimizer = HaloOptimizer(trace_path)
    results = optimizer.run_optimization_cycle()
    
    # Output structured results for Electron to parse
    print("---HALO_RESULTS_START---")
    print(json.dumps(results))
    print("---HALO_RESULTS_END---")
