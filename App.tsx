import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Message, Sender, QuizData, Session, FlashcardData, StudyNotesData, UserSettings, UploadedFile, KnowledgeGraphData } from './types';
import { generateTutorResponseStream, generateSimplifiedExplanation, generateAnalogy, generateQuiz, generateFlashcards, generateStudyNotes, generateKnowledgeGraph } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import LandingPage from './components/LandingPage';
import HistorySidebar from './components/HistorySidebar';
import SettingsModal from './components/SettingsModal';
import AttachmentPreview from './components/AttachmentPreview';
import { BrainIcon, LightbulbIcon, SparklesIcon, PanelLeftOpenIcon, PanelLeftCloseIcon, PenSquareIcon, PuzzlePieceIcon, BookOpenIcon, ClipboardDocumentListIcon, NetworkIcon, BeakerIcon, XIcon } from './components/Icons';

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

const DEFAULT_SETTINGS: UserSettings = {
    nickname: 'Learner',
    tone: 'Explanatory',
    customInstructions: ''
};

const MAX_FILES = 3;

const ONBOARDING_TYPING_WORDS = ["your personal AI tutor.", "your study companion.", "your knowledge navigator."];
const TYPING_SPEED = 100;
const DELETING_SPEED = 50;
const DELAY_BETWEEN_WORDS = 1500;

const OnboardingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [wordIndex, setWordIndex] = useState(0);
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const modalRoot = document.getElementById('modal-root');

    useEffect(() => {
        if (step !== 1) return;
        const handleTyping = () => {
            const currentWord = ONBOARDING_TYPING_WORDS[wordIndex];
            const updatedText = isDeleting
                ? currentWord.substring(0, text.length - 1)
                : currentWord.substring(0, text.length + 1);

            setText(updatedText);

            if (!isDeleting && updatedText === currentWord) {
                setTimeout(() => setIsDeleting(true), DELAY_BETWEEN_WORDS);
            } else if (isDeleting && updatedText === '') {
                setIsDeleting(false);
                setWordIndex((prev) => (prev + 1) % ONBOARDING_TYPING_WORDS.length);
            }
        };

        const timer = setTimeout(handleTyping, isDeleting ? DELETING_SPEED : TYPING_SPEED);
        return () => clearTimeout(timer);
    }, [text, isDeleting, wordIndex, step]);
    
    useEffect(() => {
        if (!isOpen) {
            // Reset state when closed
            setTimeout(() => setStep(1), 300);
        }
    }, [isOpen]);

    const handleNext = () => setStep(s => Math.min(s + 1, 3));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));
    
    if (!isOpen || !modalRoot) return null;

    const features = [
        { icon: <SparklesIcon className="w-6 h-6 text-primary-400"/>, title: "Simplify Concepts", description: "Break down complex topics into easy-to-understand explanations." },
        { icon: <BeakerIcon className="w-6 h-6 text-primary-400"/>, title: "Create Analogies", description: "Generate relatable analogies to connect new ideas with what you already know." },
        { icon: <PuzzlePieceIcon className="w-6 h-6 text-primary-400"/>, title: "Build Quizzes", description: "Test your knowledge with custom multiple-choice quizzes on any topic." },
        { icon: <BookOpenIcon className="w-6 h-6 text-primary-400"/>, title: "Make Flashcards", description: "Create flashcards for key terms to supercharge your memorization." },
        { icon: <ClipboardDocumentListIcon className="w-6 h-6 text-primary-400"/>, title: "Generate Study Notes", description: "Summarize long texts into structured and concise study notes." },
        { icon: <NetworkIcon className="w-6 h-6 text-primary-400"/>, title: "Visualize Knowledge", description: "Explore connections between ideas with interactive knowledge graphs." },
    ];

    const content = (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-hidden">
            <div className="absolute top-1/4 -right-40 w-[400px] h-[400px] bg-gradient-to-tr from-primary-500 to-purple-600 rounded-full opacity-20 blur-3xl animate-blob-animate" />
            <div className="relative w-full max-w-4xl bg-surface/80 backdrop-blur-lg rounded-xl shadow-2xl flex flex-col md:flex-row border border-white/10 overflow-hidden z-10 h-auto md:h-[32rem]">
                
                <div className="hidden md:flex flex-col items-center justify-center w-2/5 bg-background/30 p-8 border-r border-white/10">
                    <div className="relative w-48 h-48">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-purple-700 rounded-full opacity-30 blur-2xl"></div>
                        {step === 1 && <BrainIcon className="relative w-full h-full text-primary-300 animate-fade-in" />}
                        {step === 2 && (
                             <div className="relative w-full h-full grid grid-cols-3 gap-4 items-center justify-center animate-fade-in">
                                {features.map((f, i) => (
                                   <div key={i} className={`p-2 bg-white/5 rounded-full`}>
                                      {React.cloneElement(f.icon, { className: "w-6 h-6 text-primary-300 mx-auto" })}
                                   </div>
                               ))}
                            </div>
                        )}
                        {step === 3 && <SparklesIcon className="relative w-full h-full text-primary-300 animate-fade-in" />}
                    </div>
                </div>

                <div className="flex flex-col flex-1">
                    <div className="p-8 space-y-6 text-center flex-1 flex flex-col justify-center min-h-[24rem] md:min-h-0">
                        {step === 1 && (
                            <div className="animate-fade-in">
                                <h2 className="text-4xl font-bold text-white mb-4">Welcome to StudyMate!</h2>
                                <p className="text-2xl text-primary-300 h-8 mb-4 font-georgia italic">
                                    I'm <span className="border-r-2 border-primary-300 animate-pulse">{text}</span>
                                </p>
                                <p className="text-gray-300 max-w-md mx-auto">I'm here to help you understand any subject, prepare for exams, and make learning more interactive and fun.</p>
                            </div>
                        )}
                        {step === 2 && (
                            <div className="animate-fade-in">
                                <h2 className="text-3xl font-bold text-white mb-6">What Can I Do?</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                    {features.map(f => (
                                        <div key={f.title} className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 mt-1">{f.icon}</div>
                                            <div>
                                                <h3 className="font-semibold text-white">{f.title}</h3>
                                                <p className="text-xs text-gray-400">{f.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {step === 3 && (
                            <div className="animate-fade-in">
                                <div className="inline-block p-3 bg-background rounded-full mb-4">
                                    <BrainIcon className="w-8 h-8 text-primary-400" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">Always Evolving</h2>
                                <p className="text-gray-300 max-w-md mx-auto">StudyMate is constantly learning and improving. We're working hard to bring you more powerful features soon. We'd love to hear your feedback!</p>
                            </div>
                        )}
                    </div>

                    <footer className="p-4 bg-background/50 border-t border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${step === i ? 'bg-primary-500' : 'bg-gray-600'}`}></div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4">
                            {step > 1 && <button onClick={handleBack} className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors">Back</button>}
                            {step < 3 && <button onClick={handleNext} className="px-5 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-all">Next</button>}
                            {step === 3 && <button onClick={onClose} className="px-5 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-all">Let's Get Started!</button>}
                        </div>
                    </footer>
                </div>
                 <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-md text-gray-500 hover:text-white hover:bg-white/10 z-20">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
    return createPortal(content, modalRoot);
};


const App: React.FC = () => {
    const [isStarted, setIsStarted] = useState<boolean>(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [greeting, setGreeting] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

    // Initialization
    useEffect(() => {
        setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
        document.documentElement.classList.add('dark'); // Force dark theme
        
        // Load sessions from localStorage
        try {
            const savedSessions = localStorage.getItem('chatSessions');
            const savedSettings = localStorage.getItem('userSettings');

            if (savedSessions) {
                const parsedSessions = JSON.parse(savedSessions);
                if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
                    setSessions(parsedSessions);
                    setActiveSessionId(parsedSessions[0].id);
                    setIsStarted(true); // If there are sessions, we should start the app
                }
            }
             if (savedSettings) {
                setUserSettings(JSON.parse(savedSettings));
            } else {
                setIsOnboardingOpen(true);
            }

        } catch (e) {
            console.error("Failed to load data from localStorage", e);
        }
    }, []);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem('chatSessions', JSON.stringify(sessions));
        } else {
            // This is handled in signOut to prevent clearing on initial load
        }
    }, [sessions]);

     // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
    }, [userSettings]);
    
    // Clean up object URLs for file previews to prevent memory leaks
    useEffect(() => {
        return () => {
            uploadedFiles.forEach(file => URL.revokeObjectURL(file.previewUrl));
        };
    }, []);


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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        
        const files = Array.from(event.target.files);
        const totalFiles = uploadedFiles.length + files.length;
        
        if (totalFiles > MAX_FILES) {
            setError(`You can only upload a maximum of ${MAX_FILES} files.`);
            // Clear the file input so the user can try again
            event.target.value = ''; 
            return;
        }

        const newFiles: UploadedFile[] = files.map((file: File) => ({
            id: `${file.name}-${file.lastModified}`,
            file: file,
            previewUrl: URL.createObjectURL(file)
        }));

        setUploadedFiles(prev => [...prev, ...newFiles]);
        event.target.value = '';
    };

    const handleRemoveFile = (id: string) => {
        setUploadedFiles(prev => {
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.previewUrl);
            }
            return prev.filter(f => f.id !== id);
        });
    };

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

    const addMessage = (sender: Sender, text?: string, data?: { quizData?: QuizData, flashcardData?: FlashcardData, studyNotesData?: StudyNotesData, knowledgeGraphData?: KnowledgeGraphData }, showActions: boolean = false, actionContext?: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            sender,
            text,
            ...data,
            showActions,
            actionContext,
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
        setUploadedFiles([]);
    };
    
    const handleSelectSession = (sessionId: string) => {
        setActiveSessionId(sessionId);
        setIsHistoryOpen(false);
        setUploadedFiles([]);
    }
    
    const handleDeleteSession = (sessionId: string) => {
        setSessions(prev => {
            const remaining = prev.filter(s => s.id !== sessionId);
            if(activeSessionId === sessionId) {
                 setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
            }
            if (remaining.length === 0) {
                localStorage.removeItem('chatSessions');
                setIsStarted(false); // Go back to landing if all chats are deleted
            }
            return remaining;
        });
    }

    const handleSignOut = () => {
        localStorage.removeItem('chatSessions');
        localStorage.removeItem('userSettings');
        setSessions([]);
        setActiveSessionId(null);
        setUserSettings(DEFAULT_SETTINGS);
        setIsStarted(false);
    };

    const handleSendMessage = async (inputText: string) => {
        if (!inputText.trim() && uploadedFiles.length === 0) return;

        let currentSessionId = activeSessionId;
        const promptText = inputText || (uploadedFiles.length > 0 ? "What can you tell me about this?" : "");
        const filesToSend = [...uploadedFiles];
        
        // Clear UI immediately
        setUploadedFiles(prevFiles => {
            prevFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
            return [];
        });


        if (!currentSessionId || (sessions.find(s => s.id === currentSessionId)?.messages.length ?? 0) === 0) {
            const newSession: Session = {
                id: Date.now().toString(),
                title: promptText.substring(0, 30) + (promptText.length > 30 ? '...' : ''),
                messages: [],
            };
            
            if (!currentSessionId) { 
                 setSessions(prev => [newSession, ...prev]);
                 setActiveSessionId(newSession.id);
                 currentSessionId = newSession.id;
            } else { 
                setSessions(prev => prev.map(s => s.id === currentSessionId ? {...s, title: newSession.title} : s));
            }
        }
        
        setIsStarted(true);
        
        setSessions(prevSessions => {
            return prevSessions.map(s => {
                if (s.id === currentSessionId) {
                    return { ...s, messages: [...s.messages, { id: Date.now().toString(), sender: Sender.User, text: promptText }] };
                }
                return s;
            });
        });
        
        setIsLoading(true);
        setError(null);
        
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
            const history = sessions.find(s => s.id === currentSessionId)?.messages.slice(0, -2) ?? [];
            const stream = generateTutorResponseStream(promptText, history, userSettings, filesToSend.map(f => f.file));
            
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
    
    const handleAction = useCallback(async (actionType: 'simplify' | 'analogy' | 'quiz' | 'flashcards' | 'notes' | 'knowledgeGraph', contextText: string) => {
        let actionMessage = '';
        switch(actionType) {
            case 'simplify': actionMessage = "Can you explain this like I'm 5?"; break;
            case 'analogy': actionMessage = "Can you give me an analogy for this?"; break;
            case 'quiz': actionMessage = "Create a quiz based on this."; break;
            case 'flashcards': actionMessage = "Create flashcards for the key terms in this."; break;
            case 'notes': actionMessage = "Summarize this into study notes."; break;
            case 'knowledgeGraph': actionMessage = "Create a knowledge graph for this topic."; break;
        }

        addMessage(Sender.User, actionMessage);
        setIsLoading(true);
        setError(null);
        
        updateMessages(prev => prev.map(msg => msg.text === contextText ? { ...msg, showActions: false } : msg));

        try {
            if (actionType === 'simplify') {
                const response = await generateSimplifiedExplanation(contextText);
                addMessage(Sender.AI, response, undefined, true, contextText);
            } else if (actionType === 'analogy') {
                const response = await generateAnalogy(contextText);
                addMessage(Sender.AI, response, undefined, true, contextText);
            } else if (actionType === 'quiz') {
                const quizData = await generateQuiz(contextText);
                addMessage(Sender.AI, "Here's a quiz to test your knowledge!", { quizData }, true, contextText);
            } else if (actionType === 'flashcards') {
                const flashcardData = await generateFlashcards(contextText);
                addMessage(Sender.AI, "I've made some flashcards to help you study.", { flashcardData }, true, contextText);
            } else if (actionType === 'notes') {
                const notesData = await generateStudyNotes(contextText);
                addMessage(Sender.AI, "Here are the study notes you requested.", { studyNotesData: notesData }, true, contextText);
            } else if (actionType === 'knowledgeGraph') {
                const graphData = await generateKnowledgeGraph(contextText);
                addMessage(Sender.AI, "I've generated a knowledge graph for this topic.", { knowledgeGraphData: graphData }, true, contextText);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            addMessage(Sender.AI, `Sorry, I couldn't process that request: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [activeSessionId, sessions]);

    const handleOnboardingFinish = () => {
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
        setIsOnboardingOpen(false);
        setIsStarted(true);
    };

    if (!isStarted && !isOnboardingOpen) {
        return <LandingPage onStart={() => setIsStarted(true)} />;
    }

    const hasConversationStarted = activeSessionId !== null && messages.length > 0;

    return (
        <div className="flex h-screen font-sans bg-background text-gray-100">
             <HistorySidebar
                isOpen={isHistoryOpen}
                sessions={sessions}
                activeSessionId={activeSessionId}
                userSettings={userSettings}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
                onClose={() => setIsHistoryOpen(false)}
                onShowSettings={() => setIsSettingsModalOpen(true)}
                onSignOut={handleSignOut}
            />
            <div className="flex flex-col flex-1 h-screen aurora-container">
                 <header className="flex items-center justify-between p-4 border-b border-white/10 bg-transparent shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsHistoryOpen(prev => !prev)} className="p-2 rounded-md hover:bg-surface">
                            {isHistoryOpen ? <PanelLeftCloseIcon className="w-6 h-6"/> : <PanelLeftOpenIcon className="w-6 h-6"/>}
                        </button>
                        <div className="flex items-center">
                             <BrainIcon className="w-8 h-8 text-primary-500" />
                             <h1 className="text-2xl font-bold ml-3 tracking-tight">StudyMate</h1>
                        </div>
                    </div>
                     <button
                        onClick={handleNewChat}
                        className="group relative p-2 rounded-md hover:bg-surface hidden sm:block"
                        aria-label="New Chat"
                    >
                        <PenSquareIcon className="w-6 h-6" />
                        <span className="absolute top-1/2 -translate-y-1/2 right-full mr-3 px-2 py-1 text-xs font-normal bg-background border border-white/10 text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            New Chat
                        </span>
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
                
                <footer className={`p-4 transition-all duration-500 ${!hasConversationStarted ? 'mb-16' : 'bg-transparent'}`}>
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
                        <AttachmentPreview files={uploadedFiles} onRemoveFile={handleRemoveFile} />
                        <ChatInput 
                            onSendMessage={handleSendMessage} 
                            isLoading={isLoading} 
                            hasStarted={hasConversationStarted}
                            onFileChange={handleFileChange}
                            fileCount={uploadedFiles.length}
                            maxFiles={MAX_FILES}
                        />
                    </div>
                </footer>
            </div>
             <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                currentSettings={userSettings}
                onSave={setUserSettings}
            />
             <OnboardingModal isOpen={isOnboardingOpen} onClose={handleOnboardingFinish} />
        </div>
    );
};

export default App;