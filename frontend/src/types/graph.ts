export interface GraphNode {
  id: string;
  label: string;
  completed: boolean;
  priority: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  isCritical?: boolean;
  isImpacted?: boolean;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'DEPENDS_ON' | 'BLOCKS';
}

export interface TaskGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface CriticalPath {
  path: any[];
  totalHours: number;
  criticalTaskIds: string[];
}

export interface ImpactAnalysis {
  affectedTasks: any[];
  totalImpactedTasks: number;
  impactedTaskIds: string[];
}
