import { useTree } from '../TreeContext';
import { useAuth } from '../AuthContext';

export function ConversationList() {
    const { user } = useAuth();
    const { conversations, currentConversationId, createNewConversation, switchConversation } = useTree();

    if (!user) return null;

    return (
        <div className="conversation-list">
            <button className="new-conversation-btn" onClick={createNewConversation}>
                + New Chat
            </button>
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
        </div>
    );
}
