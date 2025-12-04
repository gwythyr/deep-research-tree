import { useState } from 'react';
import { useTree } from '../TreeContext';
import { useAuth } from '../AuthContext';

export function ConversationList() {
    const { user } = useAuth();
    const { conversations, currentConversationId, createNewConversation, switchConversation } = useTree();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!user) return null;

    return (
        <div className="conversation-list">
            <div className="conversation-header">
                <button className="new-conversation-btn" onClick={createNewConversation}>
                    + New Chat
                </button>
                {conversations.length > 0 && (
                    <button
                        className="toggle-history-btn"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? '▲ Hide' : `▼ History (${conversations.length})`}
                    </button>
                )}
            </div>
            {isExpanded && (
                <div className="conversations">
                    {conversations.map(conv => (
                        <div
                            key={conv.id}
                            className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
                            onClick={() => switchConversation(conv.id)}
                        >
                            <span className="conversation-title">{conv.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
