export interface User {
  id: number;
  email: string;
  name?: string | null;
  createdAt?: string;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  user?: User;
}

export interface Project {
  id: number;
  name: string;
  key: string;
  description?: string | null;
  ownerId?: number;
  owner?: User;
  statusId?: number;
  status?: { id: number; name: string; category: string };
  priorityId?: number;
  priority?: { id: number; name: string; color?: string };
  members?: ProjectMember[];
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
  issueNumber?: number;
  title: string;
  description?: string | null;
  projectId?: number;
  project?: Project;
  sprintId?: number | null;
  sprint?: Sprint;
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
  storyPoints?: number;
  loggedHours?: number;
  customFields?: any;
  progress?: number;
  isLiked?: boolean;
  likesCount?: number;
  commentsCount?: number;
  attachmentsCount?: number;
  comments?: Comment[];
  worklogs?: Worklog[];
  plannedStartDate?: string | null;
  dueDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentReaction {
  id: number;
  emoji: string;
  userId: number;
  user?: User;
}

export interface Comment {
  id: number;
  content: string;
  issueId: number;
  authorId: number;
  author?: User;
  user?: User;
  parentId?: number | null;
  children?: Comment[];
  reactions?: CommentReaction[];
  createdAt: string;
}

export interface Sprint {
  id: number;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: string; // PLANNED, ACTIVE, COMPLETED
  projectId: number;
  project?: Project;
  issues?: Issue[];
  _count?: {
    issues?: number;
  };
}


export interface Worklog {
  id: number;
  issueId: number;
  userId: number;
  user?: User;
  issue?: Issue;
  timeSpent: number; // minutes
  description?: string;
  startedAt?: string;
  createdAt: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
}
