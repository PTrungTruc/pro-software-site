import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const getDownloadUrl = (fileName) => `${API_URL}/downloads/${fileName}`;

const apiClient = axios.create({ baseURL: `${API_URL}/api`, withCredentials: true });
const publicApiClient = axios.create({ baseURL: `${API_URL}/public` });

// AUTH (Admin)
export const login = (credentials) => apiClient.post('/login', credentials);
export const logout = () => apiClient.post('/logout');
export const getAuthStatus = () => apiClient.get('/auth-status');

// STATS (Admin)
export const getStats = () => apiClient.get('/stats');

// SOFTWARE (Admin)
export const getAdminSoftware = () => apiClient.get('/software');
export const addSoftware = (formData) => apiClient.post('/software', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteSoftware = (id) => apiClient.delete(`/software/${id}`);

// BLOG (Admin)
export const getAdminBlogPosts = () => apiClient.get('/blog');
export const addBlogPost = (data) => apiClient.post('/blog', data);
export const deleteBlogPost = (slug) => apiClient.delete(`/blog/${slug}`);

// REQUESTS (Admin) - CÁC HÀM CÒN THIẾU NẰM Ở ĐÂY
export const getAdminRequests = () => apiClient.get('/requests');
export const updateRequestStatus = (id, status) => apiClient.put(`/requests/${id}`, { status });
export const deleteRequest = (id) => apiClient.delete(`/requests/${id}`);

// ================= PUBLIC API =================
export const getPublicSoftware = () => publicApiClient.get('/software');
export const getPublicBlogPosts = () => publicApiClient.get('/blog');
export const getPublicBlogPost = (slug) => publicApiClient.get(`/blog/${slug}`);
export const submitRequest = (data) => publicApiClient.post('/request', data);