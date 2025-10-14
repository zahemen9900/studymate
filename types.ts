export enum Sender {
    User = 'user',
    AI = 'ai',
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
}

export interface QuizData {
    questions: QuizQuestion[];
}

export interface Flashcard {
    front: string;
    back: string;
}

export interface FlashcardData {
    cards: Flashcard[];
}

export interface StudyNotesData {
    title: string;
    content: string;
}

export interface Node {
    data: {
        id: string;
        label: string;
    };
}

export interface Edge {
    data: {
        id: string;
        source: string;
        target: string;
        label?: string;
    };
}

export interface KnowledgeGraphData {
    nodes: Node[];
    edges: Edge[];
}

export interface Message {
    id: string;
    sender: Sender;
    text?: string;
    quizData?: QuizData;
    flashcardData?: FlashcardData;
    studyNotesData?: StudyNotesData;
    knowledgeGraphData?: KnowledgeGraphData;
    showActions?: boolean;
    thinking?: string | null;
    actionContext?: string;
}

export interface Session {
    id:string;
    title: string;
    messages: Message[];
}

export interface UserSettings {
    nickname: string;
    tone: 'Concise' | 'Explanatory' | 'Socratic';
    customInstructions: string;
}

export interface UploadedFile {
    id:string;
    file: File;
    previewUrl: string;
}