import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Sender, QuizData, Session, FlashcardData, StudyNotesData } from './types';
import { generateTutorResponseStream, generateSimplifiedExplanation, generateAnalogy, generateQuiz, generateFlashcards, generateStudyNotes } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import LandingPage from './components/LandingPage';
import HistorySidebar from './components/HistorySidebar';
import { BrainIcon, LightbulbIcon, SparklesIcon, MenuIcon } from './components/Icons';

const GREETINGS = [
    "How can I help you today?",
    "Let's learn something new.",
    "Ready for a study session?",
    "Ask me anything.",
    "What topic is on your mind?",
];

const SUGGESTIONS = [
    "Explain the theory of relativity",
    "Help me code a snake game in Python",
    "Who was Cleopatra?",
    "Quiz me on the periodic table"
];

const App: React.FC = () => {
    const [isStarted, setIsStarted] = useState<boolean>(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [greeting, setGreeting] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Initialization
    useEffect(() => {
        setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
        document.documentElement.classList.add('dark'); // Force dark theme
        
        // Load sessions from localStorage
        try {
            const savedSessions = localStorage.getItem('chatSessions');
            if (savedSessions) {
                const parsedSessions = JSON.parse(savedSessions);
                if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
                    setSessions(parsedSessions);
                    setActiveSessionId(parsedSessions[0].id);
                }
            }
        } catch (e) {
            console.error("Failed to load sessions from localStorage", e);
        }
    }, []);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem('chatSessions', JSON.stringify(sessions));
        } else {
            localStorage.removeItem('chatSessions');
        }
    }, [sessions]);


    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isStarted) {
            scrollToBottom();
        }
    }, [activeSessionId, isLoading, isStarted, sessions]);

    const activeSession = sessions.find(s => s.id === activeSessionId);
    const messages = activeSession?.messages ?? [];

    const updateMessages = (newMessages: Message[] | ((prevMessages: Message[]) => Message[])) => {
        if (!activeSessionId) return;
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                const updatedMessages = typeof newMessages === 'function' ? newMessages(s.messages) : newMessages;
                return { ...s, messages: updatedMessages };
            }
            return s;
        }));
    };

    const addMessage = (sender: Sender, text?: string, data?: { quizData?: QuizData, flashcardData?: FlashcardData, studyNotesData?: StudyNotesData }, showActions: boolean = false) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            sender,
            text,
            ...data,
            showActions,
        };
        updateMessages(prev => [...prev, newMessage]);
        return newMessage;
    };
    
    const handleNewChat = () => {
        setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
        const newSession: Session = {
            id: Date.now().toString(),
            title: "New Chat",
            messages: [],
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setIsHistoryOpen(false);
    };
    
    const handleSelectSession = (sessionId: string) => {
        setActiveSessionId(sessionId);
        setIsHistoryOpen(false);
    }
    
    const handleDeleteSession = (sessionId: string) => {
        setSessions(prev => {
            const remaining = prev.filter(s => s.id !== sessionId);
            if(activeSessionId === sessionId) {
                 setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
            }
            if (remaining.length === 0) {
                localStorage.removeItem('chatSessions');
            }
            return remaining;
        });
    }

    const handleSendMessage = async (inputText: string) => {
        if (!inputText.trim()) return;

        let currentSessionId = activeSessionId;
        let isNewSession = false;

        if (!currentSessionId || (sessions.find(s => s.id === currentSessionId)?.messages.length ?? 0) === 0) {
            isNewSession = true;
            const newSession: Session = {
                id: Date.now().toString(),
                title: inputText.substring(0, 30) + (inputText.length > 30 ? '...' : ''),
                messages: [],
            };
            
            if (!currentSessionId) { // It's a truly new session
                 setSessions(prev => [newSession, ...prev]);
                 setActiveSessionId(newSession.id);
                 currentSessionId = newSession.id;
            } else { // It's an existing but empty session, so we just update title
                setSessions(prev => prev.map(s => s.id === currentSessionId ? {...s, title: newSession.title} : s));
            }
        }
        
        setIsStarted(true);
        
        // Add user message to the correct session
        setSessions(prevSessions => {
            return prevSessions.map(s => {
                if (s.id === currentSessionId) {
                    return { ...s, messages: [...s.messages, { id: Date.now().toString(), sender: Sender.User, text: inputText }] };
                }
                return s;
            });
        });
        
        setIsLoading(true);
        setError(null);
        
        // Add empty AI message to stream into
        const aiMessageId = Date.now().toString() + '-ai';
        setSessions(prevSessions => {
             return prevSessions.map(s => {
                if (s.id === currentSessionId) {
                    return { ...s, messages: [...s.messages, { id: aiMessageId, sender: Sender.AI, text: '', showActions: false }] };
                }
                return s;
            });
        });

        try {
            const history = sessions.find(s => s.id === currentSessionId)?.messages.slice(0, -2) ?? []; // Exclude the user's latest message and the empty AI message
            const stream = generateTutorResponseStream(inputText, history);
            
            for await (const chunk of stream) {
                setSessions(prevSessions => prevSessions.map(s => {
                    if (s.id === currentSessionId) {
                        const lastMsgIndex = s.messages.length - 1;
                        if(s.messages[lastMsgIndex].id === aiMessageId) {
                            const updatedMessages = [...s.messages];
                            updatedMessages[lastMsgIndex].text = (updatedMessages[lastMsgIndex].text || '') + chunk;
                            return {...s, messages: updatedMessages};
                        }
                    }
                    return s;
                }));
            }
            
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            addMessage(Sender.AI, `Sorry, I encountered an error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
            // Final update to show actions and parse thinking
             setSessions(prevSessions => prevSessions.map(s => {
                if (s.id === currentSessionId) {
                    const lastMsgIndex = s.messages.length - 1;
                    if(s.messages[lastMsgIndex].id === aiMessageId) {
                        const updatedMessages = [...s.messages];
                        const fullText = updatedMessages[lastMsgIndex].text ?? '';
                        
                        const thinkingMatch = fullText.match(/<thinking>([\s\S]*?)<\/thinking>/);
                        const thinking = thinkingMatch ? thinkingMatch[1].trim() : null;
                        const text = fullText.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();

                        updatedMessages[lastMsgIndex] = { ...updatedMessages[lastMsgIndex], text, thinking, showActions: true };
                        return {...s, messages: updatedMessages};
                    }
                }
                return s;
            }));
        }
    };
    
    const handleAction = useCallback(async (actionType: 'simplify' | 'analogy' | 'quiz' | 'flashcards' | 'notes', contextText: string) => {
        let actionMessage = '';
        switch(actionType) {
            case 'simplify': actionMessage = "Can you explain this like I'm 5?"; break;
            case 'analogy': actionMessage = "Can you give me an analogy for this?"; break;
            case 'quiz': actionMessage = "Create a quiz based on this."; break;
            case 'flashcards': actionMessage = "Create flashcards for the key terms in this."; break;
            case 'notes': actionMessage = "Summarize this into study notes."; break;
        }

        addMessage(Sender.User, actionMessage);
        setIsLoading(true);
        setError(null);
        
        updateMessages(prev => prev.map(msg => msg.text === contextText ? { ...msg, showActions: false } : msg));

        try {
            if (actionType === 'simplify') {
                const response = await generateSimplifiedExplanation(contextText);
                addMessage(Sender.AI, response, undefined, true);
            } else if (actionType === 'analogy') {
                const response = await generateAnalogy(contextText);
                addMessage(Sender.AI, response, undefined, true);
            } else if (actionType === 'quiz') {
                const quizData = await generateQuiz(contextText);
                addMessage(Sender.AI, undefined, { quizData });
            } else if (actionType === 'flashcards') {
                const flashcardData = await generateFlashcards(contextText);
                addMessage(Sender.AI, undefined, { flashcardData });
            } else if (actionType === 'notes') {
                const notesData = await generateStudyNotes(contextText);
                addMessage(Sender.AI, undefined, { studyNotesData: notesData });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            addMessage(Sender.AI, `Sorry, I couldn't process that request: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [activeSessionId, sessions]);

    if (!isStarted && sessions.length === 0) {
        return <LandingPage onStart={() => setIsStarted(true)} />;
    }

    const hasConversationStarted = activeSessionId !== null && messages.length > 0;

    return (
        <div className="flex h-screen font-sans bg-background text-gray-100">
             <HistorySidebar
                isOpen={isHistoryOpen}
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
                onClose={() => setIsHistoryOpen(false)}
            />
            <div className="flex flex-col flex-1 h-screen">
                 <header className="flex items-center justify-between p-4 border-b border-white/10 bg-background/80 backdrop-blur-sm shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-md hover:bg-surface">
                            <MenuIcon className="w-6 h-6"/>
                        </button>
                        <div className="flex items-center">
                             <BrainIcon className="w-8 h-8 text-primary-500" />
                             <h1 className="text-2xl font-bold ml-3 tracking-tight">StudyMate</h1>
                        </div>
                    </div>
                     <button 
                        onClick={handleNewChat}
                        className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-semibold transition-colors hidden sm:block"
                    >
                        New Chat
                    </button>
                </header>

                <main className={`flex-1 overflow-y-auto ${hasConversationStarted ? 'p-4 md:p-6 space-y-6' : 'flex flex-col justify-center'}`}>
                    {!hasConversationStarted ? (
                        <div className="text-center w-full max-w-2xl mx-auto animate-fade-in">
                            <div className="inline-block p-4 bg-surface rounded-full mb-6">
                                <SparklesIcon className="w-10 h-10 text-primary-400" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8">
                               {greeting}
                            </h1>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <ChatMessage key={msg.id} message={msg} onAction={handleAction} />
                            ))}
                            {isLoading && messages.length > 0 && messages[messages.length-1].sender === Sender.User && (
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                                        <LightbulbIcon className="w-6 h-6 text-white"/>
                                    </div>
                                    <div className="flex items-center space-x-2 p-4 bg-surface rounded-lg shadow-md">
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </>
                    )}
                </main>
                
                <footer className={`p-4 transition-all duration-500 ${!hasConversationStarted ? 'mb-16' : 'bg-background/80 backdrop-blur-sm'}`}>
                     {error && <p className="text-red-500 text-center mb-2 text-sm">{error}</p>}
                    <div className={`w-full transition-all duration-500 ${!hasConversationStarted ? 'max-w-2xl mx-auto' : 'max-w-4xl mx-auto'}`}>
                        {!hasConversationStarted && (
                            <div className="flex flex-wrap justify-center gap-2 mb-4 animate-slide-up [animation-delay:0.2s]">
                               {SUGGESTIONS.map(suggestion => (
                                   <button 
                                    key={suggestion}
                                    onClick={() => handleSendMessage(suggestion)}
                                    className="px-4 py-2 text-sm bg-surface/80 hover:bg-surface rounded-full text-gray-300 transition-colors"
                                   >
                                       {suggestion}
                                   </button>
                               ))}
                            </div>
                        )}
                        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} hasStarted={hasConversationStarted} />
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default App;