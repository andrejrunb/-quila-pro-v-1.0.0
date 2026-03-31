/**
 * PrinterService.ts
 * Sistema Áquila Pro - V3 Enterprise
 * 
 * Serviço para gestão de impressões térmicas (etiquetas e crachás de visitantes).
 * Utiliza o padrão de iFrame oculto para disparar impressões diretas do navegador sem diálogos.
 */

export interface PrintData {
  visitorName: string;
  cpf: string;
  reason: string;
  checkInTime: string;
  hostName?: string;
}

export class PrinterService {
  private static instance: PrinterService;

  private constructor() {}

  public static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  /**
   * Dispara a impressão de um crachá de visitante
   */
  public printVisitorBadge(data: PrintData): void {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page {
              size: 80mm 120mm;
              margin: 0;
            }
            body {
              font-family: 'Inter', sans-serif;
              width: 80mm;
              height: 120mm;
              padding: 10mm;
              box-sizing: border-box;
              text-align: center;
              background: white;
              color: black;
            }
            .header {
              font-weight: bold;
              font-size: 18pt;
              margin-bottom: 5mm;
              border-bottom: 1px solid black;
              padding-bottom: 2mm;
            }
            .type {
              font-size: 14pt;
              background: black;
              color: white;
              padding: 2mm;
              display: block;
              margin-bottom: 8mm;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .name {
              font-size: 22pt;
              font-weight: 800;
              margin-bottom: 2mm;
              word-wrap: break-word;
            }
            .cpf {
              font-size: 12pt;
              color: #444;
              margin-bottom: 10mm;
            }
            .info {
              text-align: left;
              font-size: 10pt;
              margin-top: 5mm;
              border-top: 1px dashed #ccc;
              padding-top: 5mm;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
            .footer {
              margin-top: 15mm;
              font-size: 8pt;
              color: #999;
            }
            .qr-placeholder {
              width: 40mm;
              height: 40mm;
              margin: 5mm auto;
              border: 1px solid #ddd;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8pt;
            }
          </style>
        </head>
        <body>
          <div class="header">ÁQUILA PRO</div>
          <div class="type">Visitante</div>
          <div class="name">${data.visitorName.toUpperCase()}</div>
          <div class="cpf">CPF: ${data.cpf}</div>
          
          <div class="qr-placeholder">
            [QR CODE DE ACESSO]
          </div>

          <div class="info">
            <div><span class="label">Motivo:</span> ${data.reason}</div>
            <div><span class="label">Entrada:</span> ${data.checkInTime}</div>
            ${data.hostName ? `<div><span class="label">Aos cuidados de:</span> ${data.hostName}</div>` : ''}
          </div>

          <div class="footer">
            Válido apenas para o dia de hoje.<br>
            Sistema Áquila de Gestão Escolar
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => {
                window.parent.document.body.removeChild(window.frameElement);
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();
  }
}

export const printerService = PrinterService.getInstance();
