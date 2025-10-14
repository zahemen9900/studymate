import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { KnowledgeGraphData } from '../types';
import { ExpandIcon, XIcon } from './Icons';

// Declare Cytoscape from CDN for TypeScript
declare var cytoscape: any;
declare var cytoscapeCola: any;

interface CustomKnowledgeGraphProps {
    graphData: KnowledgeGraphData;
    isInteractive: boolean;
}

const CustomKnowledgeGraph: React.FC<CustomKnowledgeGraphProps> = ({ graphData, isInteractive }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current || !graphData || !cytoscape || !cytoscapeCola) return;

        // Register the cola layout extension if it hasn't been registered yet.
        // This is a robust way to ensure the layout is available.
        if (typeof cytoscape('core', 'cola') === 'undefined') {
            cytoscape.use(cytoscapeCola);
        }

        // Combine nodes and edges for Cytoscape
        const elements = [
            ...graphData.nodes.map(n => ({ group: 'nodes', ...n })),
            ...graphData.edges.map(e => ({ group: 'edges', ...e }))
        ];

        // Theme-matching stylesheet for the graph
        const style: any[] = [
            {
                selector: 'node',
                style: {
                    'background-color': '#0c4a6e',
                    'border-color': '#38bdf8',
                    'border-width': 2,
                    'label': 'data(label)',
                    'color': '#e0f2fe',
                    'font-size': '14px',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'padding': '12px',
                    'shape': 'round-rectangle',
                    'text-wrap': 'wrap',
                    'text-max-width': '100px',
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 1.5,
                    'line-color': '#38bdf8',
                    'target-arrow-color': '#38bdf8',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'color': '#bae6fd',
                    'font-size': '10px',
                    'text-rotation': 'autorotate',
                    'edge-text-rotation': 'autorotate'
                }
            },
            {
                selector: '.highlighted',
                style: {
                     'background-color': '#0ea5e9',
                    'border-color': '#7dd3fc',
                    'line-color': '#7dd3fc',
                    'target-arrow-color': '#7dd3fc',
                    'transition-property': 'background-color, border-color, line-color, target-arrow-color',
                    'transition-duration': '0.2s'
                }
            }
        ];

        // Layout configuration
        const layout = {
            name: 'cola',
            animate: isInteractive,
            nodeSpacing: 60,
            edgeLength: 150,
            fit: true,
            padding: 30,
        };
        
        // Initialize Cytoscape
        cyRef.current = cytoscape({
            container: containerRef.current,
            elements,
            style,
            layout,
            userZoomingEnabled: isInteractive,
            userPanningEnabled: isInteractive,
            boxSelectionEnabled: isInteractive,
            minZoom: 0.2,
            maxZoom: 3
        });
        
        // Add hover effect
        if (isInteractive) {
            cyRef.current.on('mouseover', 'node', (event: any) => {
                const node = event.target;
                node.neighborhood().addClass('highlighted');
                node.addClass('highlighted');
            });
            cyRef.current.on('mouseout', 'node', (event: any) => {
                 const node = event.target;
                 node.neighborhood().removeClass('highlighted');
                 node.removeClass('highlighted');
            });
        }


        // Cleanup on unmount
        return () => {
            if (cyRef.current) {
                cyRef.current.destroy();
            }
        };
    }, [graphData, isInteractive]);

    return <div ref={containerRef} className="w-full h-full" />;
};


const KnowledgeGraph: React.FC<{ graphData: KnowledgeGraphData }> = ({ graphData }) => {
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
                <div className="flex-1 bg-black/20 overflow-hidden rounded-b-xl">
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