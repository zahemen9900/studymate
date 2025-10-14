import React, { useState } from 'react';
import { QuizData, QuizQuestion } from '../types';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from './Icons';

interface QuizProps {
    quizData: QuizData;
}

const Quiz: React.FC<QuizProps> = ({ quizData }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>(new Array(quizData.questions.length).fill(null));
    const [showResults, setShowResults] = useState(false);

    const currentQuestion: QuizQuestion = quizData.questions[currentQuestionIndex];

    const handleAnswerSelect = (option: string) => {
        if (showResults) return;
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = option;
        setSelectedAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setShowResults(true);
        }
    };
    
    const handleRetry = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswers(new Array(quizData.questions.length).fill(null));
        setShowResults(false);
    }

    const calculateScore = () => {
        return selectedAnswers.reduce((score, answer, index) => {
            if (answer === quizData.questions[index].correctAnswer) {
                return score + 1;
            }
            return score;
        }, 0);
    };

    if (showResults) {
        const score = calculateScore();
        return (
            <div className="p-4 rounded-lg bg-background/50 space-y-4">
                <h3 className="text-xl font-bold text-center text-primary-200">Quiz Results</h3>
                <p className="text-center text-lg">You scored {score} out of {quizData.questions.length}!</p>
                <div className="space-y-3">
                    {quizData.questions.map((q, index) => (
                        <div key={index} className="p-3 rounded-md bg-surface">
                            <p className="font-semibold">{index + 1}. {q.question}</p>
                            <p className={`flex items-center mt-1 text-sm ${selectedAnswers[index] === q.correctAnswer ? 'text-green-400' : 'text-red-400'}`}>
                                {selectedAnswers[index] === q.correctAnswer ? <CheckCircleIcon className="w-5 h-5 mr-1"/> : <XCircleIcon className="w-5 h-5 mr-1"/>}
                                Your answer: {selectedAnswers[index] ?? 'Not answered'}
                            </p>
                            {selectedAnswers[index] !== q.correctAnswer && (
                                <p className="text-sm text-green-400 mt-1">Correct answer: {q.correctAnswer}</p>
                            )}
                        </div>
                    ))}
                </div>
                 <button
                    onClick={handleRetry}
                    className="w-full flex items-center justify-center mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400">Question {currentQuestionIndex + 1} of {quizData.questions.length}</p>
            <h4 className="text-lg font-semibold">{currentQuestion.question}</h4>
            <div className="space-y-2">
                {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === option;
                    return (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                                isSelected 
                                ? 'bg-primary-900/50 border-primary-500' 
                                : 'bg-gray-700/50 border-transparent hover:border-primary-400'
                            }`}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
            <button
                onClick={handleNext}
                disabled={!selectedAnswers[currentQuestionIndex]}
                className="w-full mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
                {currentQuestionIndex < quizData.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
        </div>
    );
};

export default Quiz;