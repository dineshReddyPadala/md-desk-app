import api from './client';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ success: boolean; user: unknown; token: string }>('/auth/login', { email, password }),
  me: () => api.get<{ success: boolean; user: unknown }>('/auth/me'),
  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message?: string }>('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post<{ success: boolean; message?: string }>('/auth/reset-password', { token, newPassword }),
};

export const dashboardApi = {
  summary: () =>
    api.get<{
      success: boolean;
      total: number;
      pending: number;
      resolved: number;
      highPriority: number;
      mediumPriority: number;
      lowPriority: number;
      received: number;
      underReview: number;
      inProgress: number;
      totalClients?: number;
      ongoingProjects?: number;
      activitySummary?: { complaintsLast7Days: number; projectsUpdatedLast7Days: number };
    }>('/admin/dashboard/summary'),
  regionStats: () => api.get<{ success: boolean; stats: { city: string; count: number }[] }>('/admin/dashboard/region-stats'),
  projectComplaintStats: () =>
    api.get<{ success: boolean; stats: { project: string; projectId: string; count: number }[] }>('/admin/dashboard/project-complaint-stats'),
  statusStats: () =>
    api.get<{ success: boolean; stats: { status: string; label: string; count: number }[] }>('/admin/dashboard/status-stats'),
  creationStats: (params?: { days?: number }) =>
    api.get<{ success: boolean; stats: { date: string; count: number }[] }>('/admin/dashboard/creation-stats', { params }),
};

export const complaintsApi = {
  list: (params?: { page?: number; limit?: number; status?: string; priority?: string; city?: string }) =>
    api.get<{ success: boolean; items: unknown[]; total: number; page: number; totalPages: number }>('/admin/complaints', { params }),
  highPriority: (params?: { page?: number; limit?: number }) =>
    api.get<{ success: boolean; items: unknown[] }>('/admin/complaints/high-priority', { params }),
  getById: (id: string) => api.get<{ success: boolean; complaint: unknown }>(`/complaints/${id}`),
  updateStatus: (id: string, payload: { status: string; priority?: string; comment?: string }) =>
    api.put<{ success: boolean; complaint: unknown }>(`/admin/complaints/${id}/status`, payload),
};

export const messagesApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<{ success: boolean; items: unknown[]; total: number }>('/messages/admin', { params }),
  getById: (id: string) => api.get<{ success: boolean; message: unknown }>(`/messages/admin/${id}`),
  reply: (id: string, reply: string) => api.post<{ success: boolean; message: unknown }>(`/messages/admin/${id}/reply`, { reply }),
};

export type ProductDto = { id: string; name: string; description?: string | null; imageUrl?: string | null };
export type DealerDto = { id: string; name: string; city?: string | null; phone?: string | null; imageUrl?: string | null; locationLat?: number | null; locationLong?: number | null };

export const productsApi = {
  list: () => api.get<{ success: boolean; products: ProductDto[] }>('/products'),
  getById: (id: string) => api.get<{ success: boolean; product: ProductDto }>(`/products/${id}`),
  create: (data: { name: string; description?: string; imageUrl?: string }) =>
    api.post<{ success: boolean; product: ProductDto }>('/admin/products', data),
  update: (id: string, data: Partial<{ name: string; description: string; imageUrl: string }>) =>
    api.put<{ success: boolean; product: ProductDto }>(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/admin/products/${id}`),
};

export const dealersApi = {
  list: (city?: string) => api.get<{ success: boolean; dealers: DealerDto[] }>('/dealers', { params: city ? { city } : {} }),
  getById: (id: string) => api.get<{ success: boolean; dealer: DealerDto }>(`/dealers/${id}`),
  create: (data: { name: string; city?: string; phone?: string; imageUrl?: string; locationLat?: number; locationLong?: number }) =>
    api.post<{ success: boolean; dealer: DealerDto }>('/admin/dealers', data),
  update: (id: string, data: Partial<{ name: string; city: string; phone: string; imageUrl: string; locationLat: number; locationLong: number }>) =>
    api.put<{ success: boolean; dealer: DealerDto }>(`/admin/dealers/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/admin/dealers/${id}`),
  downloadTemplate: () => api.get('/admin/dealers/template', { responseType: 'blob' }),
  bulkUpload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ success: boolean; created: number; errors?: { row: number; message: string }[]; dealers?: DealerDto[] }>('/admin/dealers/bulk-upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export type ClientDto = { id: string; name: string; phone?: string | null; email?: string | null; company?: string | null; createdAt: string; updatedAt: string };
export type ProjectAssigneeDto = { employee: { id: string; name: string; email: string } };
export type ProjectDto = {
  id: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  documentUrl?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  clientId?: string | null;
  client?: ClientDto | null;
  assignees?: ProjectAssigneeDto[];
  createdAt: string;
  updatedAt: string;
};

export const clientsApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<{ success: boolean; clients: ClientDto[]; total: number; page: number; totalPages: number }>('/admin/clients', { params }),
  getById: (id: string) => api.get<{ success: boolean; client: ClientDto }>(`/admin/clients/${id}`),
  create: (data: { name: string; email: string; phone?: string; company?: string }) =>
    api.post<{ success: boolean; client: ClientDto }>('/admin/clients', data),
  update: (id: string, data: Partial<{ name: string; phone: string; email: string; company: string }>) =>
    api.put<{ success: boolean; client: ClientDto }>(`/admin/clients/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/admin/clients/${id}`),
  bulkUpload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ success: boolean; created: number; errors?: { row: number; message: string }[]; clients?: ClientDto[] }>('/admin/clients/bulk-upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadTemplate: () => api.get('/admin/clients/template', { responseType: 'blob' }),
};

export const projectsApi = {
  list: (params?: { status?: string; clientId?: string; page?: number; limit?: number }) =>
    api.get<{ success: boolean; projects: ProjectDto[]; total: number; page: number; totalPages: number }>('/admin/projects', { params }),
  getById: (id: string) => api.get<{ success: boolean; project: ProjectDto }>(`/admin/projects/${id}`),
  create: (data: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    documentUrl?: string;
    status?: string;
    clientId?: string;
    assigneeIds?: string[];
  }) => api.post<{ success: boolean; project: ProjectDto }>('/admin/projects', data),
  update: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      startDate: string;
      endDate: string;
      documentUrl: string;
      status: string;
      clientId: string;
      assigneeIds: string[];
    }>
  ) => api.put<{ success: boolean; project: ProjectDto }>(`/admin/projects/${id}`, data),
  updateStatus: (id: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') =>
    api.patch<{ success: boolean; project: ProjectDto }>(`/admin/projects/${id}/status`, { status }),
  delete: (id: string) => api.delete<{ success: boolean }>(`/admin/projects/${id}`),
  downloadTemplate: () => api.get('/admin/projects/template', { responseType: 'blob' }),
  bulkUpload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ success: boolean; created: number; errors?: { row: number; message: string }[]; projects?: ProjectDto[] }>('/admin/projects/bulk-upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export type UploadScope = 'media' | 'image' | 'chat';

export const uploadApi = {
  upload: (file: File, options?: { scope?: UploadScope }) => {
    const form = new FormData();
    form.append('file', file);
    const scope = options?.scope ?? 'media';
    return api.post<{ success: boolean; file_url: string; file_type: string }>('/upload', form, {
      params: { scope },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export type ChatMessageDto = {
  id: string;
  roomId: string;
  senderId: string;
  kind: 'TEXT' | 'FILE' | 'VOICE';
  body?: string | null;
  attachmentUrl?: string | null;
  attachmentMime?: string | null;
  createdAt: string;
  sender?: { id: string; name: string; role?: string };
  deliveryStatus?: 'delivered' | 'seen' | null;
};

export type ChatRoomDto = {
  id: string;
  type: 'PROJECT_GROUP' | 'DIRECT';
  projectId?: string | null;
  project?: { id: string; name: string; status: string } | null;
  participants?: Array<{ userId: string; user: { id: string; name: string; role: string; email: string } }>;
};

export type ChatAdminProjectRow = {
  projectId: string;
  projectName: string;
  status: string;
  client: { id: string; name: string; email?: string | null } | null;
  roomId: string | null;
  lastMessage: {
    id: string;
    body?: string | null;
    kind: string;
    createdAt: string;
    sender?: { id: string; name: string };
  } | null;
};

export const chatApi = {
  rooms: () => api.get<{ success: boolean; rooms: unknown[] }>('/chat/rooms'),
  contacts: () =>
    api.get<{ success: boolean; users: Array<{ id: string; name: string; role: string; email: string }> }>('/chat/contacts'),
  projectRoom: (projectId: string) =>
    api.get<{ success: boolean; room: ChatRoomDto }>(`/chat/projects/${projectId}/room`),
  direct: (otherUserId: string) =>
    api.post<{ success: boolean; room: ChatRoomDto }>('/chat/direct', { otherUserId }),
  messages: (roomId: string, params?: { before?: string; limit?: number }) =>
    api.get<{ success: boolean; messages: ChatMessageDto[]; nextBefore: string | null }>(`/chat/rooms/${roomId}/messages`, {
      params,
    }),
  send: (
    roomId: string,
    body: { kind?: 'TEXT' | 'FILE' | 'VOICE'; body?: string; attachmentUrl?: string; attachmentMime?: string }
  ) => api.post<{ success: boolean; message: ChatMessageDto }>(`/chat/rooms/${roomId}/messages`, body),
  markRead: (roomId: string) => api.post<{ success: boolean }>(`/chat/rooms/${roomId}/read`),
  adminProjects: () => api.get<{ success: boolean; items: ChatAdminProjectRow[] }>('/chat/admin/projects'),
};

export type EmployeeDto = { id: string; name: string; email: string; mobile: string; designation?: string | null; createdAt: string; updatedAt: string };

export const employeesApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<{ success: boolean; items: EmployeeDto[]; total: number; page: number; totalPages: number }>('/admin/employees', { params }),
  getById: (id: string) => api.get<{ success: boolean; employee: EmployeeDto }>(`/admin/employees/${id}`),
  create: (data: { name: string; email: string; mobile: string; designation?: string }) =>
    api.post<{ success: boolean; employee: EmployeeDto }>('/admin/employees', data),
  update: (id: string, data: Partial<{ name: string; email: string; mobile: string; designation: string }>) =>
    api.put<{ success: boolean; employee: EmployeeDto }>(`/admin/employees/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/admin/employees/${id}`),
};

export const notificationsApi = {
  list: (params?: { limit?: number }) =>
    api.get<{ success: boolean; items: Array<{ id: string; type: string; title: string; body?: string | null; readAt?: string | null; createdAt: string }> }>('/notifications', { params }),
  unreadCount: () => api.get<{ success: boolean; count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<{ success: boolean }>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ success: boolean }>('/notifications/mark-all-read'),
};
