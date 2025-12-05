import { useState, useRef, useEffect } from 'react';
import type { LineComment } from '../types';

interface LineCommentableProps {
    children: React.ReactNode;
    nodeId: string;
    offset: number;
    comment?: LineComment;
    onAddComment: (nodeId: string, offset: number, comment: string) => void;
    onDeleteComment: (nodeId: string, commentId: string) => void;
}

export function LineCommentable({
    children,
    nodeId,
    offset,
    comment,
    onAddComment,
    onDeleteComment
}: LineCommentableProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showBubble, setShowBubble] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleAddClick = () => {
        setIsEditing(true);
    };

    const handleSubmit = () => {
        if (inputValue.trim()) {
            onAddComment(nodeId, offset, inputValue.trim());
            setInputValue('');
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setInputValue('');
        }
    };

    const handleDelete = () => {
        if (comment) {
            onDeleteComment(nodeId, comment.id);
        }
    };

    const startVoiceRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());

                // Transcribe and add as comment
                try {
                    const { transcribe } = await import('../gemini');
                    const text = await transcribe(blob);
                    if (text.trim()) {
                        onAddComment(nodeId, offset, text.trim());
                        setIsEditing(false);
                    }
                } catch (err) {
                    console.error('Transcription failed:', err);
                }
                setIsRecording(false);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording:', err);
        }
    };

    const stopVoiceRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    return (
        <div className="line-commentable">
            <div className="line-content">
                {children}
                {comment && (
                    <div className="comment-indicator-wrapper">
                        <button
                            className="comment-indicator"
                            onClick={() => setShowBubble(!showBubble)}
                            title="View comment"
                        >
                            💬
                        </button>
                        {showBubble && (
                            <div className="comment-bubble">
                                <div className="comment-bubble-content">{comment.comment}</div>
                                <button
                                    className="comment-delete-btn"
                                    onClick={handleDelete}
                                    title="Delete comment"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {!comment && !isEditing && (
                    <button
                        className="add-comment-btn"
                        onClick={handleAddClick}
                        title="Add comment"
                    >
                        💬+
                    </button>
                )}
            </div>
            {isEditing && (
                <div className="comment-input-container">
                    <input
                        ref={inputRef}
                        type="text"
                        className="comment-input"
                        placeholder="Add a comment..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isRecording}
                    />
                    <button
                        className={`voice-btn ${isRecording ? 'recording' : ''}`}
                        onMouseDown={startVoiceRecording}
                        onMouseUp={stopVoiceRecording}
                        onMouseLeave={stopVoiceRecording}
                        title="Hold to record voice comment"
                    >
                        🎤
                    </button>
                    <button
                        className="submit-comment-btn"
                        onClick={handleSubmit}
                        disabled={!inputValue.trim()}
                    >
                        ✓
                    </button>
                    <button
                        className="cancel-comment-btn"
                        onClick={() => { setIsEditing(false); setInputValue(''); }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}
