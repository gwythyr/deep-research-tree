import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { TreeNode, TreeState } from './types';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

interface TreeContextType extends TreeState {
    addNode: (parentId: string, node: Omit<TreeNode, 'id' | 'children' | 'createdAt'>) => string;
    selectNode: (nodeId: string) => void;
    getPathToRoot: (nodeId: string) => TreeNode[];
    getNode: (nodeId: string) => TreeNode | undefined;
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
    const [conversationId, setConversationId] = useState<string | null>(null);

    // Load from Supabase when user logs in
    useEffect(() => {
        if (!user) {
            setState(createInitialState());
            setConversationId(null);
            return;
        }

        async function loadConversation() {
            const { data } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_id', user!.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setState(deserializeState(data.tree_data));
                setConversationId(data.id);
            }
        }

        loadConversation();
    }, [user]);

    // Save to Supabase when state changes
    useEffect(() => {
        if (!user) return;

        const saveTimeout = setTimeout(async () => {
            const serialized = serializeState(state);

            if (conversationId) {
                await supabase
                    .from('conversations')
                    .update({ tree_data: serialized, updated_at: new Date().toISOString() })
                    .eq('id', conversationId);
            } else {
                const { data } = await supabase
                    .from('conversations')
                    .insert({ user_id: user.id, tree_data: serialized })
                    .select()
                    .single();

                if (data) setConversationId(data.id);
            }
        }, 1000); // Debounce saves

        return () => clearTimeout(saveTimeout);
    }, [state, user, conversationId]);

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
        <TreeContext.Provider value={{ ...state, addNode, selectNode, getPathToRoot, getNode }}>
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
