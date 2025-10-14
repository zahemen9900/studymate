import React from 'react';
import { UploadedFile } from '../types';
import { XIcon, FileTextIcon } from './Icons';

interface AttachmentPreviewProps {
    files: UploadedFile[];
    onRemoveFile: (id: string) => void;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ files, onRemoveFile }) => {
    if (files.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-3 mb-3 px-1">
            {files.map(fileItem => (
                <div key={fileItem.id} className="relative flex items-center gap-2 bg-surface/80 p-2 rounded-lg border border-white/10 w-48 animate-fade-in">
                    <div className="flex-shrink-0 w-10 h-10 bg-background rounded-md flex items-center justify-center">
                        {fileItem.file.type.startsWith('image/') ? (
                            <img src={fileItem.previewUrl} alt={fileItem.file.name} className="w-full h-full object-cover rounded-md" />
                        ) : (
                            <FileTextIcon className="w-6 h-6 text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{fileItem.file.name}</p>
                        <p className="text-xs text-gray-500">{Math.round(fileItem.file.size / 1024)} KB</p>
                    </div>
                    <button
                        onClick={() => onRemoveFile(fileItem.id)}
                        className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 bg-gray-700 text-white rounded-full hover:bg-red-500 transition-colors border border-surface"
                        aria-label="Remove file"
                    >
                        <XIcon className="w-3 h-3" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default AttachmentPreview;