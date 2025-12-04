import { useState, useEffect } from 'react';
import { getApiKey, setApiKey } from '../gemini';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
    const [key, setKey] = useState('');

    useEffect(() => {
        if (isOpen) {
            setKey(getApiKey() || '');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        setApiKey(key.trim());
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h2>Settings</h2>
                <div className="modal-field">
                    <label htmlFor="api-key">Gemini API Key</label>
                    <input
                        id="api-key"
                        type="password"
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        placeholder="Enter your Gemini API key"
                    />
                    <p className="modal-hint">
                        Get your key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
                    </p>
                </div>
                <div className="modal-actions">
                    <button className="modal-btn secondary" onClick={onClose}>Cancel</button>
                    <button className="modal-btn primary" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
}
