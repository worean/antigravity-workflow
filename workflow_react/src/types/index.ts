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
  priority?: { id: number; name: string; color?: string; level?: number };
  plannedStartDate?: string | null;
  dueDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  members?: ProjectMember[];
  groups?: ProjectGroup[];
  sprints?: Sprint[];
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
  startDate?: string | null;
  endDate?: string | null;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | string;
  projectId: number;
  project?: Project;
  issues?: Issue[];
  _count?: {
    issues?: number;
  };
  createdAt?: string;
  updatedAt?: string;
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

// ----------------------------------------------------
// 💬 Discord-style Chat System Types
// ----------------------------------------------------
export type ChannelType = 'GLOBAL' | 'PROJECT' | 'GROUP' | 'DM';
export type NotificationLevel = 'ALL' | 'MENTIONS_ONLY' | 'MUTED';

export interface ChatMember {
  id: number;
  userId: number;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | string;
  notificationLevel: NotificationLevel;
  mutedUntil?: string | null;
  user?: User;
}

export interface ChatChannel {
  id: number;
  name: string;
  rawName: string;
  type: ChannelType;
  topic?: string | null;
  icon?: string | null;
  isPrivate?: boolean;
  projectId?: number | null;
  project?: { id: number; name: string; key: string } | null;
  groupId?: number | null;
  group?: { id: number; name: string; code?: string | null } | null;
  memberCount: number;
  members: ChatMember[];
  mySettings: {
    notificationLevel: NotificationLevel;
    mutedUntil?: string | null;
    lastReadAt?: string;
  };
  lastMessage?: {
    id: number;
    content: string;
    senderId: number;
    senderName?: string | null;
    createdAt: string;
  } | null;
  unreadCount: number;
  displayAvatar?: string | null;
  displayAvatarColor?: string | null;
  otherUser?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatReactionGroup {
  emoji: string;
  count: number;
  users: { id: number; name: string }[];
  hasReacted: boolean;
}

export interface ChatMessage {
  id: number;
  channelId: number;
  senderId: number;
  sender: {
    id: number;
    name?: string | null;
    email: string;
    avatar?: string | null;
    avatarColor?: string | null;
    role?: string;
  };
  content: string;
  attachments?: any[];
  mentions?: (number | string)[];
  hasMention?: boolean;
  isPinned?: boolean;
  isSystem?: boolean;
  reactions: ChatReactionGroup[];
  createdAt: string;
  updatedAt: string;
}
