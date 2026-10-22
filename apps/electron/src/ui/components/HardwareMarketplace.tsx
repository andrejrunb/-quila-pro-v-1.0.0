import React, { useState, useEffect } from 'react';
import { Server, Camera, HardDrive, Cpu, Info, ExternalLink, Calculator } from 'lucide-react';
import './HardwareMarketplace.css';

interface HardwareItem {
  id: string;
  category: 'NPU' | 'CAMERA' | 'STORAGE' | 'NETWORK';
  name: string;
  manufacturer: string;
  description: string;
  technicalAnalysis: string;
  estimatedPrice: string;
  roiMonths: number;
  cloudSavingsYear: string;
  affiliateLink: string;
}

export const HardwareMarketplace: React.FC = () => {
  const [items, setItems] = useState<HardwareItem[]>([]);

  useEffect(() => {
    // Simulação do Motor Analítico do Áquila avaliando as necessidades da Escola
    const loadRecommendations = () => {
      const recommendations: HardwareItem[] = [
        {
          id: 'hw-01',
          category: 'NPU',
          name: 'Placa NPU Edge Vision 26 TOPS',
          manufacturer: 'NeuralTech',
          description: 'Acelerador de IA Local (M.2 Key M)',
          technicalAnalysis: 'O Áquila detectou que a escola gasta R$ 1.200/mês em requisições de Nuvem para as 8 câmeras da secretaria. Ao adicionar esta placa no servidor local, o processamento de reconhecimento facial e AutoGrader ocorre a custo zero de nuvem.',
          estimatedPrice: 'R$ 1.850,00',
          roiMonths: 1.5,
          cloudSavingsYear: 'R$ 14.400,00',
          affiliateLink: 'https://afiliado.lojahardware.com/ref/aquila_npu'
        },
        {
          id: 'hw-02',
          category: 'CAMERA',
          name: 'Câmera IP 4K Starlight Lente Varifocal',
          manufacturer: 'VisionPro',
          description: 'Captura de alta precisão para salas de aula grandes',
          technicalAnalysis: 'A Sala de Coordenação reporta falha de 12% no mapeamento de lousa via BoardScanner devido à baixa luminosidade atual. Esta câmera possui sensor de altíssima sensibilidade que resolverá o gap analítico instantaneamente.',
          estimatedPrice: 'R$ 950,00',
          roiMonths: 0, // ROI Intangível (qualidade)
          cloudSavingsYear: 'N/A',
          affiliateLink: 'https://afiliado.lojahardware.com/ref/aquila_cam4k'
        },
        {
          id: 'hw-03',
          category: 'STORAGE',
          name: 'SSD NVMe Enterprise 4TB',
          manufacturer: 'DataCore',
          description: 'Armazenamento Biométrico Soberano',
          technicalAnalysis: 'Com a nova lei da LGPD e o sistema soberano ativo, projetamos que o armazenamento local atingirá 90% em 3 meses. Este SSD Enterprise suporta os ciclos contínuos de gravação do banco SQLite local do Áquila.',
          estimatedPrice: 'R$ 2.400,00',
          roiMonths: 4.0,
          cloudSavingsYear: 'R$ 7.200,00 (AWS S3 evitado)',
          affiliateLink: 'https://afiliado.lojahardware.com/ref/aquila_nvme'
        }
      ];
      setItems(recommendations);
    };

    loadRecommendations();
  }, []);

  const getIcon = (category: string) => {
    switch (category) {
      case 'NPU': return <Cpu size={24} />;
      case 'CAMERA': return <Camera size={24} />;
      case 'STORAGE': return <HardDrive size={24} />;
      default: return <Server size={24} />;
    }
  };

  const handleLinkClick = (link: string) => {
    // Em produção usaria shell.openExternal(link)
    console.log('Navegando para compra via afiliado:', link);
    alert('Você será redirecionado para o fornecedor oficial aprovado pelo Ecossistema Áquila.');
  };

  return (
    <div className="hardware-market-container">
      <div className="hm-alert-neutral">
        <Info size={24} className="hm-icon" />
        <div className="hm-alert-text">
          <h4>Auditoria de Infraestrutura Áquila</h4>
          <p>
            Esta lista apresenta apenas o dimensionamento técnico sugerido para suprir os gargalos computacionais da escola.
            Nossa missão é fornecer uma solução eficiente: indicamos os requisitos para processamento local (Sovereign OS) 
            e os comparamos matematicamente com os custos de nuvem, ajudando a escola a tomar a melhor decisão para sua infraestrutura.
          </p>
        </div>
      </div>

      <div className="hardware-grid">
        {items.map(item => (
          <div key={item.id} className="hardware-card">
            <div className="hc-header">
              <div className="hc-icon-wrapper">
                {getIcon(item.category)}
              </div>
              <div className="hc-titles">
                <h3>{item.name}</h3>
                <p>{item.manufacturer} • {item.description}</p>
              </div>
            </div>
            
            <div className="hc-body">
              <div className="hc-analysis">
                <span className="hc-analysis-title">Diagnóstico Analítico do Áquila</span>
                <p className="hc-analysis-text">{item.technicalAnalysis}</p>
              </div>

              <div className="hc-metrics">
                <div className="hc-metric-row">
                  <span className="label">Recuperação do Investimento (ROI):</span>
                  <span className="value">{item.roiMonths > 0 ? `${item.roiMonths} meses` : 'Qualitativo'}</span>
                </div>
                {item.cloudSavingsYear !== 'N/A' && (
                  <div className="hc-metric-row">
                    <span className="label">Economia Gerada / Ano:</span>
                    <span className="value positive">+{item.cloudSavingsYear}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="hc-footer">
              <div className="hc-price">{item.estimatedPrice}</div>
              <button 
                className="btn-affiliate"
                onClick={() => handleLinkClick(item.affiliateLink)}
              >
                Ver Especificações Técnicas <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
