/**
 * Áquila Pro - PageIndex Simulation Test (Tree Search RAG)
 * 🔬 Objetivo: Demonstrar a viabilidade da busca baseada em raciocínio estrutural.
 */

const fs = require('fs');
const path = require('path');

// 1. Simulação do Indexador Visão-Nativo
function buildDocumentTree(content) {
  const lines = content.split('\n');
  const tree = { name: 'Root', type: 'document', children: [] };
  let currentHeader = tree;

  lines.forEach(line => {
    if (line.startsWith('# ')) {
      const node = { name: line.replace('# ', ''), type: 'h1', children: [], content: [] };
      tree.children.push(node);
      currentHeader = node;
    } else if (line.startsWith('## ')) {
      const node = { name: line.replace('## ', ''), type: 'h2', children: [], content: [] };
      const h1Parent = tree.children[tree.children.length - 1];
      h1Parent.children.push(node);
      currentHeader = node;
    } else if (line.trim()) {
      currentHeader.content.push(line);
    }
  });
  return tree;
}

// 2. Simulação do Navegador de Raciocínio (Agentic Tree Search)
async function reasoningSearch(tree, query) {
  console.log(`\n🔍 QUERY: "${query}"`);
  console.log(`🧠 AGENT REASONING: Analisando o índice do documento...\n`);

  // Fase 1: Olhando o Sumário
  const sections = tree.children.flatMap(h1 => [h1, ...h1.children]);
  console.log(`[PageIndex] Estrutura detectada:`);
  sections.forEach(s => console.log(`  - [${s.type.toUpperCase()}] ${s.name}`));

  // Fase 2: Raciocionando sobre qual seção navegar
  const targetSection = sections.find(s => 
    s.name.toLowerCase().includes('capacidades') || 
    s.name.toLowerCase().includes('delta')
  );

  if (targetSection) {
    console.log(`\n[PageIndex] DECISÃO: Navegando para seção "${targetSection.name}"...`);
    const answer = targetSection.content.find(c => c.toLowerCase().includes('sincronização') || c.toLowerCase().includes('delta'));
    
    console.log(`\n✅ RESULTADO ENCONTRADO: ${answer}`);
    console.log(`📍 REFERÊNCIA: ${targetSection.name} (Hierarquia: ${tree.children[0].name} > ${targetSection.name})`);
  } else {
    console.log(`❌ Seção relevante não encontrada pela estrutura.`);
  }
}

// EXECUÇÃO
const docPath = path.join('c:', 'aquila', '.aquila_brain', '10_Architecture', 'Unified_Command_SOC.md');
const content = fs.readFileSync(docPath, 'utf8');
const docTree = buildDocumentTree(content);

reasoningSearch(docTree, "Qual a vantagem da Sincronização Delta?");
