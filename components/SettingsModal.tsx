import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { XIcon } from './Icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: UserSettings;
    onSave: (newSettings: UserSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onSave }) => {
    const [settings, setSettings] = useState<UserSettings>(currentSettings);

    useEffect(() => {
        setSettings(currentSettings);
    }, [currentSettings, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    const handleToneChange = (tone: UserSettings['tone']) => {
        setSettings(prev => ({ ...prev, tone }));
    };

    const tones: UserSettings['tone'][] = ['Concise', 'Explanatory', 'Socratic'];

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-lg bg-surface rounded-xl shadow-2xl flex flex-col border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-white/10">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
                            Nickname
                        </label>
                        <input
                            id="nickname"
                            type="text"
                            value={settings.nickname}
                            onChange={(e) => setSettings(prev => ({...prev, nickname: e.target.value}))}
                            className="w-full px-3 py-2 bg-background border border-white/20 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                            placeholder="How should the AI address you?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            AI Tone
                        </label>
                        <div className="grid grid-cols-3 gap-2 p-1 bg-background rounded-lg border border-white/20">
                            {tones.map(tone => (
                                <button
                                    key={tone}
                                    onClick={() => handleToneChange(tone)}
                                    className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                                        settings.tone === tone 
                                        ? 'bg-primary-600 text-white' 
                                        : 'bg-transparent text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    {tone}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="custom-instructions" className="block text-sm font-medium text-gray-300 mb-2">
                            Custom Instructions
                        </label>
                        <textarea
                            id="custom-instructions"
                            rows={4}
                            value={settings.customInstructions}
                            onChange={(e) => setSettings(prev => ({...prev, customInstructions: e.target.value}))}
                            className="w-full px-3 py-2 bg-background border border-white/20 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition resize-none"
                            placeholder="e.g., 'Always use analogies related to cooking.' or 'Focus on practical applications.'"
                        />
                    </div>
                </div>

                <footer className="p-4 bg-background/50 border-t border-white/10 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg shadow-lg shadow-primary-500/10 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all duration-300"
                    >
                        Save Changes
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsModal;
