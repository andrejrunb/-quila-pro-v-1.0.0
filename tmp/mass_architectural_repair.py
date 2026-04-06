import os
import re

files_to_fix = [
    r"c:\aquila\apps\electron\src\services\VaultService.ts",
    r"c:\aquila\apps\electron\src\services\SubjectAccessRequestService.ts",
    r"c:\aquila\apps\electron\src\services\SwarmOrchestrator.ts",
    r"c:\aquila\apps\electron\src\services\SovereignSwarm.ts",
    r"c:\aquila\apps\electron\src\services\SovereignLedger.ts",
    r"c:\aquila\apps\electron\src\services\SovereignAudit.ts",
    r"c:\aquila\apps\electron\src\services\SovereignInstallerService.ts",
    r"c:\aquila\apps\electron\src\services\SecurityAuditService.ts",
    r"c:\aquila\apps\electron\src\services\RollbackService.ts",
    r"c:\aquila\apps\electron\src\services\QueryOptimizerService.ts",
    r"c:\aquila\apps\electron\src\services\ProcessWatchdogService.ts",
    r"c:\aquila\apps\electron\src\services\NexusMeshService.ts",
    r"c:\aquila\apps\electron\src\services\NexusDreamService.ts",
    r"c:\aquila\apps\electron\src\services\MemoryOptimizerService.ts",
    r"c:\aquila\apps\electron\src\services\LGPDPolicyEngine.ts",
    r"c:\aquila\apps\electron\src\services\InboundTrafficFilter.ts",
    r"c:\aquila\apps\electron\src\services\IntegrityService.ts",
    r"c:\aquila\apps\electron\src\services\HapticBridgeService.ts",
    r"c:\aquila\apps\electron\src\services\GamificationEngine.ts",
    r"c:\aquila\apps\electron\src\services\EdgeOffloadService.ts",
    r"c:\aquila\apps\electron\src\services\DeltaUpdateService.ts",
    r"c:\aquila\apps\electron\src\services\DataRetentionService.ts",
    r"c:\aquila\apps\electron\src\services\AutoUpdateService.ts",
    r"c:\aquila\apps\electron\src\services\AuditLedgerService.ts",
    r"c:\aquila\apps\electron\src\services\AudioEngine.ts",
    r"c:\aquila\apps\electron\src\services\AriaLiveService.ts",
    r"c:\aquila\apps\electron\src\services\AquilaSentinel.ts",
    r"c:\aquila\apps\electron\src\services\AntiTamperService.ts",
    r"c:\aquila\apps\electron\src\services\ArchitectEngine.ts",
    r"c:\aquila\apps\electron\src\services\AnonymizationService.ts",
]

for filepath in files_to_fix:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace logger import
        new_content = re.sub(
            r"import\s+\{\s*logger\s*\}\s+from\s+['\"]\.{2}/main['\"]",
            "import { logger } from '../main/logger'",
            content
        )
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed: {filepath}")
        else:
            print(f"No changes for: {filepath}")
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")

print("\nProcessing StressTestService.ts separately...")
stress_file = r"c:\aquila\apps\electron\src\services\StressTestService.ts"
try:
    with open(stress_file, 'r', encoding='utf-8') as f:
        content = f.read()
    # It imports faceWorker from ../main, which is a big leak. 
    # We should probably pass faceWorker to it instead of it importing from main.
    # But for now, let's see why it needs it.
    print(f"Manual check needed for: {stress_file}")
except:
    pass
