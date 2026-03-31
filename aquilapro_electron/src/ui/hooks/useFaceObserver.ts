/**
 * useFaceObserver.ts — AG-002
 * Hook React que subscreve ao evento 'face-detected' via preload bridge.
 * Atualiza estado instantaneamente sem polling.
 * Limpa o listener automaticamente ao desmontar.
 */

import { useEffect, useState, useCallback } from 'react';

export interface FaceDetection {
  student_id: string;
  confidence: number;
  ts: string;
  simulated?: boolean;
}

interface FaceObserverState {
  lastDetection: FaceDetection | null;
  detectionCount: number;
  isListening: boolean;
}

/**
 * Hook para observar detecções de face em tempo real.
 * @param onDetected Callback opcional chamado a cada detecção positiva.
 */
export function useFaceObserver(onDetected?: (data: FaceDetection) => void): FaceObserverState {
  const [lastDetection, setLastDetection] = useState<FaceDetection | null>(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const handleDetection = useCallback((data: FaceDetection) => {
    setLastDetection(data);
    setDetectionCount((c) => c + 1);
    onDetected?.(data);
  }, [onDetected]);

  useEffect(() => {
    const aquila = (window as any).aquila;
    if (!aquila?.onFaceDetected) {
      console.warn('[useFaceObserver] API aquila.onFaceDetected não disponível.');
      return;
    }

    setIsListening(true);
    // Registra listener e guarda a função de cleanup retornada pelo preload
    const cleanup = aquila.onFaceDetected(handleDetection);

    return () => {
      setIsListening(false);
      if (typeof cleanup === 'function') cleanup();
    };
  }, [handleDetection]);

  return { lastDetection, detectionCount, isListening };
}
