import React, { useState } from 'react';
import { FlashcardData } from '../types';

interface FlashcardsProps {
    flashcardData: FlashcardData;
}

const Flashcards: React.FC<FlashcardsProps> = ({ flashcardData }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    
    const card = flashcardData.cards[currentIndex];

    const handleNext = () => {
        if (currentIndex < flashcardData.cards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => {
                setCurrentIndex((prev) => prev + 1);
            }, 150);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => {
                setCurrentIndex((prev) => prev - 1);
            }, 150);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto my-4 text-center p-4 rounded-lg bg-black/20">
            <div className="relative h-72 [perspective:1200px]">
                <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] cursor-pointer ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                >
                    {/* Front of the card */}
                    <div className="absolute w-full h-full bg-primary-700 rounded-xl flex items-center justify-center p-6 text-white [backface-visibility:hidden] shadow-lg shadow-primary-900/50">
                        <p className="text-2xl font-bold">{card.front}</p>
                    </div>
                    {/* Back of the card */}
                    <div className="absolute w-full h-full bg-primary-500 rounded-xl flex items-center justify-center p-6 text-white [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-lg shadow-primary-900/50">
                        <p className="text-lg">{card.back}</p>
                    </div>
                </div>
            </div>
            
             <p className="text-sm text-gray-400 mt-6 mb-3">
                Card {currentIndex + 1} of {flashcardData.cards.length}
            </p>
             <div className="flex justify-between items-center mt-2">
                <button
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    disabled={currentIndex === 0}
                    className="px-5 py-2 bg-surface text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Prev
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
                    className="text-primary-300 font-semibold px-4 py-2 rounded-lg hover:bg-surface/50 transition-colors"
                >
                    Tap to Flip
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    disabled={currentIndex === flashcardData.cards.length - 1}
                    className="px-5 py-2 bg-surface text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Flashcards;