export interface ConceptNode {
  id: string;
  label: string;
  /** Subject or module group this concept belongs to, e.g. "Data Structures", "Module II" */
  group?: string;
  category: 'foundation' | 'intermediate' | 'advanced';
  description: string;
  prerequisites: string[];
  importance: 'high' | 'medium' | 'low';
  sourceFile: string;
}

export interface ConceptEdge {
  id: string;
  source: string;
  target: string;
  /** One of: prerequisite | depends_on | related_to | part_of */
  relationship: 'prerequisite' | 'depends_on' | 'related_to' | 'part_of' | string;
}

export interface GraphData {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

export type AppState = 'upload' | 'processing' | 'dashboard';
