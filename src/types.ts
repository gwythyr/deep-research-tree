export interface TreeNode {
  id: string;
  parentId: string | null;
  // User's input
  audioBlob?: Blob;
  userMessage: string;
  // AI's response
  aiResponse: string;
  // Summary for tree display (focused on user's question)
  summary: string;
  children: string[];
  createdAt: number;
}

export interface TreeState {
  nodes: Map<string, TreeNode>;
  rootId: string;
  selectedNodeId: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}
