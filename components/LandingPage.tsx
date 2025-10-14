import React, { useState, useEffect } from 'react';
import { BrainIcon } from './Icons';

interface LandingPageProps {
    onStart: () => void;
}

const TYPING_WORDS = [
    "Generate Flashcards.",
    "Ace Your Quizzes.",
    "Simplify Complex Topics.",
    "Understand Any Subject."
];
const TYPING_SPEED = 100;
const DELETING_SPEED = 50;
const DELAY_BETWEEN_WORDS = 1500;

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const [wordIndex, setWordIndex] = useState(0);
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const handleTyping = () => {
            const currentWord = TYPING_WORDS[wordIndex];
            const updatedText = isDeleting
                ? currentWord.substring(0, text.length - 1)
                : currentWord.substring(0, text.length + 1);

            setText(updatedText);

            if (!isDeleting && updatedText === currentWord) {
                setTimeout(() => setIsDeleting(true), DELAY_BETWEEN_WORDS);
            } else if (isDeleting && updatedText === '') {
                setIsDeleting(false);
                setWordIndex((prev) => (prev + 1) % TYPING_WORDS.length);
            }
        };

        const timer = setTimeout(handleTyping, isDeleting ? DELETING_SPEED : TYPING_SPEED);

        return () => clearTimeout(timer);
    }, [text, isDeleting, wordIndex]);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen font-sans bg-background text-gray-100 p-4 sm:p-6 md:p-8 overflow-hidden">
            <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] bg-gradient-to-tr from-primary-500 to-purple-600 rounded-full opacity-10 lg:opacity-20 blur-3xl animate-blob-animate hidden lg:block" />
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-background via-primary-950/20 to-[#431A6D]/30"></div>
            <div className="absolute inset-0 star-field z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-20"></div>
            
            <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-30">
                 <div className="flex items-center gap-2">
                    <BrainIcon className="w-7 h-7 text-primary-400" />
                    <span className="text-xl font-bold tracking-tight text-white">StudyMate</span>
                </div>
                <button
                    onClick={onStart}
                    className="px-5 py-2 bg-white text-black font-semibold text-sm rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                >
                    Get Started
                </button>
            </header>

            <main className="max-w-4xl w-full text-center z-30 animate-fade-in">
                <div className="flex justify-center items-center gap-4 mb-6">
                    <div className="inline-block px-4 py-2 border border-primary-400/30 bg-primary-950/20 rounded-full text-sm text-primary-300">
                        The Future of Personalized Learning
                    </div>
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    AI-Powered Learning to
                </h1>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400 mb-6 h-20 sm:h-24 md:h-28">
                    <span className="font-georgia italic border-r-4 border-primary-400 animate-pulse">{text}</span>
                </h1>
                
                <p className="max-w-2xl mx-auto mb-10 text-lg sm:text-xl text-gray-400 animate-slide-up [animation-delay:0.2s]">
                   StudyMate transforms complex topics into actionable insights. Explore difficult subjects with simple, powerful tools.
                </p>

                <div className="flex justify-center items-center gap-4 mb-16 animate-slide-up [animation-delay:0.4s]">
                     <button
                        onClick={onStart}
                        className="px-6 py-3 bg-primary-600 text-white font-bold rounded-lg shadow-lg shadow-primary-500/20 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all duration-300 transform hover:scale-105"
                    >
                        Start Studying
                    </button>
                    <button
                        className="px-6 py-3 bg-gray-800/50 text-white font-bold rounded-lg border border-gray-700 hover:bg-gray-800/80 focus:outline-none focus:ring-4 focus:ring-gray-500/50 transition-all duration-300"
                    >
                        Watch Demo
                    </button>
                </div>

                 <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-16 text-white animate-slide-up [animation-delay:0.6s]">
                    <div>
                        <p className="text-4xl font-bold">10K+</p>
                        <p className="text-sm text-gray-400">Concepts Explained</p>
                    </div>
                     <div>
                        <p className="text-4xl font-bold">50+</p>
                        <p className="text-sm text-gray-400">Subjects Covered</p>
                    </div>
                     <div>
                        <p className="text-4xl font-bold">24/7</p>
                        <p className="text-sm text-gray-400">Tutor Availability</p>
                    </div>
                </div>

            </main>
            <footer className="absolute bottom-6 text-center text-gray-500 text-sm z-30">
                <p>Your brain's new co-pilot.</p>
            </footer>
        </div>
    );
};

export default LandingPage;