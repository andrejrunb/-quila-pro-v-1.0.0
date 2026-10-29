import os
import json
import glob
import re
from datetime import datetime

BRAIN_DIR = r"C:\Users\Thaysa\.gemini\antigravity\brain"

def extract_conversation_data(conv_id):
    conv_path = os.path.join(BRAIN_DIR, conv_id)
    transcript_path = os.path.join(conv_path, ".system_generated", "logs", "transcript.jsonl")
    
    data = {
        "id": conv_id,
        "path": conv_path,
        "has_transcript": os.path.exists(transcript_path),
        "transcript_size_kb": 0,
        "first_time": None,
        "last_time": None,
        "user_prompts": [],
        "artifacts": [],
        "agent_tasks": []
    }
    
    # 1. Inspect Artifacts (.md files in root or subdirs)
    md_files = glob.glob(os.path.join(conv_path, "*.md"))
    for md in md_files:
        fname = os.path.basename(md)
        try:
            with open(md, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read(1500) # Read first 1500 chars
                first_lines = [line.strip() for line in content.split("\n") if line.strip()][:5]
                title = first_lines[0] if first_lines else fname
                data["artifacts"].append({
                    "filename": fname,
                    "title": title,
                    "snippet": content[:300].replace("\n", " ")
                })
        except:
            pass

    # 2. Inspect Transcript
    if os.path.exists(transcript_path):
        size_kb = os.path.getsize(transcript_path) / 1024.0
        data["transcript_size_kb"] = round(size_kb, 1)
        
        try:
            with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
                step_idx = 0
                for line in f:
                    step_idx += 1
                    if not line.strip():
                        continue
                    try:
                        step = json.loads(line)
                        ts = step.get("created_at")
                        if ts:
                            if not data["first_time"]:
                                data["first_time"] = ts
                            data["last_time"] = ts
                            
                        stype = step.get("type")
                        if stype == "USER_INPUT":
                            content = step.get("content", "")
                            # filter out system messages or empty
                            if content and not content.startswith("<SYSTEM_MESSAGE>"):
                                data["user_prompts"].append({
                                    "step": step_idx,
                                    "time": ts,
                                    "text": content[:500].strip()
                                })
                    except:
                        continue
        except:
            pass

    return data

def main():
    print(f"Scanning brain directory: {BRAIN_DIR}")
    folders = [f for f in os.listdir(BRAIN_DIR) if os.path.isdir(os.path.join(BRAIN_DIR, f))]
    print(f"Found {len(folders)} total folders.")
    
    all_conversations = []
    for idx, folder in enumerate(folders):
        cdata = extract_conversation_data(folder)
        all_conversations.append(cdata)
        if (idx + 1) % 20 == 0:
            print(f"  Processed {idx + 1}/{len(folders)}...")
            
    # Filter and sort by date or presence of user prompts / artifacts
    with_activity = [c for c in all_conversations if c["user_prompts"] or c["artifacts"] or c["transcript_size_kb"] > 0]
    print(f"\nTotal active conversations with history/artifacts: {len(with_activity)}")
    
    # Save raw mining summary
    out_json = "docs/conversations_mining_summary.json"
    os.makedirs(os.path.dirname(out_json), exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(all_conversations, f, indent=2, ensure_ascii=False)
        
    print(f"Mining raw data saved to {out_json}")
    
    # Print key statistics
    total_prompts = sum(len(c["user_prompts"]) for c in with_activity)
    total_artifacts = sum(len(c["artifacts"]) for c in with_activity)
    print(f"Total user requests extracted: {total_prompts}")
    print(f"Total markdown artifacts discovered: {total_artifacts}")

if __name__ == "__main__":
    main()
