import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Hdd, Pencil, LogOut, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

const navItems = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/software", icon: Hdd, label: "Phần Mềm" },
    { to: "/blog", icon: Pencil, label: "Blog" },
];

const NavItem = ({ to, icon: Icon, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-blue-800 hover:text-white'
            }`
        }
    >
        <Icon className="w-5 h-5 mr-3" />
        {label}
    </NavLink>
);

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col w-64 h-full bg-blue-900 text-white">
            <div className="flex items-center justify-center h-20 border-b border-blue-800">
                <h1 className="text-2xl font-bold">Admin</h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map(item => <NavItem key={item.to} {...item} />)}
            </nav>
            <div className="px-4 py-4 border-t border-blue-800">
                <p className="text-sm text-center text-gray-400 mb-4">Logged in as <strong>{user?.username}</strong></p>
                <Button variant="destructive" className="w-full" onClick={() => logout(navigate)}>
                    <LogOut className="w-5 h-5 mr-3" />
                    Đăng Xuất
                </Button>
            </div>
        </div>
    )
}

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar cho Desktop */}
            <div className="hidden lg:block">
                 <Sidebar />
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden flex justify-between items-center w-full p-4 bg-blue-900 text-white fixed top-0 left-0 z-20">
                <h1 className="text-2xl font-bold">Admin</h1>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                   {isMobileMenuOpen ? <X/> : <Menu />}
                </Button>
            </div>

             {/* Mobile Sidebar */}
            <AnimatePresence>
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="lg:hidden fixed top-0 left-0 w-64 h-full z-10 pt-20" 
                >
                    <Sidebar />
                </motion.div>
            )}
            </AnimatePresence>


            <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 pt-20 lg:pt-0">
                    <div className="container mx-auto px-6 py-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;