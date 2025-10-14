import { GoogleGenAI, Type, Part, Modality } from "@google/genai";
import { Message, Sender, QuizData, FlashcardData, StudyNotesData, UserSettings, KnowledgeGraphData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';
const ttsModel = 'gemini-2.5-flash-preview-tts';

async function fileToGenerativePart(file: File): Promise<Part> {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (reader.result) {
            resolve((reader.result as string).split(',')[1]);
        } else {
            reject(new Error("Failed to read file."));
        }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
  
  const data = await base64EncodedDataPromise;
  return {
    inlineData: {
      data,
      mimeType: file.type,
    },
  };
}

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

const knowledgeGraphSchema = {
    type: Type.OBJECT,
    properties: {
        nodes: {
            type: Type.ARRAY,
            description: "A list of nodes in the knowledge graph.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Unique identifier for the node." },
                    data: {
                        type: Type.OBJECT,
                        properties: {
                            label: { type: Type.STRING, description: "The display label for the node." }
                        },
                        required: ["label"]
                    },
                    position: {
                        type: Type.OBJECT,
                        properties: {
                            x: { type: Type.NUMBER, description: "The x-coordinate for the node's initial position." },
                            y: { type: Type.NUMBER, description: "The y-coordinate for the node's initial position." }
                        },
                         required: ["x", "y"]
                    }
                },
                required: ["id", "data", "position"]
            }
        },
        edges: {
            type: Type.ARRAY,
            description: "A list of edges connecting the nodes.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Unique identifier for the edge (e.g., 'e1-2')." },
                    source: { type: Type.STRING, description: "The ID of the source node." },
                    target: { type: Type.STRING, description: "The ID of the target node." },
                    label: { type: Type.STRING, description: "Optional label describing the relationship." }
                },
                required: ["id", "source", "target"]
            }
        }
    },
    required: ["nodes", "edges"]
};

export async function* generateTutorResponseStream(prompt: string, history: Message[], settings: UserSettings, files: File[]): AsyncGenerator<string> {
    try {
        let systemInstruction = `You are StudyMate, a friendly and encouraging AI Tutor. Your user's name is ${settings.nickname}.
Before providing your main response, first think step-by-step about the user's query and outline your response plan inside <thinking>...</thinking> tags.
If files are provided, analyze them as the primary context for your response.
Then, provide your response. Explain concepts clearly. Use markdown for formatting when it improves readability (e.g., lists, bolding, code blocks).
Use LaTeX for mathematical equations, enclosing inline math with '$' and block-level equations with '$$'.
After your explanation, ask if the user understands or wants to dive deeper.`;

        switch (settings.tone) {
            case 'Concise':
                systemInstruction += "\nYour tone should be concise and to-the-point. Avoid unnecessary chatter.";
                break;
            case 'Socratic':
                systemInstruction += "\nYour tone should be Socratic. Guide the user by asking questions to help them discover the answer on their own, rather than giving the answer directly.";
                break;
            case 'Explanatory':
            default:
                systemInstruction += "\nYour tone should be explanatory, providing detailed and thorough explanations.";
                break;
        }

        if (settings.customInstructions) {
            systemInstruction += `\n\nAdditionally, always follow these user-provided instructions: "${settings.customInstructions}"`;
        }

        const chat = ai.chats.create({
            model: model,
            config: {
                systemInstruction,
            },
            history: history
                .filter(msg => msg.text)
                .map(msg => ({
                    role: msg.sender === Sender.User ? 'user' : 'model',
                    parts: [{ text: msg.text! }]
                }))
        });
        
        const messageParts: Part[] = [{ text: prompt }];

        if (files && files.length > 0) {
            for (const file of files) {
                // 4MB limit per file
                if (file.size > 4 * 1024 * 1024) { 
                    throw new Error(`File ${file.name} is too large. Maximum size is 4MB.`);
                }
                const part = await fileToGenerativePart(file);
                messageParts.push(part);
            }
        }

        const responseStream = await chat.sendMessageStream({ message: messageParts });
        for await (const chunk of responseStream) {
            yield chunk.text;
        }

    } catch (error) {
        console.error("Error generating tutor response stream:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get a streaming response from the AI tutor: ${error.message}`);
        }
        throw new Error("An unknown error occurred while contacting the AI tutor.");
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

export const generateKnowledgeGraph = async (concept: string): Promise<KnowledgeGraphData> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: `Based on the following text, create a knowledge graph with nodes and edges. Each node must have a unique ID, a label, and an x/y position between 0 and 500. Each edge must link two nodes.\n\n---\n${concept}\n---`,
            config: {
                responseMimeType: "application/json",
                responseSchema: knowledgeGraphSchema,
            },
        });
        const jsonText = response.text.trim();
        const graphData = JSON.parse(jsonText);
        if (!graphData.nodes || !graphData.edges) {
            throw new Error("Invalid knowledge graph format received from AI.");
        }
        return graphData as KnowledgeGraphData;
    } catch (error) {
        console.error("Error generating knowledge graph:", error);
        if (error instanceof SyntaxError) {
            throw new Error("Failed to parse the knowledge graph from the AI. The format was invalid.");
        }
        throw new Error("Failed to create a knowledge graph.");
    }
};

export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text: `Read this clearly: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech from text.");
    }
};