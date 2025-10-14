import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message, Sender } from '../types';
import ActionButtons from './ActionButtons';
import Quiz from './Quiz';
import Flashcards from './Flashcards';
import StudyNotes from './StudyNotes';
import KnowledgeGraph from './KnowledgeGraph';
import { UserIcon, LightbulbIcon } from './Icons';

interface ChatMessageProps {
    message: Message;
    onAction: (actionType: 'simplify' | 'analogy' | 'quiz' | 'flashcards' | 'notes' | 'knowledgeGraph', contextText: string) => void;
}

const ThinkingAccordion: React.FC<{ content: string }> = ({ content }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mt-3 border-t border-white/10">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full py-2 text-sm text-gray-400 hover:text-white"
            >
                <span>Model's Thinking Process</span>
            </button>
            {isOpen && (
                <div className="pb-2 pr-4 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 text-gray-400">
                     <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onAction }) => {
    const isUser = message.sender === Sender.User;

    const containerClasses = isUser ? 'flex justify-end' : 'flex items-start space-x-4';
    const bubbleClasses = isUser
        ? 'bg-primary-600 text-white rounded-l-2xl rounded-t-2xl'
        : 'bg-surface/90 backdrop-blur-sm text-gray-200 rounded-r-2xl rounded-t-2xl shadow-md border border-white/5';

    const content = message.text;
    const contextForActions = message.actionContext ?? content;

    return (
        <div className={containerClasses}>
            {!isUser && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                    <LightbulbIcon className="w-6 h-6" />
                </div>
            )}
            <div className="flex flex-col items-start max-w-lg lg:max-w-3xl">
                <div className={`p-4 ${bubbleClasses}`}>
                    {content && (
                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-a:text-primary-300 hover:prose-a:underline w-full">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    )}
                    {message.quizData && <Quiz quizData={message.quizData} />}
                    {message.flashcardData && <Flashcards flashcardData={message.flashcardData} />}
                    {message.studyNotesData && <StudyNotes notes={message.studyNotesData} />}
                    {message.knowledgeGraphData && <KnowledgeGraph graphData={message.knowledgeGraphData} />}
                    {!isUser && message.thinking && <ThinkingAccordion content={message.thinking} />}
                </div>
                {!isUser && message.showActions && contextForActions && (
                    <ActionButtons onAction={(action) => onAction(action, contextForActions)} />
                )}
            </div>
             {isUser && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center ml-4 text-gray-300">
                    <UserIcon className="w-6 h-6" />
                </div>
            )}
        </div>
    );
};

export default ChatMessage;