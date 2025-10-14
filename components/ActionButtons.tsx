import React from 'react';
import { SparklesIcon, PuzzlePieceIcon, BeakerIcon, BookOpenIcon, ClipboardDocumentListIcon, NetworkIcon } from './Icons';

interface ActionButtonsProps {
    onAction: (action: 'simplify' | 'analogy' | 'quiz' | 'flashcards' | 'notes' | 'knowledgeGraph') => void;
}

const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode; }> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="flex items-center space-x-2 bg-surface/50 hover:bg-surface text-primary-300 text-sm font-medium px-4 py-2 rounded-full transition-colors duration-200"
    >
        {children}
    </button>
);

const ActionButtons: React.FC<ActionButtonsProps> = ({ onAction }) => {
    return (
        <div className="flex flex-wrap gap-2 mt-3">
            <ActionButton onClick={() => onAction('simplify')}>
                <SparklesIcon className="w-4 h-4" />
                <span>Explain Like I'm 5</span>
            </ActionButton>
            <ActionButton onClick={() => onAction('analogy')}>
                <BeakerIcon className="w-4 h-4" />
                <span>Give me an Analogy</span>
            </ActionButton>
             <ActionButton onClick={() => onAction('notes')}>
                <ClipboardDocumentListIcon className="w-4 h-4" />
                <span>Create Study Notes</span>
            </ActionButton>
             <ActionButton onClick={() => onAction('knowledgeGraph')}>
                <NetworkIcon className="w-4 h-4" />
                <span>Knowledge Graph</span>
            </ActionButton>
            <ActionButton onClick={() => onAction('flashcards')}>
                <BookOpenIcon className="w-4 h-4" />
                <span>Make Flashcards</span>
            </ActionButton>
            <ActionButton onClick={() => onAction('quiz')}>
                <PuzzlePieceIcon className="w-4 h-4" />
                <span>Quiz Me</span>
            </ActionButton>
        </div>
    );
};

export default ActionButtons;