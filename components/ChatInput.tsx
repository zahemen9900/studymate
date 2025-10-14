import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './Icons';

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    isLoading: boolean;
    hasStarted: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, hasStarted }) => {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };
    
    // Auto-resize textarea height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            // Max height equivalent to roughly 5 lines + padding
            const maxHeight = 120; 
            textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        }
    }, [text]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() && !isLoading) {
            onSendMessage(text);
            setText('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    return (
        <form 
            onSubmit={handleSubmit}
            className={`relative flex items-end space-x-3 p-2 rounded-2xl bg-surface/70 backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/20
                transition-all duration-300 ${hasStarted ? 'animate-slide-up' : 'animate-fade-in [animation-delay:0.1s]'}`}
        >
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Message StudyMate..."
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-transparent resize-none border-none focus:outline-none focus:ring-0 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 overflow-y-auto"
                autoComplete="off"
                rows={1}
            />
            <button
                type="submit"
                disabled={isLoading || !text.trim()}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-600 text-white transition-colors duration-200 hover:bg-primary-700 disabled:bg-primary-800/50 disabled:cursor-not-allowed"
                aria-label="Send message"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <SendIcon className="w-5 h-5" />
                )}
            </button>
        </form>
    );
};

export default ChatInput;