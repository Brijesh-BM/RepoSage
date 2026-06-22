export interface Job {
  id: string;
  repo_url: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  created_at: string;
}

export interface CriticalIssue {
  title: string;
  severity: 'high' | 'medium' | 'low';
  affected_files: string[];
  root_cause: string;
  fix: string;
  confidence: number;
}

export interface SecurityRisk {
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggested_fix: string;
}

export interface TechDebtItem {
  category: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  estimated_effort: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  action: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Report {
  id: string;
  job_id: string;
  health_score: number;
  tech_stack: string[];
  critical_issues: CriticalIssue[];
  security_risks: SecurityRisk[];
  tech_debt: TechDebtItem[];
  recommendations: Recommendation[];
  next_actions: string[];
  created_at: string;
}

export interface AgentStep {
  phase: 'observe' | 'understand' | 'reason' | 'act' | 'report' | 'failed';
  message: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  progress: number;
  created_at: string;
}
