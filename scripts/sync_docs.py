import os
import shutil
import glob

# Configuration
SOURCE_DIR = r'C:\Users\Thaysa\.gemini\antigravity\brain\6221e7e8-5226-4be5-9c17-815652ce4ac1'
TARGET_DIR = r'c:\aquila\docs'

def sync():
    print(f"Syncing artifacts from {SOURCE_DIR} to {TARGET_DIR}...")
    
    if not os.path.exists(TARGET_DIR):
        os.makedirs(TARGET_DIR)

    # Patterns to sync: Roadmaps, Specs, Walkthroughs, Plans
    patterns = ['*.md', '*.png', '*.webp']
    
    sync_count = 0
    for pattern in patterns:
        files = glob.glob(os.path.join(SOURCE_DIR, pattern))
        for src_file in files:
            file_name = os.path.basename(src_file)
            
            # Skip internal task/implementation markers if needed, 
            # but usually they are all useful for Obsidian.
            dest_file = os.path.join(TARGET_DIR, file_name)
            
            try:
                shutil.copy2(src_file, dest_file)
                # print(f"Copied: {file_name}")
                sync_count += 1
            except Exception as e:
                print(f"Error copying {file_name}: {e}")

    print(f"Successfully synced {sync_count} documents to Obsidian Vault.")

if __name__ == "__main__":
    sync()
