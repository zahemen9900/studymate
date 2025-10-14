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

export interface Message {
    id: string;
    sender: Sender;
    text?: string;
    quizData?: QuizData;
    flashcardData?: FlashcardData;
    studyNotesData?: StudyNotesData;
    showActions?: boolean;
    thinking?: string | null;
}

export interface Session {
    id: string;
    title: string;
    messages: Message[];
}