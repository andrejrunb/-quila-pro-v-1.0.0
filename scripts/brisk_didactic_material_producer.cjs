/**
 * BRISK TEACHING DIDACTIC MATERIAL PRODUCER (app.briskteaching.com)
 * Uso exclusivo: Produção de Material Didático (Listas de Exercícios, Resumos, Quizzes BNCC/ENEM
 * e integração com Google Forms, Kahoot!, Quizizz e Google Docs).
 * Nota: NUNCA envia auditorias de código/UI para o Brisk Teaching.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const WebSocket = require('ws');

const DEFAULT_CHROME_PORT_FILE = path.join(
  os.homedir(),
  'AppData',
  'Local',
  'Google',
  'Chrome',
  'User Data',
  'DevToolsActivePort'
);

const DIDACTIC_OUT_DIR = path.join('c:', 'aquila', 'docs', 'materiais_didaticos_brisk');
fs.mkdirSync(DIDACTIC_OUT_DIR, { recursive: true });

function buildBriskDidacticPrompt(subject, grade, topic, bnccCode) {
  return `Produza um Kit de Material Didático Completo para sala de aula sobre "${topic}" (${subject} — ${grade}, Habilidade BNCC ${bnccCode}) estruturado em 3 blocos prontos para exportação:

1. RESUMO DIDÁTICO ESTRUTURADO (GUIA DE ESTUDO PARA OS ALUNOS):
- Conceitos-chave explicados com clareza e exemplos do cotidiano;
- Quadro-resumo de fórmulas/regras essenciais e armadilhas comuns em provas;
- 3 perguntas rápidas de verificação (Cornell Notes).

2. LISTA DE EXERCÍCIOS GRADUADA (WORKSHEET IMPRIMÍVEL / GOOGLE DOCS):
- 5 questões graduadas (2 de fixação DOK 1-2, 2 contextualizadas padrão ENEM/SAEB DOK 3 e 1 desafio interdisciplinar DOK 4) com gabarito passo a passo.

3. QUIZ GAMIFICADO PRONTO PARA GOOGLE FORMS & KAHOOT! (5 PERGUNTAS):
- 5 perguntas de múltipla escolha (4 alternativas A-D, tempo limite de 60s, indicação da alternativa correta e feedback curto para importação imediata no Google Forms e Kahoot!).`;
}

module.exports = {
  buildBriskDidacticPrompt,
  DIDACTIC_OUT_DIR
};

if (require.main === module) {
  const samplePrompt = buildBriskDidacticPrompt(
    'Física & Ciências da Natureza',
    '2ª Série do Ensino Médio',
    'Termodinâmica, Calorimetria e Máquinas Térmicas',
    'EM13CNT101'
  );
  const sampleFile = path.join(DIDACTIC_OUT_DIR, 'PROMPT_KIT_DIDATICO_BRISK_FORMS_KAHOOT.md');
  fs.writeFileSync(sampleFile, samplePrompt, 'utf8');
  console.log('[BRISK-DIDACTIC] Kit de prompt didático salvo em:', sampleFile);
}
