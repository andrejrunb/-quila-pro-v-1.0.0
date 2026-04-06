import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text } from 'react-konva';
import useImage from 'use-image';
import './FloorPlanMapper.css';

export interface Point {
    x: number;
    y: number;
}

export interface Zone {
    id: string;
    points: Point[];
    name: string;
    color: string;
    active: boolean; // Ativado quando há detecção de presença
}

interface FloorPlanMapperProps {
    imageUrl: string;
    zones: Zone[];
    onZonesChange?: (zones: Zone[]) => void;
    mode: 'view' | 'edit';
}

/**
 * FloorPlanMapper 
 * Componente 2D (Soberano e Custo Zero) para marcação de andares e zonas de câmera.
 * Substitui necessidades de mapas 3D complexos mantendo o Áquila leve.
 */
export const FloorPlanMapper: React.FC<FloorPlanMapperProps> = ({
    imageUrl,
    zones,
    onZonesChange,
    mode
}) => {
    const [image] = useImage(imageUrl);
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Responsividade do Canvas
    useEffect(() => {
        const resize = () => {
            if (containerRef.current) {
                setStageSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    const handleStageClick = (e: any) => {
        if (mode !== 'edit') return;
        
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        
        if (pointerPosition) {
            setCurrentPoints([...currentPoints, pointerPosition]);
        }
    };

    const handleCompleteZone = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); // Botão direito
        if (mode === 'edit' && currentPoints.length >= 3 && onZonesChange) {
            const newZone: Zone = {
                id: `zone-${Date.now()}`,
                points: currentPoints,
                name: `Nova Zona ${zones.length + 1}`,
                color: 'rgba(0, 150, 255, 0.4)',
                active: false
            };
            onZonesChange([...zones, newZone]);
            setCurrentPoints([]); // reseta
        }
    };

    return (
        <div 
            className="floor-plan-container" 
            ref={containerRef}
            onContextMenu={handleCompleteZone}
        >
            <Stage 
                width={stageSize.width} 
                height={stageSize.height}
                onClick={handleStageClick}
            >
                <Layer>
                    {/* Imagem de Fundo (Planta) */}
                    {image && (
                        <KonvaImage 
                            image={image}
                            width={stageSize.width}
                            height={stageSize.height}
                            opacity={0.8}
                        />
                    )}

                    {/* Zonas Criadas */}
                    {zones.map((zone) => (
                        <Line
                            key={zone.id}
                            points={zone.points.flatMap(p => [p.x, p.y])}
                            fill={zone.active ? 'rgba(255, 0, 0, 0.6)' : zone.color}
                            stroke={zone.active ? '#ff0000' : '#0096ff'}
                            strokeWidth={2}
                            closed
                            /* Visual Glassmorphism-ish */
                            shadowColor="black"
                            shadowBlur={zone.active ? 15 : 0}
                            shadowOpacity={0.5}
                        />
                    ))}

                    {/* Zona em Edição */}
                    {mode === 'edit' && currentPoints.length > 0 && (
                        <Line
                            points={currentPoints.flatMap(p => [p.x, p.y])}
                            stroke="#ffffff"
                            strokeWidth={2}
                            dash={[5, 5]}
                            closed={false}
                        />
                    )}
                    
                    {/* Pontos da Zona em Edição */}
                    {mode === 'edit' && currentPoints.map((point, i) => (
                        <Circle
                            key={`pt-${i}`}
                            x={point.x}
                            y={point.y}
                            radius={4}
                            fill="#ffffff"
                        />
                    ))}
                    
                    {/* Rótulos Dinâmicos das Zonas */}
                    {zones.map((zone) => {
                        // Calcula centro aproximado para o rótulo
                        if(zone.points.length === 0) return null;
                        const minX = Math.min(...zone.points.map(p => p.x));
                        const maxX = Math.max(...zone.points.map(p => p.x));
                        const minY = Math.min(...zone.points.map(p => p.y));
                        const maxY = Math.max(...zone.points.map(p => p.y));
                        const centerX = minX + (maxX - minX) / 2;
                        const centerY = minY + (maxY - minY) / 2;
                        
                        return (
                           <Text
                             key={`txt-${zone.id}`}
                             x={centerX - 40}
                             y={centerY - 10}
                             text={zone.name}
                             fill="#ffffff"
                             fontSize={14}
                             fontStyle="bold"
                             shadowColor="black"
                             shadowBlur={4}
                           />
                        );
                    })}
                </Layer>
            </Stage>
            
            {mode === 'edit' && currentPoints.length > 0 && (
                <div className="canvas-instruction-tooltip">
                    Clique para adicionar pontos. Botão direito p/ fechar a zona.
                </div>
            )}
        </div>
    );
};
