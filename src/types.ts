export interface TreeNode {
  id: string;
  parentId: string | null;
  role: 'user' | 'assistant';
  audioBlob?: Blob;
  transcript?: string;
  summary: string;
  content: string;
  children: string[];
  createdAt: number;
}

export interface TreeState {
  nodes: Map<string, TreeNode>;
  rootId: string;
  selectedNodeId: string;
}
