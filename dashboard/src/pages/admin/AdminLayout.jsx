import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, HardDrive, Pencil, LogOut, Menu, X, Mail, Shapes, MessageSquare, BookOpen, ClipboardCheck, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/providers/theme-provider';
import { useState, useEffect } from 'react';
import { getAdminRequests } from '@/api';

const AdminLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [newRequestCount, setNewRequestCount] = useState(0);
    const [requestVersion, setRequestVersion] = useState(0);
    const { setTheme } = useTheme();
    setTheme("light", false);

    const fetchNewRequests = () => {
        getAdminRequests()
            .then(res => {
                const newRequests = res.data.filter(r => r.status === 'new');
                setNewRequestCount(newRequests.length);
                setRequestVersion(v => v + 1);
            })
            .catch(err => console.error("Failed to fetch requests", err));
    };

    useEffect(() => {
        fetchNewRequests();
        const interval = setInterval(fetchNewRequests, 30000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/admin/software", icon: HardDrive, label: "Phần Mềm" },
        { to: "/admin/courses", icon: BookOpen, label: "Giáo trình" }, // ĐÃ CẬP NHẬT
        { to: "/admin/exams", icon: ClipboardCheck, label: "Bài Test" },
        { to: "/admin/blog", icon: Pencil, label: "Blog" },
        { to: "/admin/submissions", icon: FileCheck2, label: "Bài Nộp" },
        { to: "/admin/requests", icon: Mail, label: "Yêu Cầu", count: newRequestCount },
        { to: "/admin/categories", icon: Shapes, label: "Chủ đề" },
        { to: "/admin/chat", icon: MessageSquare, label: "Chat" },
    ];
    const NavItem = ({ to, icon: Icon, label, onClick, count }) => (
        <NavLink to={to} onClick={onClick} className={({ isActive }) => `flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-blue-800 hover:text-white'}`}>
            <div className="flex items-center">
                <Icon className="w-5 h-5 mr-3" />
                <span>{label}</span>
            </div>
            {count > 0 && (
                <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">{count}</span>
            )}
        </NavLink>
    );

    const Sidebar = ({ onNavLinkClick }) => {
        const { user, logout } = useAuth();
        const navigate = useNavigate();
        return (
            <div className="flex flex-col w-64 h-full bg-blue-900 text-white overflow-y-scroll scrollbar-hidden">
                <div className="flex items-center justify-center gap-3 h-20 border-b border-blue-800 my-1"><NavLink to="/admin" className="text-2xl font-bold text-white no-underline">Admin</NavLink> {/* <ThemeToggle/> */} </div>
                <nav className="flex-1 px-4 py-2 space-y-2">{navItems.map(item => <NavItem key={item.to} {...item} onClick={onNavLinkClick} />)}</nav>
                <div className="px-3 py-3 border-t border-blue-800 mb-2">
                    <p className="text-sm text-center text-gray-400 mb-4">Logged in as <strong>{user?.username}</strong></p>
                    <Button variant="destructive" className="w-full" onClick={() => logout(navigate)}><LogOut className="w-5 h-5 mr-3" />Đăng Xuất</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <div className="hidden lg:block fixed h-full z-20 overflow-hidden"><Sidebar /></div>
            <div className="lg:hidden flex justify-between items-center w-full p-4 bg-blue-900 text-white fixed top-0 left-0 z-30 shadow-lg">
                <NavLink to="/admin" className="text-2xl font-bold text-white no-underline">Admin</NavLink>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <X /> : <Menu />}</Button>
            </div>
            <AnimatePresence>{isMobileMenuOpen && (<>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 bg-black/50 z-10" onClick={() => setIsMobileMenuOpen(false)} />
                <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="lg:hidden fixed top-0 left-0 w-64 h-full z-40">
                    <Sidebar onNavLinkClick={() => setIsMobileMenuOpen(false)} />
                </motion.div></>)}
            </AnimatePresence>
            <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 pt-20 lg:pt-0">
                    <div className="container h-full mx-auto px-6 py-8 ">
                        <AnimatePresence mode="wait">
                            <motion.div key={location.pathname} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className='h-full'>
                                <Outlet context={{ fetchNewRequests, requestVersion }} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};
export default AdminLayout;