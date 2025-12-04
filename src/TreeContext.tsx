import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { TreeNode, TreeState } from './types';

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

export function TreeProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<TreeState>(() => {
        const rootId = generateId();
        const rootNode: TreeNode = {
            id: rootId,
            parentId: null,
            role: 'assistant',
            summary: 'Start',
            content: 'Welcome! Ask me anything by recording your voice. I\'ll help you explore any topic in depth.',
            children: [],
            createdAt: Date.now(),
        };
        return {
            nodes: new Map([[rootId, rootNode]]),
            rootId,
            selectedNodeId: rootId,
        };
    });

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
