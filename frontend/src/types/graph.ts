export interface GraphNode {
  id: string;
  label: string;
  completed: boolean;
  priority: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'DEPENDS_ON';
}

export interface TaskGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
