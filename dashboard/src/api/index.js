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
export const getAdminStats = () => apiClient.get('/stats');

// THUMBNAIL UPLOAD (Admin) - HÀM CÒN THIẾU ĐÃ ĐƯỢC THÊM
export const uploadThumbnail = (formData) => apiClient.post('/upload-thumbnail', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// SOFTWARE (Admin)
export const getAdminSoftware = () => apiClient.get('/software');
export const addSoftware = (data) => apiClient.post('/software', data);
export const updateSoftware = (id, data) => apiClient.put(`/software/${id}`, data);
export const deleteSoftware = (id) => apiClient.delete(`/software/${id}`);

// COURSES (Admin)
export const getAdminCourses = () => apiClient.get('/courses');
export const addCourse = (data) => apiClient.post('/courses', data);
export const updateCourse = (id, data) => apiClient.put(`/courses/${id}`, data);
export const deleteCourse = (id) => apiClient.delete(`/courses/${id}`);

// EXAMS (Admin)
export const getAdminExams = () => apiClient.get('/exams');
export const addExam = (data) => apiClient.post('/exams', data);
export const updateExam = (id, data) => apiClient.put(`/exams/${id}`, data);
export const deleteExam = (id) => apiClient.delete(`/exams/${id}`);

// BLOG (Admin)
export const getAdminBlogPosts = () => apiClient.get('/blog');
export const addBlogPost = (data) => apiClient.post('/blog', data);
export const updateBlogPost = (slug, data) => apiClient.put(`/blog/${slug}`, data);
export const deleteBlogPost = (slug) => apiClient.delete(`/blog/${slug}`);

// REQUESTS (Admin)
export const getAdminRequests = () => apiClient.get('/requests');
export const updateRequestStatus = (id, status) => apiClient.put(`/requests/${id}`, { status });
export const deleteRequest = (id) => apiClient.delete(`/requests/${id}`);

// CATEGORIES (Admin)
export const getSoftwareCategories = () => apiClient.get('/software_categories');
export const addSoftwareCategory = (data) => apiClient.post('/software_categories', data);
export const deleteSoftwareCategory = (id) => apiClient.delete(`/software_categories/${id}`);
export const getBlogCategories = () => apiClient.get('/blog_categories');
export const addBlogCategory = (data) => apiClient.post('/blog_categories', data);
export const deleteBlogCategory = (id) => apiClient.delete(`/blog_categories/${id}`);
export const getCourseCategories = () => apiClient.get('/course_categories');
export const addCourseCategory = (data) => apiClient.post('/course_categories', data);
export const deleteCourseCategory = (id) => apiClient.delete(`/course_categories/${id}`);
export const getExamCategories = () => apiClient.get('/exam_categories');
export const addExamCategory = (data) => apiClient.post('/exam_categories', data);
export const deleteExamCategory = (id) => apiClient.delete(`/exam_categories/${id}`);
export const getAdminSubmissions = () => apiClient.get('/submissions');
export const deleteSubmission = (id) => apiClient.delete(`/submissions/${id}`);


// ================= PUBLIC API =================
export const getPublicStats = () => publicApiClient.get('/stats');
export const getPublicSoftware = () => publicApiClient.get('/software');
export const getPublicBlogPosts = () => publicApiClient.get('/blog');
export const getPublicBlogPost = (slug) => publicApiClient.get(`/blog/${slug}`);
export const submitRequest = (data) => publicApiClient.post('/request', data);
export const getPublicSoftwareCategories = () => publicApiClient.get('/software_categories');
export const getPublicBlogCategories = () => publicApiClient.get('/blog_categories');
export const getPublicCourses = () => publicApiClient.get('/courses');
export const getPublicCourseCategories = () => publicApiClient.get('/course_categories');
export const getPublicExams = () => publicApiClient.get('/exams');
export const getPublicExamCategories = () => publicApiClient.get('/exam_categories');
export const submitWork = (formData) => publicApiClient.post('/submissions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getComments = (contentId) => publicApiClient.get(`/comments/${contentId}`);
export const postComment = (contentId, data) => publicApiClient.post(`/comments/${contentId}`, data);
export const uploadImages = (formData) => apiClient.post('/upload-images', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});