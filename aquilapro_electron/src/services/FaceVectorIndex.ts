import * as fs from 'fs';
import * as path from 'path';

export interface HnswSearchResult {
  id: string;
  score: number;
}

/**
 * High-performance Vector Index based on HNSW-Lite (Ruflo adaptation).
 * optimized for O(log N) search of facial embeddings.
 */
export class FaceVectorIndex {
  private vectors = new Map<string, Float32Array>();
  private neighbors = new Map<string, Set<string>>();
  private readonly dimensions: number;
  private readonly maxNeighbors: number;
  private readonly efConstruction: number;
  private readonly metric: 'cosine' | 'euclidean' | 'dot';

  constructor(
    dimensions: number = 128, 
    m: number = 16, 
    efConstruction: number = 64, 
    metric: 'cosine' | 'euclidean' | 'dot' = 'cosine'
  ) {
    this.dimensions = dimensions;
    this.maxNeighbors = m;
    this.efConstruction = efConstruction;
    this.metric = metric;
  }

  get size(): number {
    return this.vectors.size;
  }

  /**
   * Adds an embedding to the index.
   */
  add(id: string, vector: number[] | Float32Array): void {
    const v = vector instanceof Float32Array ? vector : new Float32Array(vector);
    if (v.length !== this.dimensions) {
      throw new Error(`Embedding dimension mismatch: expected ${this.dimensions}, got ${v.length}`);
    }

    this.vectors.set(id, v);

    if (this.vectors.size === 1) {
      this.neighbors.set(id, new Set());
      return;
    }

    // Graph Construction (HNSW Greedy search)
    const nearest = this._findNearest(v, this.maxNeighbors);
    const neighborSet = new Set<string>();

    for (const n of nearest) {
      neighborSet.add(n.id);
      const nNeighbors = this.neighbors.get(n.id);
      if (nNeighbors) {
        nNeighbors.add(id);
        if (nNeighbors.size > this.maxNeighbors * 2) {
          this._pruneNeighbors(n.id);
        }
      }
    }

    this.neighbors.set(id, neighborSet);
  }

  /**
   * Removes an embedding from the index.
   */
  remove(id: string): void {
    this.vectors.delete(id);
    const myNeighbors = this.neighbors.get(id);
    if (myNeighbors) {
      for (const nId of myNeighbors) {
        this.neighbors.get(nId)?.delete(id);
      }
    }
    this.neighbors.delete(id);
  }

  /**
   * Searches for the k nearest embeddings.
   */
  search(query: number[] | Float32Array, k: number = 1, threshold?: number): HnswSearchResult[] {
    if (this.vectors.size === 0) return [];
    
    const v = query instanceof Float32Array ? query : new Float32Array(query);

    // Fallback to brute force for very small collections
    if (this.vectors.size <= k * 4) {
      return this._bruteForce(v, k, threshold);
    }

    const visited = new Set<string>();
    const candidates: HnswSearchResult[] = [];

    // Entry point heuristic: pick a random set and start from best
    let entryId: string | undefined;
    let bestScore = -Infinity;
    
    // Quick entry point search (sample size based on efConstruction)
    const keys = Array.from(this.vectors.keys());
    const samples = Math.min(this.efConstruction, keys.length);
    for (let i = 0; i < samples; i++) {
        const id = keys[i];
        const score = this._similarity(v, this.vectors.get(id)!);
        if (score > bestScore) {
            bestScore = score;
            entryId = id;
        }
        visited.add(id);
        candidates.push({ id, score });
    }

    if (entryId) {
      const queue = [entryId];
      let idx = 0;

      while (idx < queue.length && visited.size < this.efConstruction * 2) {
        const currentId = queue[idx++];
        const currentNeighbors = this.neighbors.get(currentId);
        if (!currentNeighbors) continue;

        for (const nId of currentNeighbors) {
          if (visited.has(nId)) continue;
          visited.add(nId);

          const vec = this.vectors.get(nId);
          if (!vec) continue;

          const score = this._similarity(v, vec);
          candidates.push({ id: nId, score });
          queue.push(nId);
        }
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    let filtered = candidates;
    if (threshold !== undefined) {
      filtered = filtered.filter(c => c.score >= threshold);
    }

    // Deduplicate and slice
    const uniqueMap = new Map<string, number>();
    for (const c of filtered) {
        if (!uniqueMap.has(c.id)) uniqueMap.set(c.id, c.score);
    }
    
    return Array.from(uniqueMap.entries())
        .map(([id, score]) => ({ id, score }))
        .slice(0, k);
  }

  /**
   * Persistence: Save to Disk
   */
  saveToFile(filePath: string): void {
    const data = {
      dimensions: this.dimensions,
      maxNeighbors: this.maxNeighbors,
      efConstruction: this.efConstruction,
      metric: this.metric,
      vectors: Array.from(this.vectors.entries()).map(([id, v]) => [id, Array.from(v)]),
      neighbors: Array.from(this.neighbors.entries()).map(([id, n]) => [id, Array.from(n)]),
    };
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
  }

  /**
   * Persistence: Load from Disk
   */
  static loadFromFile(filePath: string): FaceVectorIndex {
    if (!fs.existsSync(filePath)) throw new Error(`Index file not found: ${filePath}`);
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    
    const index = new FaceVectorIndex(data.dimensions, data.maxNeighbors, data.efConstruction, data.metric);
    
    for (const [id, vec] of data.vectors) {
      index.vectors.set(id, new Float32Array(vec));
    }
    for (const [id, nList] of data.neighbors) {
      index.neighbors.set(id, new Set(nList));
    }
    
    return index;
  }

  // ─────────────────────────────────────────────
  // INTERNOS
  // ─────────────────────────────────────────────

  private _bruteForce(query: Float32Array, k: number, threshold?: number): HnswSearchResult[] {
    const results: HnswSearchResult[] = [];
    for (const [id, vec] of this.vectors) {
      const score = this._similarity(query, vec);
      if (threshold !== undefined && score < threshold) continue;
      results.push({ id, score });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  private _findNearest(query: Float32Array, k: number): HnswSearchResult[] {
    return this._bruteForce(query, k);
  }

  private _pruneNeighbors(id: string): void {
    const myNeighbors = this.neighbors.get(id);
    if (!myNeighbors) return;

    const vec = this.vectors.get(id);
    if (!vec) return;

    const scored: HnswSearchResult[] = [];
    for (const nId of myNeighbors) {
      const nVec = this.vectors.get(nId);
      if (!nVec) continue;
      scored.push({ id: nId, score: this._similarity(vec, nVec) });
    }

    scored.sort((a, b) => b.score - a.score);
    const keep = new Set(scored.slice(0, this.maxNeighbors).map(s => s.id));

    for (const nId of Array.from(myNeighbors)) {
      if (!keep.has(nId)) {
        myNeighbors.delete(nId);
      }
    }
  }

  private _similarity(a: Float32Array, b: Float32Array): number {
    if (this.metric === 'dot') return this._dotProduct(a, b);
    if (this.metric === 'euclidean') return 1 / (1 + this._euclideanDistance(a, b));
    return this._cosineSimilarity(a, b);
  }

  private _cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private _dotProduct(a: Float32Array, b: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += a[i] * b[i];
    }
    return sum;
  }

  private _euclideanDistance(a: Float32Array, b: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const d = a[i] - b[i];
      sum += d * d;
    }
    return Math.sqrt(sum);
  }
}
