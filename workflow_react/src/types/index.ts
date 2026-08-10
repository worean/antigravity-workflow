export interface User {
  id: number;
  email: string;
  name?: string | null;
  createdAt?: string;
}

export interface Project {
  id: number;
  name: string;
  key: string;
  description?: string | null;
  ownerId?: number;
  owner?: User;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    issues?: number;
    memberships?: number;
  };
}

export interface IssueType {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

export interface IssuePriority {
  id: number;
  name: string;
  level: number;
  color?: string;
}

export interface IssueStatus {
  id: number;
  name: string;
  category: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
}

export interface CustomFieldDefinition {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  fieldType: string; // STRING, NUMBER, DATE, SELECT, JSON 등
  schemaJson?: string | null;
  defaultValue?: string | null;
  isRequired?: boolean;
  isGlobal?: boolean;
  projectId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Issue {
  id: number;
  title: string;
  description?: string | null;
  projectId?: number;
  project?: Project;
  authorId?: number;
  author?: User;
  assigneeId?: number | null;
  assignee?: User | null;
  statusId?: number;
  status?: IssueStatus;
  priorityId?: number;
  priority?: IssuePriority;
  typeId?: number;
  type?: IssueType;
  sprintId?: number | null;
  progress?: number;
  dueDate?: string | null;
  customFields?: any;
  isLiked?: boolean;
  likesCount?: number;
  commentsCount?: number;
  attachmentsCount?: number;
  childrenCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: number;
  content: string;
  issueId: number;
  authorId: number;
  author?: User;
  createdAt: string;
}

export interface Sprint {
  id: number;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  projectId: number;
}

export interface Worklog {
  id: number;
  issueId: number;
  userId: number;
  user?: User;
  issue?: Issue;
  timeSpentMinutes: number;
  description?: string;
  loggedAt: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
}
