import React, { useEffect, useRef } from 'react';

export interface BoundingBox {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  confidence?: number;
  color?: string; // hex
}

interface BBoxViewerProps {
  videoStreamUrl?: string; // Optional: If we stream via HLS or direct <video> src
  videoRef?: React.RefObject<HTMLVideoElement>; // Optional: attach to existing video element
  width: number;
  height: number;
  boxes: BoundingBox[];
  blurNonFaces?: boolean; // For step 156
}

/**
 * BBoxViewer (Canvas 2D Acelerado) - Renderiza detecções YOLOv8 em tempo real
 * Zero-Debt / High Performance / Sovereign Component
 */
export const BBoxViewer: React.FC<BBoxViewerProps> = ({ width, height, boxes, videoRef, blurNonFaces }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous frame
    ctx.clearRect(0, 0, width, height);

    // Draw boxes
    boxes.forEach(box => {
      const { x1, y1, x2, y2, label, confidence, color = '#10b981' } = box;
      const boxWidth = x2 - x1;
      const boxHeight = y2 - y1;

      // Blur non-faces (simulated effect for step 156 if blurNonFaces is true)
      if (blurNonFaces && label !== 'Known Person') {
        // Draw a simulated pixelate/blur block
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(x1, y1, boxWidth, boxHeight);
      }

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, boxWidth, boxHeight);

      // Draw label
      if (label) {
        const text = `${label} ${confidence ? `(${(confidence * 100).toFixed(0)}%)` : ''}`;
        ctx.font = '12px Inter, sans-serif';
        const textWidth = ctx.measureText(text).width;

        // Label background
        ctx.fillStyle = color;
        ctx.fillRect(x1, y1 - 20, textWidth + 8, 20);

        // Label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x1 + 4, y1 - 6);
      }
    });

  }, [boxes, width, height, blurNonFaces]);

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', borderRadius: '8px' }}>
      {/* Video layer */}
      {videoRef && (
        <video 
           ref={videoRef}
           style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
           autoPlay
           muted
           playsInline
        />
      )}
      
      {/* Overlay layer */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none', // pass clicks to video
          zIndex: 10
        }}
      />
    </div>
  );
};

export default BBoxViewer;
