import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { StudyNotesData } from '../types';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import AudioMiniPlayer from './AudioMiniPlayer';
import { ExpandIcon, XIcon, DownloadIcon, FileTextIcon, FileWordIcon, SpeakerIcon } from './Icons';

// Declare global variables from CDN scripts for TypeScript
declare var jspdf: any;
declare var html2canvas: any;
declare var htmlToDocx: any;

interface StudyNotesProps {
    notes: StudyNotesData;
}

const StudyNotes: React.FC<StudyNotesProps> = ({ notes }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const [audioState, setAudioState] = useState<{
        isLoading: boolean;
        isPlaying: boolean;
        progress: number;
        duration: number;
        audioBuffer: AudioBuffer | null;
    }>({ isLoading: false, isPlaying: false, progress: 0, duration: 0, audioBuffer: null });

    const contentRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const progressIntervalRef = useRef<number | null>(null);
    const modalRoot = document.getElementById('modal-root');

    // Scroll lock
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = originalStyle;
        }
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [isExpanded]);

    // Audio cleanup
    useEffect(() => {
        return () => {
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, []);
    
    // Stop audio when modal is closed
    useEffect(() => {
        if (!isExpanded && audioState.isPlaying) {
             handlePlayPause();
        }
    }, [isExpanded]);


    const handleDownload = async (type: 'pdf' | 'word') => {
        if (!contentRef.current) return;
        setIsDownloading(true);
        setIsDownloadMenuOpen(false);

        try {
            if (type === 'pdf') {
                const { jsPDF } = jspdf;
                const canvas = await html2canvas(contentRef.current, { scale: 2, backgroundColor: '#1A1A1A', useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(`${notes.title.replace(/ /g, '_')}.pdf`);
            } else { // word
                const htmlToDocxLib = (window as any).htmlToDocx;
                 if (typeof htmlToDocxLib === 'undefined') {
                    throw new Error("html-to-docx library not loaded.");
                }
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
            }
        } catch (error) {
            console.error(`Error generating ${type}:`, error);
        } finally {
            setIsDownloading(false);
        }
    };
    
    const startProgressInterval = (startTime: number) => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = window.setInterval(() => {
            if (audioContextRef.current) {
                const elapsedTime = audioContextRef.current.currentTime - startTime;
                setAudioState(prev => ({...prev, progress: elapsedTime}));
            }
        }, 100);
    };

    const handlePlayPause = useCallback(() => {
        if (!audioContextRef.current || !audioState.audioBuffer) return;

        if (audioState.isPlaying) {
            audioSourceRef.current?.stop();
            audioSourceRef.current = null;
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setAudioState(prev => ({...prev, isPlaying: false}));
        } else {
            audioSourceRef.current = audioContextRef.current.createBufferSource();
            audioSourceRef.current.buffer = audioState.audioBuffer;
            audioSourceRef.current.connect(audioContextRef.current.destination);
            
            const startTime = audioContextRef.current.currentTime;
            audioSourceRef.current.start(0, audioState.progress % audioState.duration);
            startProgressInterval(startTime - (audioState.progress % audioState.duration));

            audioSourceRef.current.onended = () => {
                const isFinished = audioState.progress >= audioState.duration - 0.1;
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                 setAudioState(prev => ({...prev, isPlaying: false, progress: isFinished ? 0 : prev.progress }));
            };
            setAudioState(prev => ({...prev, isPlaying: true}));
        }
    }, [audioState.audioBuffer, audioState.duration, audioState.isPlaying, audioState.progress]);

    const handlePlayRequest = async () => {
        if (audioState.audioBuffer) {
            handlePlayPause();
            return;
        }

        setAudioState(prev => ({ ...prev, isLoading: true }));
        try {
            const fullText = `${notes.title}. ${notes.content}`;
            const base64Audio = await generateSpeech(fullText);
            
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            } else if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            setAudioState(prev => ({ ...prev, audioBuffer, duration: audioBuffer.duration, isLoading: false }));
        } catch (error) {
            console.error("Error generating or playing audio:", error);
            setAudioState(prev => ({ ...prev, isLoading: false }));
        }
    };
    
    useEffect(() => {
        if (audioState.duration > 0 && !audioState.isLoading && !audioState.isPlaying) {
            handlePlayPause();
        }
    }, [audioState.duration, audioState.isLoading]);

    const modalContent = isExpanded && modalRoot ? createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="relative w-full max-w-4xl h-[90vh] bg-surface rounded-xl shadow-2xl flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">{notes.title}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePlayRequest} disabled={audioState.isLoading} className="p-2 rounded-md hover:bg-white/10 text-gray-300 hover:text-white transition-colors disabled:opacity-50">
                           {audioState.isLoading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <SpeakerIcon className="w-5 h-5" />}
                        </button>
                        <div className="relative">
                            <button onClick={() => setIsDownloadMenuOpen(prev => !prev)} disabled={isDownloading} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-background hover:bg-white/10 rounded-md transition-colors disabled:opacity-50">
                                <DownloadIcon className="w-4 h-4" />
                                <span>Download</span>
                            </button>
                            {isDownloadMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-32 bg-background border border-white/10 rounded-md shadow-lg z-10 animate-fade-in">
                                    <button onClick={() => handleDownload('pdf')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10">
                                        <FileTextIcon className="w-4 h-4" /> PDF
                                    </button>
                                    <button onClick={() => handleDownload('word')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10">
                                        <FileWordIcon className="w-4 h-4" /> Word
                                    </button>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setIsExpanded(false)} className="p-2 rounded-md hover:bg-white/10">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-6" onClick={() => isDownloadMenuOpen && setIsDownloadMenuOpen(false)}>
                    <div ref={contentRef} className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {`# ${notes.title}\n\n${notes.content}`}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
             {(audioState.isPlaying || audioState.audioBuffer) && (
                <AudioMiniPlayer
                    isPlaying={audioState.isPlaying}
                    duration={audioState.duration}
                    progress={audioState.progress}
                    onPlayPause={handlePlayPause}
                    onClose={() => {
                        handlePlayPause();
                        setAudioState(prev => ({...prev, audioBuffer: null, progress: 0}));
                    }}
                />
            )}
        </div>,
        modalRoot
    ) : null;

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
            {modalContent}
        </div>
    );
};

export default StudyNotes;