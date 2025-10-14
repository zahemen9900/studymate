import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { zoom } from 'd3-zoom';
import { select } from 'd3-selection';
import { KnowledgeGraphData, Node, Edge } from '../types';
import { ExpandIcon, XIcon } from './Icons';

interface CustomKnowledgeGraphProps {
    graphData: KnowledgeGraphData;
    isInteractive: boolean;
}

const CustomKnowledgeGraph: React.FC<CustomKnowledgeGraphProps> = ({ graphData, isInteractive }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    const [viewBox, setViewBox] = useState('0 0 500 500');

    useEffect(() => {
        if (!graphData.nodes || graphData.nodes.length === 0) return;

        // Calculate bounding box to center the graph
        const xCoords = graphData.nodes.map(n => n.position.x);
        const yCoords = graphData.nodes.map(n => n.position.y);
        const minX = Math.min(...xCoords) - 50;
        const minY = Math.min(...yCoords) - 50;
        const maxX = Math.max(...xCoords) + 50;
        const maxY = Math.max(...yCoords) + 50;
        const width = Math.max(maxX - minX, 1);
        const height = Math.max(maxY - minY, 1);
        setViewBox(`${minX} ${minY} ${width} ${height}`);
    }, [graphData]);

    useEffect(() => {
        if (!isInteractive || !svgRef.current || !gRef.current) return;

        const svg = select(svgRef.current);
        const g = select(gRef.current);

        const zoomBehavior = zoom()
            .scaleExtent([0.1, 8])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        
        (svg as any).call(zoomBehavior);

        return () => {
            (svg as any).on('.zoom', null);
        };
    }, [isInteractive]);

    return (
        <svg ref={svgRef} viewBox={viewBox} className="w-full h-full">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>
            </defs>
            <g ref={gRef}>
                {graphData.edges.map((edge: Edge) => {
                    const sourceNode = graphData.nodes.find(n => n.id === edge.source);
                    const targetNode = graphData.nodes.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    return (
                        <g key={edge.id}>
                            <line
                                x1={sourceNode.position.x}
                                y1={sourceNode.position.y}
                                x2={targetNode.position.x}
                                y2={targetNode.position.y}
                                stroke="#38bdf8"
                                strokeWidth="1.5"
                                markerEnd="url(#arrow)"
                            />
                            {edge.label && (
                                <text
                                    x={(sourceNode.position.x + targetNode.position.x) / 2}
                                    y={(sourceNode.position.y + targetNode.position.y) / 2}
                                    fill="#bae6fd"
                                    fontSize="10"
                                    textAnchor="middle"
                                    dy="-4"
                                >
                                    {edge.label}
                                </text>
                            )}
                        </g>
                    );
                })}
                {graphData.nodes.map((node: Node) => (
                     <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`}>
                        <rect x="-45" y="-15" width="90" height="30" rx="8" ry="8" fill="#0c4a6e" stroke="#38bdf8" />
                        <text
                            fill="#e0f2fe"
                            fontSize="12"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{ pointerEvents: 'none' }}
                        >
                            {node.data.label}
                        </text>
                    </g>
                ))}
            </g>
        </svg>
    );
};

// FIX: Define KnowledgeGraphProps to resolve type error.
interface KnowledgeGraphProps {
    graphData: KnowledgeGraphData;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ graphData }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const modalRoot = document.getElementById('modal-root');

    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [isExpanded]);
    
    const modalContent = isExpanded && modalRoot ? createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="relative w-full max-w-6xl h-[90vh] bg-background rounded-xl shadow-2xl flex flex-col border border-white/10">
                <header className="flex items-center justify-between p-3 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white">Knowledge Graph</h2>
                    <button onClick={() => setIsExpanded(false)} className="p-2 rounded-md hover:bg-white/10">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                <div className="flex-1 bg-black/20">
                    <CustomKnowledgeGraph graphData={graphData} isInteractive={true} />
                </div>
            </div>
        </div>,
        modalRoot
    ) : null;

    return (
        <div className="w-full my-2 p-4 rounded-lg bg-background/50 border border-white/10">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-bold text-primary-200">Knowledge Graph</h3>
                <button
                    onClick={() => setIsExpanded(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-surface hover:bg-white/10 rounded-md transition-colors"
                >
                    <ExpandIcon className="w-4 h-4" />
                    Expand
                </button>
            </div>
            <div 
                className="relative w-full h-64 rounded-md overflow-hidden bg-background/50 cursor-pointer" 
                onClick={() => setIsExpanded(true)}
            >
                 <CustomKnowledgeGraph graphData={graphData} isInteractive={false} />
            </div>
            {modalContent}
        </div>
    );
};

export default KnowledgeGraph;