import os
import json
import uuid
import time
from datetime import datetime

class HaloTelemetrySink:
    def __init__(self, trace_dir=None):
        self.trace_dir = trace_dir or os.environ.get('HALO_TRACE_DIR')
        self.active_spans = {}

    def start_span(self, agent_id, name, step_type, input_data, trace_id=None, parent_id=None, context_metadata=None):
        span_id = str(uuid.uuid4())
        span = {
            "id": span_id,
            "traceId": trace_id or str(uuid.uuid4()),
            "parentId": parent_id,
            "agentId": agent_id,
            "name": name,
            "stepType": step_type, # intent | subtask | tool_call | reflection
            "input": input_data,
            "startTime": int(time.time() * 1000),
            "status": "running",
            "contextMetadata": context_metadata
        }
        self.active_spans[span_id] = span
        return span_id

    def end_span(self, span_id, output_data=None, error=None):
        span = self.active_spans.pop(span_id, None)
        if not span:
            return

        span["endTime"] = int(time.time() * 1000)
        span["output"] = output_data
        span["status"] = "error" if error else "completed"
        span["error"] = error

        self._flush_span(span)

    def _flush_span(self, span):
        if not self.trace_dir:
            # Fallback to local traces if dir not provided
            self.trace_dir = os.path.join(os.getcwd(), "traces")

        if not os.path.exists(self.trace_dir):
            try:
                os.makedirs(self.trace_dir, exist_ok=True)
            except:
                return

        date_str = datetime.now().strftime("%Y-%m-%d")
        log_file = os.path.join(self.trace_dir, f"traces_{date_str}.jsonl")

        try:
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(span) + "\n")
        except Exception as e:
            print(f"[HALO_PYTHON] Error flushing span: {e}")

halo_sink = HaloTelemetrySink()
