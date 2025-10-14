import { GoogleGenAI, Type } from "@google/genai";
import { Message, Sender, QuizData, FlashcardData, StudyNotesData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const quizSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            description: "A list of quiz questions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: {
                        type: Type.STRING,
                        description: "The question text."
                    },
                    options: {
                        type: Type.ARRAY,
                        description: "An array of 4 multiple-choice options.",
                        items: {
                            type: Type.STRING
                        }
                    },
                    correctAnswer: {
                        type: Type.STRING,
                        description: "The correct answer, which must exactly match one of the options."
                    }
                },
                required: ["question", "options", "correctAnswer"]
            }
        }
    },
    required: ["questions"]
};

const flashcardSchema = {
    type: Type.OBJECT,
    properties: {
        cards: {
            type: Type.ARRAY,
            description: "A list of 4 flashcards.",
            items: {
                type: Type.OBJECT,
                properties: {
                    front: {
                        type: Type.STRING,
                        description: "The front side of the flashcard (e.g., a term or a question)."
                    },
                    back: {
                        type: Type.STRING,
                        description: "The back side of the flashcard (e.g., the definition or the answer)."
                    }
                },
                required: ["front", "back"]
            }
        }
    },
    required: ["cards"]
};

const studyNotesSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A concise title for the study notes."
        },
        content: {
            type: Type.STRING,
            description: "The main content of the study notes, formatted in markdown with headings, lists, and bold text for structure."
        }
    },
    required: ["title", "content"]
};

export async function* generateTutorResponseStream(prompt: string, history: Message[]): AsyncGenerator<string> {
    try {
        const chat = ai.chats.create({
            model: model,
            config: {
                systemInstruction: "You are StudyMate, a friendly and encouraging AI Tutor. Before providing your main response, first think step-by-step about the user's query and outline your response plan inside <thinking>...</thinking> tags. Then, provide your response. Explain concepts clearly and concisely. Use markdown for formatting when it improves readability (e.g., lists, bolding, code blocks). Use LaTeX for mathematical equations, enclosing inline math with `$` and block-level equations with `$$`. After your explanation, ask if the user understands or wants to dive deeper.",
            },
            history: history
                .filter(msg => msg.text)
                .map(msg => ({
                    role: msg.sender === Sender.User ? 'user' : 'model',
                    parts: [{ text: msg.text! }]
                }))
        });
        
        const responseStream = await chat.sendMessageStream({ message: prompt });
        for await (const chunk of responseStream) {
            yield chunk.text;
        }

    } catch (error) {
        console.error("Error generating tutor response stream:", error);
        throw new Error("Failed to get a streaming response from the AI tutor.");
    }
};

export const generateSimplifiedExplanation = async (concept: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: `Please explain the following concept in very simple terms, as if you were talking to a 5-year-old:\n\n---\n${concept}\n---`,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating simplified explanation:", error);
        throw new Error("Failed to simplify the explanation.");
    }
};

export const generateAnalogy = async (concept: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: `Create a simple and relatable analogy to help explain the following concept:\n\n---\n${concept}\n---`,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating analogy:", error);
        throw new Error("Failed to create an analogy.");
    }
};


export const generateQuiz = async (concept: string): Promise<QuizData> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: `Based on the following text, create a 5-question multiple-choice quiz. Ensure the correct answer is one of the options provided.\n\n---\n${concept}\n---`,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
            },
        });

        const jsonText = response.text.trim();
        const quizData = JSON.parse(jsonText);
        
        if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
            throw new Error("Invalid quiz format received from AI.");
        }
        
        return quizData as QuizData;
    } catch (error) {
        console.error("Error generating quiz:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse the quiz from the AI. The format was invalid.");
        }
        throw new Error("Failed to create a quiz.");
    }
};

export const generateFlashcards = async (concept: string): Promise<FlashcardData> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: `Based on the key terms in the following text, create a set of exactly 4 flashcards. For each, provide a 'front' (the term) and a 'back' (the definition).\n\n---\n${concept}\n---`,
            config: {
                responseMimeType: "application/json",
                responseSchema: flashcardSchema,
            },
        });

        const jsonText = response.text.trim();
        const flashcardData = JSON.parse(jsonText);

        if (!flashcardData.cards || !Array.isArray(flashcardData.cards) || flashcardData.cards.length === 0) {
            throw new Error("Invalid flashcard format received from AI.");
        }

        return flashcardData as FlashcardData;
    } catch (error) {
        console.error("Error generating flashcards:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse the flashcards from the AI. The format was invalid.");
        }
        throw new Error("Failed to create flashcards.");
    }
};

export const generateStudyNotes = async (concept: string): Promise<StudyNotesData> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: `Summarize the following text into a concise set of study notes. Provide a title and the main content. Use markdown for structure in the content, including headings for key sections, and bullet points for important details.\n\n---\n${concept}\n---`,
            config: {
                responseMimeType: "application/json",
                responseSchema: studyNotesSchema,
            },
        });
        const jsonText = response.text.trim();
        const studyNotesData = JSON.parse(jsonText);
         if (!studyNotesData.title || !studyNotesData.content) {
            throw new Error("Invalid study notes format received from AI.");
        }
        return studyNotesData as StudyNotesData;
    } catch (error) {
        console.error("Error generating study notes:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse the study notes from the AI. The format was invalid.");
        }
        throw new Error("Failed to create study notes.");
    }
};