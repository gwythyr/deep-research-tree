import { useTree } from '../TreeContext';
import React from 'react';

export function TreeView() {
    const { nodes, rootId, selectedNodeId, selectNode, getPathToRoot } = useTree();

    const selectedPath = new Set(getPathToRoot(selectedNodeId).map(n => n.id));

    const renderNode = (nodeId: string, depth: number = 0): React.ReactNode => {
        const node = nodes.get(nodeId);
        if (!node) return null;

        const isSelected = nodeId === selectedNodeId;
        const isOnPath = selectedPath.has(nodeId);

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
        </div>
    );
}
