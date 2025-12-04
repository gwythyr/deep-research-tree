import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { TreeNode, TreeState, Conversation } from './types';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

interface TreeContextType extends TreeState {
    conversations: Conversation[];
    currentConversationId: string | null;
    addNode: (parentId: string, node: Omit<TreeNode, 'id' | 'children' | 'createdAt'>) => string;
    selectNode: (nodeId: string) => void;
    getPathToRoot: (nodeId: string) => TreeNode[];
    getNode: (nodeId: string) => TreeNode | undefined;
    createNewConversation: () => void;
    switchConversation: (id: string) => void;
}

const TreeContext = createContext<TreeContextType | null>(null);

function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

function createInitialState(): TreeState {
    const rootId = generateId();
    const rootNode: TreeNode = {
        id: rootId,
        parentId: null,
        userMessage: '',
        aiResponse: 'Welcome! Ask me anything by recording your voice. I\'ll help you explore any topic in depth.',
        summary: 'Start',
        children: [],
        createdAt: Date.now(),
    };
    return {
        nodes: new Map([[rootId, rootNode]]),
        rootId,
        selectedNodeId: rootId,
    };
}

// Convert Map to JSON-serializable object
function serializeState(state: TreeState) {
    return {
        nodes: Object.fromEntries(state.nodes),
        rootId: state.rootId,
        selectedNodeId: state.selectedNodeId,
    };
}

// Convert stored object back to Map-based state
function deserializeState(data: any): TreeState {
    return {
        nodes: new Map(Object.entries(data.nodes)),
        rootId: data.rootId,
        selectedNodeId: data.selectedNodeId,
    };
}

export function TreeProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [state, setState] = useState<TreeState>(createInitialState);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

    // Load conversations when user logs in
    useEffect(() => {
        if (!user) {
            setState(createInitialState());
            setConversations([]);
            setCurrentConversationId(null);
            return;
        }

        async function loadConversations() {
            const { data } = await supabase
                .from('conversations')
                .select('id, title, updated_at')
                .eq('user_id', user!.id)
                .order('updated_at', { ascending: false });

            if (data && data.length > 0) {
                setConversations(data.map(c => ({ id: c.id, title: c.title || 'Untitled', updatedAt: c.updated_at })));
                // Load the most recent conversation
                const { data: conv } = await supabase
                    .from('conversations')
                    .select('*')
                    .eq('id', data[0].id)
                    .single();
                if (conv) {
                    setState(deserializeState(conv.tree_data));
                    setCurrentConversationId(conv.id);
                }
            }
        }

        loadConversations();
    }, [user]);

    // Save to Supabase when state changes
    useEffect(() => {
        if (!user || !currentConversationId) return;

        const saveTimeout = setTimeout(async () => {
            const serialized = serializeState(state);

            // Generate title from first user message if needed
            let title: string | undefined;
            const rootNode = state.nodes.get(state.rootId);
            if (rootNode && rootNode.children.length > 0) {
                const firstChild = state.nodes.get(rootNode.children[0]);
                if (firstChild?.userMessage) {
                    title = firstChild.userMessage.slice(0, 50) + (firstChild.userMessage.length > 50 ? '...' : '');
                }
            }

            await supabase
                .from('conversations')
                .update({
                    tree_data: serialized,
                    updated_at: new Date().toISOString(),
                    ...(title && { title })
                })
                .eq('id', currentConversationId);

            // Update local conversations list
            if (title) {
                setConversations(prev => prev.map(c =>
                    c.id === currentConversationId ? { ...c, title, updatedAt: new Date().toISOString() } : c
                ));
            }
        }, 1000);

        return () => clearTimeout(saveTimeout);
    }, [state, user, currentConversationId]);

    const createNewConversation = useCallback(async () => {
        if (!user) return;

        const newState = createInitialState();
        const serialized = serializeState(newState);

        const { data } = await supabase
            .from('conversations')
            .insert({ user_id: user.id, tree_data: serialized, title: 'New Conversation' })
            .select()
            .single();

        if (data) {
            setState(newState);
            setCurrentConversationId(data.id);
            setConversations(prev => [{ id: data.id, title: 'New Conversation', updatedAt: data.updated_at }, ...prev]);
        }
    }, [user]);

    const switchConversation = useCallback(async (id: string) => {
        const { data } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', id)
            .single();

        if (data) {
            setState(deserializeState(data.tree_data));
            setCurrentConversationId(data.id);
        }
    }, []);

    const addNode = useCallback((parentId: string, nodeData: Omit<TreeNode, 'id' | 'children' | 'createdAt'>): string => {
        const id = generateId();
        const newNode: TreeNode = {
            ...nodeData,
            id,
            children: [],
            createdAt: Date.now(),
        };

        setState(prev => {
            const newNodes = new Map(prev.nodes);
            newNodes.set(id, newNode);

            const parent = newNodes.get(parentId);
            if (parent) {
                newNodes.set(parentId, {
                    ...parent,
                    children: [...parent.children, id],
                });
            }

            return {
                ...prev,
                nodes: newNodes,
                selectedNodeId: id,
            };
        });

        return id;
    }, []);

    const selectNode = useCallback((nodeId: string) => {
        setState(prev => ({ ...prev, selectedNodeId: nodeId }));
    }, []);

    const getPathToRoot = useCallback((nodeId: string): TreeNode[] => {
        const path: TreeNode[] = [];
        let currentId: string | null = nodeId;

        while (currentId) {
            const node = state.nodes.get(currentId);
            if (node) {
                path.unshift(node);
                currentId = node.parentId;
            } else {
                break;
            }
        }

        return path;
    }, [state.nodes]);

    const getNode = useCallback((nodeId: string): TreeNode | undefined => {
        return state.nodes.get(nodeId);
    }, [state.nodes]);

    return (
        <TreeContext.Provider value={{
            ...state,
            conversations,
            currentConversationId,
            addNode,
            selectNode,
            getPathToRoot,
            getNode,
            createNewConversation,
            switchConversation
        }}>
            {children}
        </TreeContext.Provider>
    );
}

export function useTree() {
    const context = useContext(TreeContext);
    if (!context) {
        throw new Error('useTree must be used within TreeProvider');
    }
    return context;
}

