/**
 * Áquila Pro v3441 - RAG Types
 */

export interface RAGSection {
  title: string;
  level: number;
  content: string;
  startIndex: number;
  endIndex: number;
}

export interface RAGDocument {
  file: string;
  title: string;
  sections: RAGSection[];
  rawContent: string;
}

export interface RAGSearchResult {
  file: string;
  snippet: string;
  score: number;
  breadcrumb: string[]; // e.g., ["Introduction", "Architecture", "Edge Vision"]
  sectionLevel: number;
}
