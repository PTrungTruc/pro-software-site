import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { Package, AppWindow, BookOpen, ClipboardCheck, PenSquare, Send, Menu, X, Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/providers/theme-provider'
import { useEffect, useRef, useState } from 'react'
import ChatWidget from '@/components/ChatWidget'

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    return (
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

const PublicLayout = () => {
    const [open, setOpen] = useState(false); const menuRef = useRef(null); const location = useLocation()
    useEffect(() => { setOpen(false) }, [location.pathname])
    useEffect(() => { const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false) }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler) }, [])

    return (<div className="flex flex-col min-h-screen bg-background font-sans">
        <header className="bg-card/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b">
            <nav className="container min-w-full px-6 h-20 flex flex-row justify-between items-center">
                <NavLink to="/" className="text-2xl font-bold text-foreground flex items-center transition-transform hover:scale-105"><Package className="inline-block mr-2 text-primary" />ProSite</NavLink>
                <div className="hidden md:flex items-center space-x-8">
                    <NavLink to="/software" className={({ isActive }) => `ml-2 flex items-center text-muted-foreground hover:text-primary font-semibold ${isActive && 'text-primary'}`}>
                        <AppWindow className="mr-1.5 h-4 w-4" />Phần Mềm
                    </NavLink>
                    <NavLink to="/courses" className={({ isActive }) => `flex items-center text-muted-foreground hover:text-primary font-semibold ${isActive && 'text-primary'}`}>
                        <BookOpen className="mr-1.5 h-4 w-4" />Giáo trình
                    </NavLink>
                    <NavLink to="/exams" className={({ isActive }) => `flex items-center text-muted-foreground hover:text-primary font-semibold ${isActive && 'text-primary'}`}>
                        <ClipboardCheck className="mr-1.5 h-4 w-4" />Bài Test
                    </NavLink>
                    <NavLink to="/blog" className={({ isActive }) => `flex items-center text-muted-foreground hover:text-primary font-semibold ${isActive && 'text-primary'}`}>
                        <PenSquare className="mr-1.5 h-4 w-4" />Blog
                    </NavLink>
                    <NavLink to="/request" className={({ isActive }) => `flex items-center text-muted-foreground hover:text-primary font-semibold ${isActive && 'text-primary'}`}>
                        <Send className="mr-1.5 h-4 w-4" />Yêu Cầu
                    </NavLink>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(o => !o)}>{open ? <X /> : <Menu />}</Button>
                    <Button asChild className="hidden md:flex"><Link to="/admin">Trang Admin</Link></Button>
                </div>
            </nav>
        </header>

        <AnimatePresence>
            {open && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .25, ease: 'easeOut' }} className="md:hidden fixed top-20 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b shadow-lg" ref={menuRef}>
                    <div className="flex flex-col px-6 py-5 space-y-4">
                        {[{ to: '/software', label: 'Phần Mềm', icon: Package }, { to: '/courses', label: 'Giáo trình', icon: BookOpen }, { to: '/exams', label: 'Bài Test', icon: ClipboardCheck }, { to: '/blog', label: 'Blog', icon: PenSquare }, { to: '/request', label: 'Yêu Cầu', icon: Send }].map(i => (
                            <NavLink key={i.to} to={i.to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 font-semibold transition-colors ${isActive ? 'text-primary [&>svg]:text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                                <i.icon className="h-5 w-5" />{i.label}
                            </NavLink>
                        ))}
                        <Button asChild variant="outline" onClick={() => setOpen(false)}><Link to="/admin">Trang Admin</Link></Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <main className="flex-grow"><Outlet /></main>
        <footer className="bg-card border-t"><div className="container mx-auto px-6 py-8 text-center text-muted-foreground">&copy;{new Date().getFullYear()} ProSite. Sáng tạo và Chia sẻ.</div></footer>
        <ChatWidget />
    </div>)
}

export default PublicLayout
