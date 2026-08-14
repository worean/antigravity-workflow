import axios from 'axios';
import type { User, Project, Issue, Comment, Sprint, Worklog, HealthStatus, CustomFieldDefinition } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authorization 헤더 인터셉터
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const checkHealth = async (): Promise<HealthStatus> => {
  const res = await api.get<HealthStatus>('/health');
  return res.data;
};

// ==========================================
// 🛡️ Auth & Users API
// ==========================================
export const loginEmail = async (email: string, password?: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data; // { token, user }
};

export const registerUser = async (email: string, name: string, password?: string) => {
  const res = await api.post('/users', { email, name, password });
  return res.data;
};

export const getMe = async (): Promise<{ user: User }> => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const getUsers = async (): Promise<User[]> => {
  const res = await api.get('/users');
  return Array.isArray(res.data) ? res.data : (res.data.users || []);
};

export const updateUser = async (id: number, data: Partial<User>): Promise<User> => {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/users/${id}`);
};

// ==========================================
// 📁 Projects API
// ==========================================
export const getProjects = async (): Promise<Project[]> => {
  const res = await api.get('/projects');
  return Array.isArray(res.data) ? res.data : (res.data.projects || []);
};

export const getProject = async (id: number): Promise<Project> => {
  const res = await api.get(`/projects/${id}`);
  return res.data;
};

export const createProject = async (data: { name: string; key: string; description?: string }): Promise<Project> => {
  const res = await api.post('/projects', data);
  return res.data;
};

export const updateProject = async (id: number, data: { name?: string; description?: string; statusId?: number; priorityId?: number }): Promise<Project> => {
  const res = await api.put(`/projects/${id}`, data);
  return res.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

export const addProjectMember = async (projectId: number, userId: number, role: string = 'MEMBER') => {
  const res = await api.post(`/projects/${projectId}/members`, { userId, role });
  return res.data;
};

// ==========================================
// 🏃 Sprints API
// ==========================================
export const getSprints = async (projectId?: number): Promise<Sprint[]> => {
  const res = await api.get('/sprints', { params: projectId ? { projectId } : {} });
  return Array.isArray(res.data) ? res.data : (res.data.sprints || []);
};

export const createSprint = async (data: { name: string; goal?: string; projectId: number; startDate?: string; endDate?: string }): Promise<Sprint> => {
  const res = await api.post('/sprints', data);
  return res.data;
};

export const updateSprint = async (id: number, data: { name?: string; goal?: string; status?: string }): Promise<Sprint> => {
  const res = await api.put(`/sprints/${id}`, data);
  return res.data;
};

// ==========================================
// 🎯 Issues API
// ==========================================
export const getIssues = async (filters?: {
  projectId?: number;
  sprintId?: number;
  assigneeId?: number;
  authorId?: number;
  search?: string;
  statusId?: number;
  typeId?: number;
}): Promise<Issue[]> => {
  const params: any = {};
  if (filters?.projectId) params.projectId = filters.projectId;
  if (filters?.sprintId) params.sprintId = filters.sprintId;
  if (filters?.assigneeId) params.assigneeId = filters.assigneeId;
  if (filters?.authorId) params.authorId = filters.authorId;
  if (filters?.search) params.search = filters.search;
  if (filters?.statusId) params.statusId = filters.statusId;
  if (filters?.typeId) params.typeId = filters.typeId;

  const res = await api.get('/issues', { params });
  return Array.isArray(res.data) ? res.data : (res.data.issues || []);
};

export const getIssue = async (id: number): Promise<Issue> => {
  const res = await api.get(`/issues/${id}`);
  return res.data;
};

export const createIssue = async (data: {
  title: string;
  description?: string;
  projectId: number;
  sprintId?: number;
  assigneeId?: number;
  priorityId?: number;
  statusId?: number;
  typeId?: number;
  customFields?: any;
}): Promise<Issue> => {
  const res = await api.post('/issues', data);
  return res.data;
};

export const updateIssue = async (id: number, data: Partial<Issue>): Promise<Issue> => {
  const res = await api.put(`/issues/${id}`, data);
  return res.data;
};

export const deleteIssue = async (id: number): Promise<void> => {
  await api.delete(`/issues/${id}`);
};

export const toggleLikeIssue = async (issueId: number): Promise<{ message: string; isLiked: boolean; likesCount: number }> => {
  const res = await api.post('/issues/toggle-like', { issueId });
  return res.data;
};

// ==========================================
// 💬 Comments API
// ==========================================
export const getComments = async (issueId: number): Promise<Comment[]> => {
  const res = await api.get(`/comments/issue/${issueId}`);
  return Array.isArray(res.data) ? res.data : (res.data.comments || []);
};

export const createComment = async (issueId: number, content: string, parentId?: number): Promise<Comment> => {
  const res = await api.post('/comments', { issueId, content, parentId });
  return res.data;
};

export const deleteComment = async (id: number): Promise<void> => {
  await api.delete(`/comments/${id}`);
};

export const addCommentReaction = async (commentId: number, emoji: string) => {
  const res = await api.post(`/comments/${commentId}/reactions`, { emoji });
  return res.data;
};

// ==========================================
// ⏱️ Worklogs API
// ==========================================
export const getWorklogs = async (issueId?: number): Promise<Worklog[]> => {
  const url = issueId ? `/worklogs?issueId=${issueId}` : '/worklogs';
  const res = await api.get(url);
  return Array.isArray(res.data) ? res.data : (res.data.worklogs || []);
};

export const createWorklog = async (data: {
  issueId: number;
  timeSpent?: number;
  timeSpentHours?: number;
  description?: string;
  startedAt?: string;
}): Promise<Worklog> => {
  const res = await api.post('/worklogs', data);
  return res.data;
};

// ==========================================
// 🏷️ Custom Fields API
// ==========================================
export const getCustomFields = async (): Promise<CustomFieldDefinition[]> => {
  const res = await api.get('/custom-fields');
  return Array.isArray(res.data) ? res.data : [];
};

export const createCustomField = async (data: {
  key: string;
  name: string;
  fieldType: string;
  description?: string;
  defaultValue?: string;
  isRequired?: boolean;
  projectId?: number;
}): Promise<CustomFieldDefinition> => {
  const res = await api.post('/custom-fields', data);
  return res.data;
};

export const deleteCustomField = async (id: number): Promise<void> => {
  await api.delete(`/custom-fields/${id}`);
};

export default api;
