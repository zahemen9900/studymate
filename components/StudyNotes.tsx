import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { StudyNotesData } from '../types';
import { ExpandIcon, XIcon, DownloadIcon, FileTextIcon, FileWordIcon } from './Icons';

// Declare global variables from CDN scripts for TypeScript
declare var jspdf: any;
declare var html2canvas: any;
// The htmlToDocx global is now accessed via window, so a global declare is not strictly necessary but can be kept for clarity
declare var htmlToDocx: any;

interface StudyNotesProps {
    notes: StudyNotesData;
}

const StudyNotes: React.FC<StudyNotesProps> = ({ notes }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async () => {
        if (!contentRef.current) return;
        setIsDownloading(true);
        try {
            const { jsPDF } = jspdf;
            const canvas = await html2canvas(contentRef.current, {
                scale: 2,
                backgroundColor: '#1A1A1A', 
                useCORS: true,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${notes.title.replace(/ /g, '_')}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadWord = async () => {
        if (!contentRef.current) return;
        setIsDownloading(true);

        const htmlToDocxLib = (window as any).htmlToDocx;

        if (typeof htmlToDocxLib === 'undefined') {
            console.error("html-to-docx library not loaded.");
            alert("Sorry, the document generation library failed to load. Please try refreshing the page.");
            setIsDownloading(false);
            return;
        }

        try {
            const contentHtml = contentRef.current.innerHTML;
            const fileBuffer = await htmlToDocxLib.asBlob(contentHtml);
            const url = URL.createObjectURL(fileBuffer);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${notes.title.replace(/ /g, '_')}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error generating DOCX:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="w-full my-2 p-4 rounded-lg bg-background/50 border border-white/10">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-primary-200">{notes.title}</h3>
                <button
                    onClick={() => setIsExpanded(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-surface hover:bg-white/10 rounded-md transition-colors"
                >
                    <ExpandIcon className="w-4 h-4" />
                    Expand
                </button>
            </div>
            <div className="mt-2 text-sm text-gray-300 max-h-32 overflow-hidden relative">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {notes.content}
                    </ReactMarkdown>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background/50 to-transparent"></div>
            </div>

            {isExpanded && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="relative w-full max-w-4xl h-[90vh] bg-surface rounded-xl shadow-2xl flex flex-col">
                        <header className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">{notes.title}</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-background hover:bg-white/10 rounded-md transition-colors disabled:opacity-50">
                                    <FileTextIcon className="w-4 h-4" /> PDF
                                </button>
                                <button onClick={handleDownloadWord} disabled={isDownloading} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-background hover:bg-white/10 rounded-md transition-colors disabled:opacity-50">
                                    <FileWordIcon className="w-4 h-4" /> Word
                                </button>
                                <button onClick={() => setIsExpanded(false)} className="p-2 rounded-md hover:bg-white/10">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div ref={contentRef} className="prose dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {`# ${notes.title}\n\n${notes.content}`}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyNotes;