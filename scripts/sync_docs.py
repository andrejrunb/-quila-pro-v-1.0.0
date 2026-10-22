import os
import shutil
import glob
import sys

# Configuration: Points to current conversation brain directory by default
CURRENT_CONVERSATION_ID = '5fca40fa-e48d-4bc6-bc7a-084bf4a62fe4'
DEFAULT_SOURCE_DIR = os.path.join(r'C:\Users\Thaysa\.gemini\antigravity\brain', CURRENT_CONVERSATION_ID)
TARGET_DOCS_DIR = r'c:\aquila\docs'
TARGET_BRAIN_DIR = r'c:\aquila\.aquila_brain'

def sync(source_dir=DEFAULT_SOURCE_DIR):
    print(f"Syncing artifacts from {source_dir}...")
    
    if not os.path.exists(source_dir):
        print(f"Source directory does not exist: {source_dir}")
        return

    patterns = ['*.md', '*.png', '*.webp', '*.jpg']
    
    sync_count = 0
    for pattern in patterns:
        files = glob.glob(os.path.join(source_dir, pattern))
        for src_file in files:
            file_name = os.path.basename(src_file)
            
            # Destination in docs/
            dest_file = os.path.join(TARGET_DOCS_DIR, file_name)
            try:
                shutil.copy2(src_file, dest_file)
                sync_count += 1
            except Exception as e:
                print(f"Error copying {file_name}: {e}")

    print(f"Successfully synced {sync_count} artifacts into {TARGET_DOCS_DIR}.")

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SOURCE_DIR
    sync(src)
