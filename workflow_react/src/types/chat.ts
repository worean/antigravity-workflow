import type { User } from './index';

export type ChannelType = 'GLOBAL' | 'GENERAL' | 'PROJECT' | 'GROUP' | 'DM';
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
  isFavorite?: boolean;
  workspaceId?: number | null;
  hasMention?: boolean;
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

export interface ChatAttachment {
  fileName: string;
  fileSize: number;
  fileUrl: string;
  fileType?: string | null;
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
  attachments?: ChatAttachment[] | string | any[] | null;
  mentions?: (number | string)[];
  hasMention?: boolean;
  isPinned?: boolean;
  isSystem?: boolean;
  reactions: ChatReactionGroup[];
  createdAt: string;
  updatedAt: string;
}
