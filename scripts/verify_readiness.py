import sys
import os
import cv2
import json

def check_readiness():
    results = {
        "python_version": sys.version,
        "modules": {},
        "hardware": {}
    }
    
    # Check Modules
    modules = ["face_recognition", "cv2", "numpy", "onnxruntime", "PIL"]
    for m in modules:
        try:
            mod = __import__(m)
            results["modules"][m] = "INSTALLED"
        except Exception as e:
            results["modules"][m] = f"MISSING/ERROR: {str(e)}"
            
    # Specific check for face_recognition_models
    try:
        import face_recognition_models
        results["modules"]["face_recognition_models"] = "INSTALLED"
    except ImportError:
        results["modules"]["face_recognition_models"] = "MISSING"

    # Check Camera
    try:
        cap = cv2.VideoCapture(0)
        if cap.isOpened():
            results["hardware"]["camera_0"] = "ACCESSIBLE"
            ret, frame = cap.read()
            if ret:
                results["hardware"]["camera_frame"] = "CAPTURE_OK"
            cap.release()
        else:
            results["hardware"]["camera_0"] = "NOT_FOUND_OR_BUSY"
    except Exception as e:
        results["hardware"]["camera_error"] = str(e)
        
    return results

if __name__ == "__main__":
    print("--- ÁQUILA PRO FIELD READINESS CHECK ---")
    data = check_readiness()
    print(json.dumps(data, indent=2))
    
    if all(status == "INSTALLED" for status in data["modules"].values()) and \
       data["hardware"].get("camera_0") == "ACCESSIBLE":
        print("\n[SUCCESS] Environment is ready for field testing.")
    else:
        print("\n[WARNING] Some components are missing or inaccessible.")
