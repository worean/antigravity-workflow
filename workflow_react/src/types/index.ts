export interface UserPreferences {
  isSundayStart?: boolean;
  defaultPriority?: number;
  compactCards?: boolean;
  desktopNotifications?: boolean;
  [key: string]: any;
}

export interface User {
  id: number;
  email: string;
  name?: string | null;
  role?: 'ADMIN' | 'MEMBER' | string;
  avatar?: string | null;
  avatarColor?: string | null;
  preferences?: string | null;
  bio?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  isGoogleLinked?: boolean;
  groupMemberships?: GroupMember[];
  createdAt?: string;
}

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: 'LEADER' | 'MEMBER' | string;
  title?: string | null;
  user?: User;
  group?: Group;
  joinedAt?: string;
}

export interface Group {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  parentId?: number | null;
  order?: number;
  parent?: { id: number; name: string; code?: string | null } | null;
  children?: Group[];
  childrenList?: Group[];
  members?: GroupMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER' | string;
  user?: User;
  createdAt?: string;
}

export interface ProjectGroup {
  id: number;
  projectId: number;
  groupId: number;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER' | string;
  group?: Group;
  createdAt?: string;
}

export interface Favorite {
  id: number;
  userId?: number;
  targetType: 'PROJECT' | 'ISSUE' | 'SPRINT' | 'CHAT_CHANNEL';
  targetId: number;
  createdAt: string;
  detail?: any;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
  issuesCount?: number;
  projectsCount?: number;
  totalCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ProjectVisibility = 'PUBLIC' | 'PROTECTED' | 'PRIVATE';

export interface Project {
  id: number;
  name: string;
  key: string;
  description?: string | null;
  visibility?: ProjectVisibility;
  ownerId?: number;
  owner?: User;
  statusId?: number;
  status?: { id: number; name: string; category: string };
  priorityId?: number;
  priority?: { id: number; name: string; color?: string; level?: number };
  plannedStartDate?: string | null;
  dueDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  isFavorite?: boolean;
  workspaceId?: number | null;
  hasMention?: boolean;
  members?: ProjectMember[];
  groups?: ProjectGroup[];
  sprints?: Sprint[];
  tags?: Tag[];
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    issues?: number;
    sprints?: number;
    members?: number;
    groups?: number;
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
  tags?: Tag[];
  isLiked?: boolean;
  isFavorite?: boolean;
  workspaceId?: number | null;
  hasMention?: boolean;
  likesCount?: number;
  commentsCount?: number;
  attachmentsCount?: number;
  comments?: Comment[];
  worklogs?: Worklog[];
  plannedStartDate?: string | null;
  dueDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  parentId?: number | null;
  parent?: Issue | null;
  children?: Issue[];
  childrenCount?: number;
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
  author?: User | null;
  user?: User | null;
  parentId?: number | null;
  isDeletedParent?: boolean;
  children?: Comment[];
  reactions?: CommentReaction[];
  createdAt: string;
}

export interface Sprint {
  id: number;
  name: string;
  goal?: string | null;
  notes?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | string;
  projectId: number;
  project?: Project;
  isFavorite?: boolean;
  workspaceId?: number | null;
  hasMention?: boolean;
  issues?: Issue[];
  _count?: {
    issues?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface SprintDiscussionItem extends Comment {
  issue?: {
    id: number;
    title: string;
    issueNumber?: number;
    status?: { id: number; name: string; category: string };
    priority?: { id: number; name: string; level?: number; color?: string };
  };
}

export interface SprintWorklogItem extends Omit<Worklog, 'issue'> {
  timeSpentHours?: number;
  issue?: {
    id: number;
    title: string;
    issueNumber?: number;
    status?: IssueStatus;
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
  gitCommit?: {
    id: number;
    repoMappingId: number;
    repoMapping?: { id: number; repoIdentifier: string };
    commitHash: string;
    message: string;
    authorName: string;
    authorEmail?: string | null;
    committedAt: string;
    createdAt: string;
  };
}


export interface HealthStatus {
  status: string;
  timestamp: string;
  database?: any;
  error?: string;
}

// ----------------------------------------------------
// 💬 Discord-style Chat System Types
// ----------------------------------------------------
export * from './chat';
export * from './workspace';

export * from './wbs';
export * from './chatbot';
export * from './calendar';
export * from './widget';
export * from './dashboard';


