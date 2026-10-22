import { SovereignLibrarianService } from '../main/services/SovereignLibrarianService';
import { PageIndexRAGService } from '../main/services/PageIndexRAGService';
import { GenerativeAIService } from '../main/services/GenerativeAIService';
import { Database } from '../database/Database';
import { AttendanceCalculator } from '../main/services/AttendanceCalculator';
import * as path from 'path';

async function testLibrarian() {
  console.log('--- TESTE SOBERANO: LIBRARIAN EVOLUTION ---');
  
  const db = Database.getInstance();
  await db.initialize();
  const calc = AttendanceCalculator.getInstance();
  const rag = new PageIndexRAGService(path.join(__dirname, '../../resources/docs'));
  const ai = new GenerativeAIService(db, calc, rag);
  rag.setAiService(ai);

  const librarian = SovereignLibrarianService.getInstance(db, ai);

  console.log('1. Construindo Index RAG...');
  await rag.buildIndex();

  const map = rag.getKnowledgeMap();
  console.log(`2. Mapa de Conhecimento: ${map.length} nós encontrados.`);
  if (map.length > 0) {
    console.log('Exemplo de nó:', map[0]);
  }

  console.log('3. Testando Busca Semântica...');
  const searchResults = await rag.searchSemantic('frequência escolar', 2);
  console.log('Resultados:', searchResults.map(r => r.file));

  console.log('4. Testando Geração de Relatório Executivo...');
  if (map.length >= 2) {
    const ids = [map[0].id, map[1].id];
    console.log(`Consolidando: ${ids.join(', ')}`);
    const digest = await librarian.generateExecutiveDigest(ids);
    console.log('--- RELATÓRIO GERADO ---');
    console.log(digest.content.substring(0, 500) + '...');
    console.log('--- FIM DO RELATÓRIO ---');
  } else {
    console.warn('Poucos documentos para consolidar.');
  }

  console.log('--- TESTE CONCLUÍDO ---');
}

testLibrarian().catch(console.error);
