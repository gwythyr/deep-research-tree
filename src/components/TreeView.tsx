import { useTree } from '../TreeContext';
import React, { useState } from 'react';

interface DeleteConfirmProps {
    nodeSummary: string;
    childrenCount: number;
    onConfirm: () => void;
    onCancel: () => void;
}

function DeleteConfirmDialog({ nodeSummary, childrenCount, onConfirm, onCancel }: DeleteConfirmProps) {
    return (
        <div className="delete-confirm-overlay" onClick={onCancel}>
            <div className="delete-confirm-dialog" onClick={e => e.stopPropagation()}>
                <h3>Delete Node?</h3>
                <p>
                    Are you sure you want to delete "<strong>{nodeSummary}</strong>"
                    {childrenCount > 0 && ` and its ${childrenCount} sub-node${childrenCount > 1 ? 's' : ''}`}?
                </p>
                <p className="delete-warning">This action cannot be undone.</p>
                <div className="delete-confirm-actions">
                    <button className="cancel-btn" onClick={onCancel}>Cancel</button>
                    <button className="delete-btn" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    );
}

// Helper to count all descendants
function countDescendants(nodeId: string, nodes: Map<string, any>): number {
    const node = nodes.get(nodeId);
    if (!node) return 0;
    let count = node.children.length;
    node.children.forEach((childId: string) => {
        count += countDescendants(childId, nodes);
    });
    return count;
}

export function TreeView() {
    const { nodes, rootId, selectedNodeId, selectNode, deleteNode, getPathToRoot } = useTree();
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; summary: string; childrenCount: number } | null>(null);

    const selectedPath = new Set(getPathToRoot(selectedNodeId).map(n => n.id));

    const handleDeleteClick = (e: React.MouseEvent, nodeId: string, summary: string) => {
        e.stopPropagation();
        const childrenCount = countDescendants(nodeId, nodes);
        setDeleteTarget({ id: nodeId, summary, childrenCount });
    };

    const handleConfirmDelete = () => {
        if (deleteTarget) {
            deleteNode(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    const renderNode = (nodeId: string, depth: number = 0): React.ReactNode => {
        const node = nodes.get(nodeId);
        if (!node) return null;

        const isSelected = nodeId === selectedNodeId;
        const isOnPath = selectedPath.has(nodeId);
        const isRoot = node.parentId === null;

        return (
            <div key={nodeId} className="tree-node-container">
                <div
                    className={`tree-node ${isSelected ? 'selected' : ''} ${isOnPath ? 'on-path' : ''}`}
                    onClick={() => selectNode(nodeId)}
                    title={node.userMessage || node.aiResponse}
                >
                    <span className="node-summary">{node.summary}</span>
                    {node.children.length > 0 && (
                        <span className="node-children-count">{node.children.length}</span>
                    )}
                    {!isRoot && (
                        <button
                            className="node-delete-btn"
                            onClick={(e) => handleDeleteClick(e, nodeId, node.summary)}
                            title="Delete node"
                        >
                            ×
                        </button>
                    )}
                </div>

                {node.children.length > 0 && (
                    <div className="tree-children">
                        {node.children.map(childId => renderNode(childId, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="tree-view">
            <div className="tree-scroll">
                {renderNode(rootId)}
            </div>
            {deleteTarget && (
                <DeleteConfirmDialog
                    nodeSummary={deleteTarget.summary}
                    childrenCount={deleteTarget.childrenCount}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
}
