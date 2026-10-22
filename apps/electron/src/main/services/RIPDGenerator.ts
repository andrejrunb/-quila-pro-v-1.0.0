import { HardwareFingerprint } from './HardwareFingerprint';

/**
 * RIPDGenerator.ts — Passo 70 do Roadmap.
 * Gera o Relatório de Impacto à Proteção de Dados (RIPD) exigido pela LGPD.
 * Consolida as medidas de segurança implementadas no Áquila Pro.
 */
export class RIPDGenerator {
    
    public static generateMarkdown(schoolName: string): string {
        const date = new Date().toLocaleDateString('pt-BR');
        const machineId = HardwareFingerprint.getFingerprint().substring(0, 12);

        return `
# Relatório de Impacto à Proteção de Dados (RIPD)
**Instituição:** ${schoolName}
**Data de Emissão:** ${date}
**ID do Servidor Local:** ${machineId}

---

## 1. Descrição do Tratamento de Dados
O sistema Áquila Pro realiza o processamento de biometria facial para fins de segurança escolar e controle de assiduidade. 

### Natureza dos Dados:
- Imagens de faces de alunos e colaboradores.
- Metadados de localização (Zonas/Salas).
- Registros de horários de entrada e saída.

## 2. Medidas de Segurança Implementadas (Fase 4 Enterprise)

### 🔒 Criptografia em Repouso (AES-256)
Todos os dados biométricos e registros de presença são armazenados em um banco de dados SQLite local, criptografado com chave de 256 bits vinculada ao hardware do servidor.

### 🛡️ Processamento 100% Local (Edge Computing)
Nenhum dado biométrico (template facial ou imagem bruta) é enviado para a nuvem. Todo o reconhecimento ocorre no hardware físico instalado na escola.

### ⚡ Proteção Anti-Vazamento (Marca D'água)
Cada visualização de prova por parte da coordenação contém uma marca d'água dinâmica com o CPF do operador e o IP da máquina, dissuadindo capturas de tela não autorizadas.

### ⏰ Política de Purge (Retenção)
O sistema está configurado para deleção automática de frames de evidência após 30 dias, mantendo apenas os logs textuais para fins históricos.

## 3. Avaliação de Necessidade e Proporcionalidade
O tratamento de dados é essencial para a segurança dos menores e para a automação da comunicação com os pais, reduzindo falhas humanas no registro de presença.

## 4. Conclusão
O Áquila Pro opera sob o modelo de **Privacidade Blindada**, minimizando riscos de vazamentos em massa e garantindo o controle total da escola sobre sua base de biometria.

---
*Este relatório foi gerado automaticamente pelo Módulo de Conformidade Áquila Pro.*
        `;
    }
}

