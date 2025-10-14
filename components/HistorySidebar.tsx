import React from 'react';
import { Session } from '../types';
import { PenSquareIcon, TrashIcon, XIcon } from './Icons';

interface HistorySidebarProps {
    isOpen: boolean;
    sessions: Session[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onDeleteSession: (id: string) => void;
    onClose: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
    isOpen,
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    onClose,
}) => {
    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 z-30 transition-opacity md:hidden ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            ></div>
            <aside
                className={`fixed top-0 left-0 h-full bg-surface w-72 flex flex-col z-40 transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-72'}`}
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold">History</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onNewChat}
                            className="group relative p-2 rounded-md hover:bg-white/10"
                            aria-label="New Chat"
                        >
                            <PenSquareIcon className="w-5 h-5" />
                            <span className="absolute top-1/2 -translate-y-1/2 left-full ml-3 px-2 py-1 text-xs font-normal bg-background border border-white/10 text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                New Chat
                            </span>
                        </button>
                        <button onClick={onClose} className="p-2 rounded-md hover:bg-white/10 md:hidden">
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessions.map((session) => (
                        <div key={session.id} className="group flex items-center">
                            <button
                                onClick={() => onSelectSession(session.id)}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md truncate transition-colors ${
                                    activeSessionId === session.id
                                        ? 'bg-primary-800/70 text-white'
                                        : 'hover:bg-white/5 text-gray-300'
                                }`}
                            >
                                {session.title}
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(session.id);
                                }}
                                className="ml-2 p-1.5 text-gray-500 hover:text-red-500 hover:bg-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Delete chat"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
};

export default HistorySidebar;