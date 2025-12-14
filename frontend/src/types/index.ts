// User types
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  dateJoined: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  description?: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  user: User;
  organization: Organization;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
}

// Project types
export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionRate: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate?: string;
  organization: Organization;
  stats: ProjectStats;
  createdAt: string;
  updatedAt: string;
}

// Task types
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: User;
  project: Project;
  dueDate?: string;
  order: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

// Comment types
export interface TaskComment {
  id: string;
  content: string;
  author: User;
  task: Task;
  createdAt: string;
  updatedAt: string;
}

// Form input types
export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  email: string;
  password: string;
  fullName?: string;
}

export interface CreateProjectInput {
  organizationId: string;
  name: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateProjectInput {
  id: string;
  name?: string;
  description?: string;
  status?: ProjectStatus;
  dueDate?: string;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  order?: number;
}

export interface CreateCommentInput {
  taskId: string;
  content: string;
}

// Auth context type
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
