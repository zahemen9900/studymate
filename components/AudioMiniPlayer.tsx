import React from 'react';
import { XIcon } from './Icons';

interface AudioMiniPlayerProps {
    isPlaying: boolean;
    duration: number;
    progress: number;
    onPlayPause: () => void;
    onClose: () => void;
}

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const AudioMiniPlayer: React.FC<AudioMiniPlayerProps> = ({ isPlaying, duration, progress, onPlayPause, onClose }) => {
    const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

    return (
        <div className="fixed bottom-5 right-5 w-72 bg-surface/90 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl p-3 flex items-center gap-3 animate-slide-up z-50">
            <button
                onClick={onPlayPause}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors"
            >
                {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"></path></svg>
                ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6V4z"></path></svg>
                )}
            </button>
            <div className="flex-1">
                <div className="w-full bg-background rounded-full h-1.5">
                    <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default AudioMiniPlayer;