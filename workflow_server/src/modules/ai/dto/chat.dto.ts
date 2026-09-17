export interface ChatRequestDto {
  prompt: string;
  model?: string;
  history?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

export interface ChatActionDto {
  id: string;
  type: 
    | 'create_issue' 
    | 'update_issue' 
    | 'delete_issue' 
    | 'search_issues'
    | 'get_issue_detail'
    | 'create_project' 
    | 'delete_project' 
    | 'search_projects'
    | 'create_sprint'
    | 'update_sprint'
    | 'search_sprints'
    | 'get_sprint_summary' 
    | 'navigate';
  title: string;
  payload: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
}

export interface ChatTokenUsageDto {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostKrw: number;
}

export interface ChatAgentStepDto {
  tool: string;
  title: string;
  resultSummary?: string;
}

export interface ChatResponseDto {
  text: string;
  actions?: ChatActionDto[];
  usage?: ChatTokenUsageDto;
  steps?: ChatAgentStepDto[];
}
