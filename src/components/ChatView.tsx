import { useState, useCallback } from 'react';
import { useTree } from '../TreeContext';
import { AudioRecorder } from './AudioRecorder';
import { transcribe, summarize, reason } from '../gemini';

interface ChatViewProps {
    forkFromId?: string;
    onClearFork: () => void;
}

export function ChatView({ forkFromId, onClearFork }: ChatViewProps) {
    const { selectedNodeId, getPathToRoot, addNode, selectNode } = useTree();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeNodeId = forkFromId || selectedNodeId;
    const path = getPathToRoot(activeNodeId);

    const handleRecording = useCallback(async (audioBlob: Blob) => {
        setIsProcessing(true);
        setError(null);

        try {
            // 1. Transcribe audio
            const transcript = await transcribe(audioBlob);

            // 2. Summarize for tree display
            const summary = await summarize(transcript);

            // 3. Add user node
            const userNodeId = addNode(activeNodeId, {
                parentId: activeNodeId,
                role: 'user',
                audioBlob,
                transcript,
                summary: summary.slice(0, 30),
                content: transcript,
            });

            // 4. Get AI response with path context
            const history = path.map(node => ({
                role: node.role === 'user' ? 'user' as const : 'model' as const,
                content: node.content,
            }));
            history.push({ role: 'user', content: transcript });

            const response = await reason(history, audioBlob);
            const responseSummary = await summarize(response);

            // 5. Add assistant node
            addNode(userNodeId, {
                parentId: userNodeId,
                role: 'assistant',
                summary: responseSummary.slice(0, 30),
                content: response,
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

    return (
        <div className="chat-view">
            {forkFromId && (
                <div className="fork-banner">
                    Forking from: "{path[path.length - 1]?.summary}"
                    <button onClick={onClearFork}>Cancel</button>
                </div>
            )}

            <div className="messages">
                {path.map((node, index) => (
                    <div key={node.id} className={`message ${node.role}`}>
                        <div className="message-header">
                            <span className="message-role">{node.role === 'user' ? 'You' : 'AI'}</span>
                            {index < path.length - 1 && node.role === 'assistant' && (
                                <button
                                    className="fork-btn"
                                    onClick={() => selectNode(node.id)}
                                    title="Fork from here"
                                >
                                    ⑂ Fork
                                </button>
                            )}
                        </div>
                        <div className="message-content">{node.content}</div>
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
                <AudioRecorder onRecordingComplete={handleRecording} disabled={isProcessing} />
            </div>
        </div>
    );
}
