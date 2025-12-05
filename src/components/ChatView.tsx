import { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTree } from '../TreeContext';
import { AudioRecorder, type AudioRecorderRef } from './AudioRecorder';
import { transcribe, summarize, reason } from '../gemini';

interface ChatViewProps {
    forkFromId?: string;
    onClearFork: () => void;
}

export function ChatView({ forkFromId, onClearFork }: ChatViewProps) {
    const { selectedNodeId, getPathToRoot, addNode, selectNode } = useTree();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [textInput, setTextInput] = useState('');
    const messagesRef = useRef<HTMLDivElement>(null);
    const audioRecorderRef = useRef<AudioRecorderRef>(null);
    const isSpaceRecordingRef = useRef(false);

    // Handle spacebar for recording
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            // Start recording on spacebar press (check repeat to prevent multiple triggers)
            if (e.code === 'Space' && !e.repeat && !isProcessing && !isSpaceRecordingRef.current) {
                e.preventDefault();
                isSpaceRecordingRef.current = true;
                audioRecorderRef.current?.startRecording();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            // Ignore if typing in an input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            // Stop recording on spacebar release
            if (e.code === 'Space' && isSpaceRecordingRef.current) {
                e.preventDefault();
                isSpaceRecordingRef.current = false;
                audioRecorderRef.current?.stopRecording();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isProcessing]);

    // Scroll to the selected node's message when selectedNodeId changes
    useEffect(() => {
        if (selectedNodeId && messagesRef.current) {
            const messageElement = document.getElementById(`message-${selectedNodeId}`);
            if (messageElement) {
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [selectedNodeId]);

    const activeNodeId = forkFromId || selectedNodeId;
    const path = getPathToRoot(activeNodeId);

    const processMessage = useCallback(async (userMessage: string, audioBlob?: Blob) => {
        setIsProcessing(true);
        setError(null);

        try {
            // 1. Summarize user message for tree display
            const summary = await summarize(userMessage);

            // 2. Get AI response with path context
            const sortedHistory = path.flatMap(node => [
                { role: 'user' as const, content: node.userMessage },
                { role: 'model' as const, content: node.aiResponse },
            ]).filter(msg => msg.content);
            sortedHistory.push({ role: 'user', content: userMessage });

            const response = await reason(sortedHistory, audioBlob);

            // 3. Add combined user+AI node
            addNode(activeNodeId, {
                parentId: activeNodeId,
                audioBlob,
                userMessage,
                aiResponse: response,
                summary: summary.slice(0, 80),
            });

            if (forkFromId) {
                onClearFork();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsProcessing(false);
        }
    }, [activeNodeId, path, addNode, forkFromId, onClearFork]);

    const handleRecording = useCallback(async (audioBlob: Blob) => {
        try {
            // Transcribe audio first
            const transcript = await transcribe(audioBlob);
            await processMessage(transcript, audioBlob);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setIsProcessing(false);
        }
    }, [processMessage]);

    const handleTextSubmit = useCallback(async () => {
        const message = textInput.trim();
        if (!message || isProcessing) return;

        setTextInput('');
        await processMessage(message);
    }, [textInput, isProcessing, processMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTextSubmit();
        }
    }, [handleTextSubmit]);

    return (
        <div className="chat-view">
            {forkFromId && (
                <div className="fork-banner">
                    Forking from: "{path[path.length - 1]?.summary}"
                    <button onClick={onClearFork}>Cancel</button>
                </div>
            )}

            <div className="messages" ref={messagesRef}>
                {path.map((node, index) => (
                    <div key={node.id} id={`message-${node.id}`} className="conversation-turn">
                        {/* User message */}
                        {node.userMessage && (
                            <div className="message user">
                                <div className="message-header">
                                    <span className="message-role">You</span>
                                </div>
                                <div className="message-content">{node.userMessage}</div>
                            </div>
                        )}
                        {/* AI response */}
                        {node.aiResponse && (
                            <div className="message assistant">
                                <div className="message-header">
                                    <span className="message-role">AI</span>
                                    {index < path.length - 1 && (
                                        <button
                                            className="fork-btn"
                                            onClick={() => selectNode(node.id)}
                                            title="Fork from here"
                                        >
                                            ⑂ Fork
                                        </button>
                                    )}
                                </div>
                                <div className="message-content">
                                    <ReactMarkdown>{node.aiResponse}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isProcessing && (
                    <div className="message assistant processing">
                        <div className="message-content">Thinking...</div>
                    </div>
                )}
            </div>

            {error && <div className="error">{error}</div>}

            <div className="input-area">
                <div className="text-input-container">
                    <textarea
                        className="text-input"
                        placeholder="Type a message..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isProcessing}
                        rows={1}
                    />
                    <button
                        className="send-btn"
                        onClick={handleTextSubmit}
                        disabled={isProcessing || !textInput.trim()}
                        title="Send message"
                    >
                        ↑
                    </button>
                </div>
                <div className="input-divider">
                    <span>or</span>
                </div>
                <AudioRecorder ref={audioRecorderRef} onRecordingComplete={handleRecording} disabled={isProcessing} />
            </div>
        </div>
    );
}
