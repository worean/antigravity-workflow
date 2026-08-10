import axios from 'axios';
import type { User, Project, Issue, Comment, Sprint, Worklog, HealthStatus, CustomFieldDefinition } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authorization 인터셉터
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

// Auth
export const loginEmail = async (email: string, password?: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data; // { token, user }
};

export const registerUser = async (email: string, name: string, password?: string) => {
  const res = await api.post('/users/create', { email, name, password });
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

// Projects
export const getProjects = async (): Promise<Project[]> => {
  const res = await api.get('/projects');
  return Array.isArray(res.data) ? res.data : (res.data.projects || []);
};

export const getProject = async (id: number): Promise<Project> => {
  const res = await api.get(`/projects/${id}`);
  return res.data;
};

export const createProject = async (data: { name: string; key: string; description?: string }): Promise<Project> => {
  const res = await api.post('/projects/create', data);
  return res.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

// Issues
export const getIssues = async (filters?: {
  projectId?: number;
  assigneeId?: number;
  authorId?: number;
  search?: string;
  statusId?: number;
  typeId?: number;
}): Promise<Issue[]> => {
  const params: any = {};
  if (filters?.projectId) params.projectId = filters.projectId;
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
  assigneeId?: number;
  priorityId?: number;
  statusId?: number;
  typeId?: number;
  customFields?: any;
}): Promise<Issue> => {
  const res = await api.post('/issues/create', data);
  return res.data;
};

export const updateIssue = async (id: number, data: Partial<Issue>): Promise<Issue> => {
  const res = await api.put(`/issues/update/${id}`, data);
  return res.data;
};

export const deleteIssue = async (id: number): Promise<void> => {
  await api.delete(`/issues/delete/${id}`);
};

export const toggleLikeIssue = async (issueId: number): Promise<{ message: string; isLiked: boolean; likesCount: number }> => {
  const res = await api.post('/issues/toggle-like', { issueId });
  return res.data;
};

// Comments
export const getComments = async (issueId: number): Promise<Comment[]> => {
  const res = await api.get(`/comments/list/${issueId}`);
  return Array.isArray(res.data) ? res.data : (res.data.comments || []);
};

export const createComment = async (issueId: number, content: string): Promise<Comment> => {
  const res = await api.post('/comments/create', { issueId, content });
  return res.data;
};

export const deleteComment = async (id: number): Promise<void> => {
  await api.delete(`/comments/delete/${id}`);
};

// Custom Fields
export const getCustomFields = async (): Promise<CustomFieldDefinition[]> => {
  const res = await api.get('/custom-fields');
  return Array.isArray(res.data) ? res.data : [];
};

export const createCustomField = async (data: {
  name: string;
  key: string;
  fieldType: string;
  description?: string;
  defaultValue?: string;
  isRequired?: boolean;
  projectId?: number;
}): Promise<CustomFieldDefinition> => {
  const res = await api.post('/custom-fields/create', data);
  return res.data;
};

export const deleteCustomField = async (id: number): Promise<void> => {
  await api.delete(`/custom-fields/${id}`);
};

// Sprints
export const getSprints = async (projectId?: number): Promise<Sprint[]> => {
  const res = await api.get('/sprints', { params: projectId ? { projectId } : {} });
  return Array.isArray(res.data) ? res.data : (res.data.sprints || []);
};

export const createSprint = async (data: { name: string; goal?: string; projectId: number }): Promise<Sprint> => {
  const res = await api.post('/sprints/create', data);
  return res.data;
};

// Worklogs
export const getWorklogs = async (): Promise<Worklog[]> => {
  const res = await api.get('/worklogs');
  return Array.isArray(res.data) ? res.data : (res.data.worklogs || []);
};

export const createWorklog = async (data: { issueId: number; timeSpentMinutes: number; description?: string }): Promise<Worklog> => {
  const res = await api.post('/worklogs/create', data);
  return res.data;
};

export default api;
