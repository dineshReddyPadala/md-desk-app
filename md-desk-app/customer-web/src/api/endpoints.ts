import api from './client';

export const authApi = {
  sendOtp: (email: string) =>
    api.post<{ success: boolean; message?: string }>('/auth/send-otp', { email }),
  register: (data: { name: string; email: string; otp: string; password: string; confirmPassword: string; phone?: string; city?: string; company?: string }) =>
    api.post<{ success: boolean; user: unknown; token: string }>('/auth/register', data),
  login: (emailOrPhone: string, password: string) => {
    const isEmail = emailOrPhone.includes('@');
    const body = isEmail ? { email: emailOrPhone, password } : { phone: emailOrPhone, password };
    return api.post<{ success: boolean; user: unknown; token: string }>('/auth/login', body);
  },
  me: () => api.get<{ success: boolean; user: unknown }>('/auth/me'),
  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message?: string }>('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post<{ success: boolean; message?: string }>('/auth/reset-password', { token, newPassword }),
  sendLoginOtp: (email: string) =>
    api.post<{ success: boolean; message?: string }>('/auth/send-login-otp', { email }),
  verifyLoginOtp: (email: string, otp: string) =>
    api.post<{ success: boolean; user: unknown; token: string }>('/auth/verify-login-otp', { email, otp }),
};

export const complaintsApi = {
  create: (data: FormData | Record<string, unknown>) => {
    if (data instanceof FormData) {
      return api.post<{ success: boolean; complaint_id: string; id: string }>('/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post<{ success: boolean; complaint_id: string; id: string }>('/complaints', data);
  },
  myList: (params?: { page?: number; limit?: number; status?: string; priority?: string }) =>
    api.get<{ success: boolean; items: unknown[]; total: number; page: number; totalPages: number }>('/complaints/my', { params }),
  getById: (id: string) => api.get<{ success: boolean; complaint: unknown }>(`/complaints/${id}`),
  trackByComplaintId: (complaintId: string) =>
    api.get<{ success: boolean; complaint: unknown }>(`/complaints/track/${encodeURIComponent(complaintId)}`),
};

export const messagesApi = {
  create: (subject: string, message: string) =>
    api.post('/messages', { subject, message }),
  myList: (params?: { page?: number; limit?: number }) =>
    api.get<{ success: boolean; items: Array<{ id: string; subject: string; message: string; adminReply?: string; repliedAt?: string; createdAt: string }>; total: number; page: number; totalPages: number }>('/messages/my', { params }),
};

export const productsApi = {
  list: () => api.get<{ success: boolean; products: unknown[] }>('/products'),
};

export const dealersApi = {
  list: (city?: string) =>
    api.get<{ success: boolean; dealers: unknown[] }>('/dealers', { params: city ? { city } : {} }),
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
};

export const dashboardApi = {
  customerSummary: () =>
    api.get<{
      success: boolean;
      activeProjects: Array<{ id: string; name: string; status: string; startDate?: string | null; endDate?: string | null; updatedAt: string }>;
      complaintStats: { RECEIVED: number; UNDER_REVIEW: number; IN_PROGRESS: number; RESOLVED: number };
    }>('/dashboard/customer-summary'),
};

export const notificationsApi = {
  list: (params?: { limit?: number }) =>
    api.get<{ success: boolean; items: Array<{ id: string; type: string; title: string; body?: string | null; readAt?: string | null; createdAt: string }> }>('/notifications', { params }),
  unreadCount: () => api.get<{ success: boolean; count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<{ success: boolean }>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ success: boolean }>('/notifications/mark-all-read'),
};
