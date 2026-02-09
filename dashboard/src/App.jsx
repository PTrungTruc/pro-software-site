import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'sonner';

// Layouts
import AdminLayout from './pages/admin/AdminLayout';
import PublicLayout from './pages/public/PublicLayout';

// Admin Pages
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/admin/Login';
import DashboardPage from './pages/admin/Dashboard';
import SoftwareAdminPage from './pages/admin/Software';
import BlogAdminPage from './pages/admin/Blog';
import RequestsAdminPage from './pages/admin/Requests';
import CategoriesAdminPage from './pages/admin/Categories';
import ChatAdminPage from './pages/admin/Chat';
import CoursesAdminPage from './pages/admin/Courses'; // ĐÃ CẬP NHẬT
import ExamsAdminPage from './pages/admin/Exams';
import SubmissionsAdminPage from './pages/admin/Submissions';

// Public Pages
import HomePage from './pages/public/HomePage';
import SoftwareListPage from './pages/public/SoftwareListPage';
import BlogListPage from './pages/public/BlogListPage';
import BlogPostPage from './pages/public/BlogPostPage';
import RequestPage from './pages/public/RequestPage';
import CourseListPage from './pages/public/CourseListPage'; // ĐÃ CẬP NHẬT
import ExamListPage from './pages/public/ExamListPage';

function AppRoutes() {
  const { isLoading } = useAuth();
  if (isLoading) { return <div className="flex h-screen items-center justify-center text-xl font-semibold">Đang tải...</div>; }
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="software" element={<SoftwareListPage />} />
        <Route path="software/category/:slug" element={<SoftwareListPage />} />
        <Route path="blog" element={<BlogListPage />} />
        <Route path="blog/category/:slug" element={<BlogListPage />} />
        <Route path="blog/:slug" element={<BlogPostPage />} />
        <Route path="request" element={<RequestPage />} />
        <Route path="courses" element={<CourseListPage />} />
        <Route path="courses/category/:slug" element={<CourseListPage />} />
        <Route path="exams" element={<ExamListPage />} />
        <Route path="exams/category/:slug" element={<ExamListPage />} />
      </Route>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="software" element={<SoftwareAdminPage />} />
        <Route path="blog" element={<BlogAdminPage />} />
        <Route path="courses" element={<CoursesAdminPage />} />
        <Route path="exams" element={<ExamsAdminPage />} />
        <Route path="submissions" element={<SubmissionsAdminPage />} />
        <Route path="requests" element={<RequestsAdminPage />} />
        <Route path="categories" element={<CategoriesAdminPage />} />
        <Route path="chat" element={<ChatAdminPage />} />
      </Route>
    </Routes>
  );
}

function App() { return ( <BrowserRouter><AuthProvider><AppRoutes/><Toaster position="top-right" richColors /></AuthProvider></BrowserRouter> ) }
export default App;