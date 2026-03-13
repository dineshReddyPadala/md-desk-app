import api from './client';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ success: boolean; user: unknown; token: string }>('/auth/login', { email, password }),
  me: () => api.get<{ success: boolean; user: unknown }>('/auth/me'),
};

export const dashboardApi = {
  summary: () =>
    api.get<{
      success: boolean;
      total: number;
      pending: number;
      resolved: number;
      highPriority: number;
      received: number;
      underReview: number;
      inProgress: number;
    }>('/admin/dashboard/summary'),
  regionStats: () => api.get<{ success: boolean; stats: { city: string; count: number }[] }>('/admin/dashboard/region-stats'),
  productStats: () => api.get<{ success: boolean; stats: { product: string; count: number }[] }>('/admin/dashboard/product-stats'),
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
  updateStatus: (id: string, status: string) =>
    api.put<{ success: boolean; complaint: unknown }>(`/admin/complaints/${id}/status`, { status }),
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
