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

export const uploadApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ success: boolean; file_url: string; file_type: string }>('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const notificationsApi = {
  list: (params?: { limit?: number }) =>
    api.get<{ success: boolean; items: Array<{ id: string; type: string; title: string; body?: string | null; readAt?: string | null; createdAt: string }> }>('/notifications', { params }),
  unreadCount: () => api.get<{ success: boolean; count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<{ success: boolean }>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ success: boolean }>('/notifications/mark-all-read'),
};
