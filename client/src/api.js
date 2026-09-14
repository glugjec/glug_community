import axios from 'axios';
import { discussionsCache } from './utils/discussionsCache.js';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('glug_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  get: (url, config = {}) => client.get(url, config),
  post: (url, data, config = {}) => client.post(url, data, config),
  put: (url, data, config = {}) => client.put(url, data, config),
  delete: (url, config = {}) => client.delete(url, config),
};

export const authApi = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  sendOtp: (data) => client.post('/auth/send-otp', data),
  verifyOtp: (data) => client.post('/auth/verify-otp', data),
  checkUsername: (username) => client.get('/auth/check-username', { params: { username } }),
  googleLogin: (credential) => client.post('/auth/google', { credential }),
  completeGoogleAuth: (data) => client.post('/auth/google/complete', data),
  forgotPassword: (data) => client.post('/auth/forgot-password', data),
  resetPassword: (data) => client.post('/auth/reset-password', data),
  getMe: () => client.get('/auth/me'),
  updateProfile: (data) => client.put('/auth/me', data),
};

export const postsApi = {
  list: (params = {}) => client.get('/posts', { params }),
  feed: (params = {}) => client.get('/posts/feed', { params }),
  getStats: () => client.get('/posts/meta/stats'),
  get: (id) => client.get(`/posts/${id}`),
  create: async (data) => {
    const res = await client.post('/posts', data);
    discussionsCache.invalidate();
    return res;
  },
  update: async (id, data) => {
    const res = await client.put(`/posts/${id}`, data);
    discussionsCache.invalidate();
    return res;
  },
  delete: async (id) => {
    const res = await client.delete(`/posts/${id}`);
    discussionsCache.invalidate();
    return res;
  },
  vote: async (id, value) => {
    const res = await client.post(`/posts/${id}/vote`, { value });
    if (res?.post) {
      discussionsCache.updatePostInCaches(id, (p) => ({
        ...p,
        voteScore: res.post.voteScore,
        userVote: res.userVote,
      }));
    } else {
      discussionsCache.invalidate();
    }
    return res;
  },
  bookmark: async (id) => {
    const res = await client.post(`/posts/${id}/bookmark`);
    if (typeof res?.isBookmarked === 'boolean') {
      discussionsCache.updatePostInCaches(id, (p) => ({
        ...p,
        isBookmarked: res.isBookmarked,
      }));
    } else {
      discussionsCache.invalidate();
    }
    return res;
  },
  pin: async (id) => {
    const res = await client.put(`/posts/${id}/pin`);
    discussionsCache.invalidate();
    return res;
  },
  lock: async (id) => {
    const res = await client.put(`/posts/${id}/lock`);
    discussionsCache.invalidate();
    return res;
  },
  addComment: async (id, data) => {
    const res = await client.post(`/posts/${id}/comments`, data);
    discussionsCache.updatePostInCaches(id, (p) => ({
      ...p,
      commentCount: (p.commentCount || 0) + 1,
    }));
    return res;
  },
  deleteComment: async (postId, commentId) => {
    const res = await client.delete(`/posts/${postId}/comments/${commentId}`);
    discussionsCache.updatePostInCaches(postId, (p) => ({
      ...p,
      commentCount: Math.max(0, (p.commentCount || 1) - 1),
    }));
    return res;
  },
  voteComment: (postId, commentId, value) => client.post(`/posts/${postId}/comments/${commentId}/vote`, { value }),
  report: (id, reason) => client.post(`/posts/${id}/report`, { reason }),
  reportComment: (postId, commentId, reason) => client.post(`/posts/${postId}/comments/${commentId}/report`, { reason }),
};

export const usersApi = {
  getProfile: (id) => client.get(`/users/${id}`),
  getPosts: (id) => client.get(`/users/${id}/posts`),
  getTerminalState: () => client.get('/users/me/terminal'),
  saveTerminalState: (state) => client.put('/users/me/terminal', state),
  search: (query) => client.get('/users/search', { params: { q: query } }),
};

export const resourcesApi = {
  list: () => client.get('/resources'),
  create: (data) => client.post('/resources', data),
  update: (id, data) => client.put(`/resources/${id}`, data),
  delete: (id) => client.delete(`/resources/${id}`),
};

export const membersApi = {
  getTeam: () => client.get('/users/team'),
};

export const chatApi = {
  getUnreadCount: () => client.get('/chat/unread-count'),
  getConversations: () => client.get('/chat/conversations'),
  getOrCreateWithUser: (userId) => client.get(`/chat/conversations/with/${userId}`),
  getMessages: (conversationId) => client.get(`/chat/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, text) => client.post(`/chat/conversations/${conversationId}/messages`, { text }),
  markRead: (conversationId) => client.put(`/chat/conversations/${conversationId}/read`),
  reportMessage: (messageId, reason) => client.post(`/chat/messages/${messageId}/report`, { reason }),
};

export const adminApi = {
  getStats: () => client.get('/admin/stats'),
  getUsers: (params = {}) => client.get('/admin/users', { params }),
  updateUserRole: (id, role) => client.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => client.delete(`/admin/users/${id}`),
  banUser: (id, data) => client.put(`/admin/users/${id}/ban`, data),
  unbanUser: (id, data) => client.put(`/admin/users/${id}/unban`, data),
  getTeamMembers: () => client.get('/admin/team'),
  updateTeamPosition: (userId, data) => client.put(`/admin/team/${userId}`, data),
  removeTeamMember: (userId) => client.delete(`/admin/team/${userId}`),
  getPosts: (params = {}) => client.get('/admin/posts', { params }),
  togglePinPost: (id) => client.put(`/admin/posts/${id}/pin`),
  toggleLockPost: (id) => client.put(`/admin/posts/${id}/lock`),
  deletePost: (id) => client.delete(`/admin/posts/${id}`),
  deleteComment: (id) => client.delete(`/admin/comments/${id}`),
  // Moderation Hub
  getFlaggedContent: (params = {}) => client.get('/admin/moderation/flagged', { params }),
  restoreFlaggedPost: (id) => client.put(`/admin/moderation/posts/${id}/restore`),
  restoreFlaggedComment: (id) => client.put(`/admin/moderation/comments/${id}/restore`),
  deleteFlaggedPost: (id) => client.delete(`/admin/moderation/posts/${id}`),
  deleteFlaggedComment: (id) => client.delete(`/admin/moderation/comments/${id}`),
  getReports: (params = {}) => client.get('/admin/moderation/reports', { params }),
  overrideReport: (id, data) => client.put(`/admin/moderation/reports/${id}/override`, data),
  getBannedUsers: () => client.get('/admin/moderation/banned-users'),
  getModerationLogs: (params = {}) => client.get('/admin/moderation/logs', { params }),
};

export const uploadApi = {
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return client.post('/upload/avatar', formData);
  },
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return client.post('/upload', formData);
  },
};

export const notificationsApi = {
  list: () => client.get('/notifications'),
  unreadCount: () => client.get('/notifications/unread-count'),
  markRead: (id) => client.put(`/notifications/${id}/read`),
  markAllRead: () => client.put('/notifications/read-all'),
};

export default api;


