export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface Domain {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface Category {
  id: string;
  domainId: string;
  name: string;
  description: string;
  parentCategoryId?: string;
}

export interface KnowledgeNode {
  id: string;
  domainId: string;
  categoryId: string;
  name: string;
  description: string;
  mastery: MasteryLevel;
  notes: string[];
  linkedNodeIds: string[];
  /** When set, this topic lives inside another topic instead of at category level. */
  parentId?: string;
}

export interface LearningEntry {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  nodeIds: string[];
}

export interface QuizQuestion {
  id: string;
  nodeId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface KnowledgeGraph {
  domains: Domain[];
  categories: Category[];
  nodes: KnowledgeNode[];
  learningEntries: LearningEntry[];
  quizQuestions: QuizQuestion[];
}

export interface DomainStats {
  domainId: string;
  totalNodes: number;
  masteredNodes: number;
  averageMastery: number;
  percentComplete: number;
}

export interface GapInsight {
  id: string;
  type: "category-gap" | "cross-domain" | "bridge-missing";
  title: string;
  description: string;
  nodeIds: string[];
  domainId?: string;
}
