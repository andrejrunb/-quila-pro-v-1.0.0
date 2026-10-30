import os
import json
import glob
import sys
sys.stdout.reconfigure(encoding='utf-8')

BRAIN_DIR = r"C:\Users\Thaysa\.gemini\antigravity\brain"
OUT_COLAB = "colab/data_finetuning/aquila_conversations_corpus.jsonl"
OUT_SWARM = "swarm/dataset/aquila_conversations_corpus.jsonl"

def pack_conversations():
    print("=" * 70)
    print("EMPACOTADOR DE CONVERSAS PARA GPU (PROTOCOLO ZERO-TOKEN-WASTE)")
    print("=" * 70)
    
    os.makedirs(os.path.dirname(OUT_COLAB), exist_ok=True)
    os.makedirs(os.path.dirname(OUT_SWARM), exist_ok=True)
    
    folders = [f for f in os.listdir(BRAIN_DIR) if os.path.isdir(os.path.join(BRAIN_DIR, f))]
    print(f"Indexando {len(folders)} pastas no Brain...")
    
    total_bytes = 0
    total_items = 0
    total_prompts = 0
    total_artifacts = 0
    
    with open(OUT_COLAB, "w", encoding="utf-8") as out_colab, open(OUT_SWARM, "w", encoding="utf-8") as out_swarm:
        for idx, fld in enumerate(folders):
            conv_path = os.path.join(BRAIN_DIR, fld)
            transcript_file = os.path.join(conv_path, ".system_generated", "logs", "transcript.jsonl")
            
            # 1. Process Artifacts
            md_files = glob.glob(os.path.join(conv_path, "*.md"))
            for md in md_files:
                fname = os.path.basename(md)
                try:
                    with open(md, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    rec = {
                        "type": "artifact",
                        "conversation_id": fld,
                        "filename": fname,
                        "content": content,
                        "bytes": len(content.encode("utf-8"))
                    }
                    total_bytes += rec["bytes"]
                    total_artifacts += 1
                    total_items += 1
                    line = json.dumps(rec, ensure_ascii=False) + "\n"
                    out_colab.write(line)
                    out_swarm.write(line)
                except:
                    pass
                    
            # 2. Process Transcripts
            if os.path.exists(transcript_file):
                try:
                    with open(transcript_file, "r", encoding="utf-8", errors="ignore") as tf:
                        for line in tf:
                            if not line.strip():
                                continue
                            try:
                                step = json.loads(line)
                                stype = step.get("type")
                                if stype == "USER_INPUT":
                                    u_text = step.get("content", "").strip()
                                    if u_text and not u_text.startswith("<SYSTEM_MESSAGE>"):
                                        total_prompts += 1
                                        rec = {
                                            "type": "user_instruction",
                                            "conversation_id": fld,
                                            "step_index": step.get("step_index"),
                                            "created_at": step.get("created_at"),
                                            "instruction": u_text,
                                            "bytes": len(u_text.encode("utf-8"))
                                        }
                                        total_bytes += rec["bytes"]
                                        total_items += 1
                                        s_line = json.dumps(rec, ensure_ascii=False) + "\n"
                                        out_colab.write(s_line)
                                        out_swarm.write(s_line)
                            except:
                                continue
                except:
                    pass

    est_tokens = int(total_bytes / 3.8) # Média aproximada de tokens por byte em PT/Code
    mb_processed = round(total_bytes / (1024 * 1024), 2)
    
    print("\n" + "=" * 70)
    print("EMPACOTAMENTO CONCLUÍDO COM SUCESSO!")
    print(f"Total de registros compilados: {total_items} (Prompts: {total_prompts}, Artefatos: {total_artifacts})")
    print(f"Volume de dados empacotados: {mb_processed} MB")
    print(f"🔥 TOKENS DE IA ECONOMIZADOS DO CHAT: ~{est_tokens:,} tokens!")
    print(f"Arquivos gerados para a GPU:")
    print(f"  - {OUT_COLAB}")
    print(f"  - {OUT_SWARM}")
    print("=" * 70)

if __name__ == "__main__":
    pack_conversations()
