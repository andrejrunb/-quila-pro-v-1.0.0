# Implementation Plan: Phase 1100 — Vector Scalability (HNSW)

This phase implements a high-performance vector search index based on the Hierarchical Navigable Small World (HNSW) algorithm, adapted from the `ruflo` repository. This will replace the current linear search in `FaceRecognition.ts`.

## Proposed Changes

### [Core Services]

#### [NEW] [FaceVectorIndex.ts](file:///c:/aquila/aquilapro_electron/src/services/FaceVectorIndex.ts)
- Implement `FaceVectorIndex` class based on `HnswLite`.
- Add `saveToFile` and `loadFromFile` methods for persistence.
- Support `cosineSimilarity` and `euclideanDistance`.
- Thread-safe updates (Map-based).

#### [MODIFY] [FaceRecognition.ts](file:///c:/aquila/aquilapro_electron/src/services/FaceRecognition.ts)
- Replace `Map<string, FaceEmbedding>` with `FaceVectorIndex`.
- Update `findClosestMatch` to use `index.search()`.
- Synchronize index loading with database embedding retrieval.

### [Data Management]

#### [MODIFY] [Database.ts](file:///c:/aquila/aquilapro_electron/src/database/Database.ts)
- No direct schema changes required, but ensure `getFaceEmbeddings` provides data in a format compatible with the new index bootstrapper.

## Verification Plan

### Automated Tests
- `npm test src/services/__tests__/FaceVectorIndex.test.ts`: Verify O(log N) search correctness.
- `npm test src/services/__tests__/FaceRecognition.test.ts`: Ensure integration works and confidence scores remain consistent.

### Manual Verification
- Monitor "Painel do Gestor" status for "Reconhecimento Facial: Otimizado (HNSW)".
- Perform stress test with >1000 simulated student vectors.
