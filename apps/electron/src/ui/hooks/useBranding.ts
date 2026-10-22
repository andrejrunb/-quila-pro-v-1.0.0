import { useState, useEffect } from 'react';
import { useIPC } from './useIPC';

export interface BrandingData {
  logo: string;
  name: string;
  isWhiteLabel: boolean;
}

export const useBranding = (planId: string = 'basic') => {
  const { invoke } = useIPC();
  const [branding, setBranding] = useState<BrandingData>({
    logo: 'visao.png',
    name: 'Colégio Visão',
    isWhiteLabel: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        // Primeiro busca os planos para checar allowWhiteLabel
        const plans = await invoke('pricing:get-plans');
        const plan = Array.isArray(plans) ? plans.find((p: any) => p.id === planId) : null;
        const allowWhiteLabel = plan?.allowWhiteLabel || false;

        // Busca o branding real do main process
        const data = await invoke('theme:get-branding', { planId, allowWhiteLabel });
        if (data) {
          setBranding(data);
        }
      } catch (error) {
        console.error('Error fetching branding:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, [planId, invoke]);

  return { branding, loading };
};
