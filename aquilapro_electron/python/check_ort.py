import onnxruntime as ort
import json
import sys

def check_providers():
    providers = ort.get_available_providers()
    devices = []
    
    # Tentativa de detalhamento via DirectML se disponível
    has_dml = "DmlExecutionProvider" in providers
    
    result = {
        "providers": providers,
        "recommended": "DmlExecutionProvider" if has_dml else "CPUExecutionProvider",
        "has_npu_guess": any("NPU" in p.upper() for p in providers) or has_dml
    }
    
    print(json.dumps(result))

if __name__ == "__main__":
    check_providers()
