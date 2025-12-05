export interface LineComment {
  id: string;
  offset: number;      // Character offset from start of aiResponse
  comment: string;     // The comment content
  createdAt: number;
}

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
  // Comments on specific lines of AI response
  lineComments?: LineComment[];
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
