import React, { useEffect, useState, useRef } from 'react';
import { getPublicSoftware, getPublicBlogPosts, getPublicCourses, getPublicStats, getDownloadUrl } from '@/api';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Cpu, FileText, Download, BookOpen, Send, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// --- COMPONENT CON: CARD NỘI DUNG ---
const FuturisticCard = ({ item, type, delay, mouseDrag }) => {
    const link = type === 'blog' ? `/blog/${item.slug}` : `/${type}`;
    const title = type === 'blog' ? item.frontmatter.title : item.name;
    const description = type === 'blog'
        ? new Date(item.frontmatter.date).toLocaleDateString('vi-VN')
        : `Phiên bản: ${item.version || 'Mới nhất'}`;

    // Icon đại diện nếu không có ảnh
    const FallbackIcon = type === 'software' ? Cpu : type === 'course' ? BookOpen : FileText;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="h-full"
        >

            <Link to={link} className="h-full block" draggable={false} onClick={(e) => { if (mouseDrag?.isDragging()) { e.preventDefault() } }}>
                <div className="relative h-full rounded-2xl overflow-hidden bg-card/80 border border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] transition-all duration-300 group flex flex-col">
                    {/* Phần Ảnh / Thumbnail */}
                    <div className="h-48 w-full bg-gradient-to-b from-slate-800 to-slate-900 relative overflow-hidden">
                        {item.thumbnail ? (
                            <img src={getDownloadUrl(item.thumbnail)} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FallbackIcon className="w-16 h-16 text-cyan-500/30 group-hover:text-cyan-400 transition-colors duration-300" />
                            </div>
                        )}
                        {/* Overlay gradient khi hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                    </div>

                    {/* Phần Nội dung */}
                    <div className="p-6 flex-grow flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-[hsl(var(--white))] group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1">{title}</h3>
                            <p className="text-sm text-cyan-400 font-mono">{description}</p>
                        </div>

                        <p className="text-[hsl(var(--ash-glow))]/110 text-sm line-clamp-2 mb-6 flex-grow">
                            {type !== 'blog' && item.description}
                        </p>

                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                            {type === 'blog' ? (
                                <span className="text-sm text-cyan-400 font-medium flex items-center">
                                    Đọc ngay <ArrowRight className="ml-2 w-4 h-4" />
                                </span>
                            ) : (
                                <span className="text-sm text-cyan-400 font-medium flex items-center group-hover:translate-x-1 transition-transform">
                                    Xem chi tiết <ArrowRight className="ml-2 w-4 h-4" />
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

// --- COMPONENT CON: SECTION HEADER ---
const SectionHeader = ({ title, subtitle, link }) => (
    <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/10 pb-4">
        <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--white))] mb-2 tracking-tight">
                {title} <span className="text-cyan-500">.</span>
            </h2>
            <p className="text-slate-400">{subtitle}</p>
        </div>
        {link && (
            <Link to={link}>
                <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950 mt-4 md:mt-0">
                    Xem tất cả <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
            </Link>
        )}
    </div>
);

// --- HỖ TRỢ KÉO CHUỘT ---
const useDragScroll = () => {
    const ref = useRef(null)
    const state = useRef({
        isDown: false,
        startX: 0,
        scrollLeft: 0,
        moved: false,
    })
    const DRAG_THRESHOLD = 6 // px

    const onPointerDown = (e) => {
        const el = ref.current
        if (!el) return
        state.current.isDown = true
        state.current.startX = e.clientX
        state.current.scrollLeft = el.scrollLeft
        state.current.moved = false
        el.classList.add("cursor-grabbing")
    }

    const onPointerUp = () => {
        const el = ref.current
        if (!el) return
        state.current.isDown = false
        el.classList.remove("cursor-grabbing")
    }

    const onPointerMove = (e) => {
        const el = ref.current
        if (!el || !state.current.isDown) return
        const delta = e.clientX - state.current.startX
        // chưa vượt ngưỡng → coi như click
        if (Math.abs(delta) < DRAG_THRESHOLD) return
        state.current.moved = true
        e.preventDefault()
        el.scrollLeft = state.current.scrollLeft - delta
    }

    return { ref, onPointerDown, onPointerUp, onPointerMove, isDragging: () => state.current.moved, }
}

// --- TRANG CHỦ CHÍNH ---
const HomePage = () => {
    const [data, setData] = useState({ software: [], posts: [], courses: [], stats: {} });
    const [isLoading, setIsLoading] = useState(true);
    const softwareDrag = useDragScroll();
    const courseDrag = useDragScroll();
    const postDrag = useDragScroll();

    useEffect(() => {
        Promise.all([
            getPublicSoftware(), getPublicBlogPosts(), getPublicCourses(), getPublicStats()
        ]).then(([sw, posts, courses, stats]) => {
            setData({
                software: sw.data ? sw.data.slice(0, 10) : [],
                posts: posts.data ? posts.data.slice(0, 10) : [],
                courses: courses.data ? courses.data.slice(0, 10) : [],
                stats: stats.data || {}
            });
        }).finally(() => setIsLoading(false));

    }, []);

    return (
        <div className="min-h-screen bg-[hsl(var(--ash))] text-foreground font-sans selection:bg-primary/30 selection:text-primary">

            {/* === HERO SECTION === */}
            <section className="relative pt-12 pb-16 lg:pt-14 lg:pb-20 overflow-hidden bg-[hsl(var(--ash))]">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px]" />
                    <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[140px]" />
                </div>

                <div className="container px-6 relative z-10 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        {/* Sửa hover cho phần này */}
                        <Badge className="mb-6 border-primary/40 text-primary px-4 py-1 text-sm uppercase tracking-widest bg-transparent hover:text-white bg-[linear-gradient(135deg,hsl(var(--accent)/0.45),hsl(var(--secondary)/0.35),hsl(var(--accent)/0.45))] bg-[length:200%_200%] bg-[position:0%_100%] backdrop-blur transition-[background-position,color] duration-1000 ease-out hover:bg-[position:100%_0%]">
                            <Sparkles className="w-3 h-3 mr-2 inline-block" /> Nền tảng ProSite 2025
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-[hsl(var(--white))] mb-6 tracking-tight leading-tight">
                            Kho Tàng <br className="md:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                                Công Nghệ & Tri Thức
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Truy cập hàng ngàn phần mềm bản quyền, giáo trình chuyên sâu và bài test năng lực. Tất cả trong một nền tảng duy nhất.
                        </p>
                        <div className=" flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button asChild size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/60 text-slate-950 font-bold rounded-full shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.7)] transition-all">
                                <Link to="/software">Khám Phá Phần Mềm</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-700 text-slate-300 text-muted-foreground hover:bg-slate-800 hover:text-white rounded-full">
                                <Link to="/courses">Xem Giáo Trình</Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* === STATS SECTION === */}
            <section className="py-12 border-y border-border bg-[hsl(var(--ash-glow))]/20 backdrop-blur shadow-[0_0_15px_-5px_rgba(6,182,212,0.7)]">
                <div className="container px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { label: "Phần mềm", value: data.stats.softwareCount || 0, icon: Cpu },
                            { label: "Giáo trình", value: data.stats.courseCount || 0, icon: BookOpen },
                            { label: "Bài viết", value: data.stats.blogCount || 0, icon: FileText },
                            { label: "Truy cập", value: "1.2K+", icon: Globe },
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.5 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--ash-glow))] flex items-center justify-center mb-3 text-primary">
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="text-3xl font-bold text-[hsl(var(--white))] mb-1">{stat.value}</div>
                                <div className="text-sm text-slate-500 uppercase tracking-wider font-medium">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === SOFTWARE SECTION === */}
            <section className="py-24 bg-[hsl(var(--ash))]">
                <div className="container px-6 2xl:max-w-full">
                    <SectionHeader title="Phần Mềm Mới Nhất" subtitle="Cập nhật liên tục các công cụ hỗ trợ công việc tốt nhất" link="/software" />
                    <div ref={softwareDrag.ref} onPointerDown={softwareDrag.onPointerDown} onPointerUp={softwareDrag.onPointerUp} onPointerLeave={softwareDrag.onPointerUp} onPointerMove={softwareDrag.onPointerMove} className="grid grid-flow-col auto-cols-[minmax(480px,480px)] gap-8 py-2 overflow-x-auto overflow-y-hidden">
                        {isLoading || !Array.isArray(data.software) ? Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl bg-[hsl(var(--ash-glow))]/60" />)
                            : data.software.map((item, i) => <FuturisticCard key={item.id} item={item} type="software" delay={i * 0.1} mouseDrag={softwareDrag} />)}
                        {Array.isArray(data.software) && data.software.length >= 10 && (
                            <div className="flex items-center justify-center w-[320px] mx-auto">
                                <Link to="/software"
                                    className=" group relative w-full h-96 rounded-2xl border border-primary/30 bg-card flex flex-col items-center justify-center gap-6 overflow-hidden transition hover:border-primary">
                                    {/* glow nền */}
                                    <span className="pointer-events-none absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition" />

                                    {/* nút tròn bên trong */}
                                    <span className="relative h-16 w-16 rounded-full border border-primary/40 bg-background flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                                        <ArrowRight className="h-7 w-7" />
                                    </span>
                                    {/* text */}
                                    <span className=" text-sm font-medium tracking-wide text-muted-foreground group-hover:text-primary transition ">
                                        Xem thêm
                                    </span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* === COURSES SECTION === */}
            <section className="py-24 bg-[hsl(var(--ash-soft))]/50">
                <div className="container px-6 2xl:max-w-full">
                    <SectionHeader title="Giáo Trình Chọn Lọc" subtitle="Nâng cao kỹ năng với tài liệu học tập chất lượng cao" link="/courses" />
                    <div ref={courseDrag.ref} onPointerDown={courseDrag.onPointerDown} onPointerUp={courseDrag.onPointerUp} onPointerLeave={courseDrag.onPointerUp} onPointerMove={courseDrag.onPointerMove} className="grid grid-flow-col auto-cols-[minmax(480px,480px)] gap-8 py-2 overflow-x-auto overflow-y-hidden">
                        {isLoading ? Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-full rounded-2xl bg-[hsl(var(--ash-glow))]/60" />)
                            : data.courses.map((item, i) => <FuturisticCard key={item.id} item={item} type="courses" delay={i * 0.1} mouseDrag={courseDrag} />)}
                    </div>
                </div>
            </section>


            {/* === BLOG SECTION === */}
            <section className="py-24 bg-[hsl(var(--ash-soft))]/50">
                <div className="container px-6 2xl:max-w-full">
                    <SectionHeader title="Góc Công Nghệ" subtitle="Tin tức, thủ thuật và hướng dẫn sử dụng" link="/blog" />
                    <div ref={postDrag.ref} onPointerDown={postDrag.onPointerDown} onPointerUp={postDrag.onPointerUp} onPointerLeave={postDrag.onPointerUp} onPointerMove={postDrag.onPointerMove} className="grid grid-flow-col auto-cols-[minmax(480px,480px)] gap-8 py-2 overflow-x-auto overflow-y-hidden ">
                        {isLoading ? Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl bg-[hsl(var(--ash-glow))]/60" />)
                            : data.posts.map((item, i) => <FuturisticCard key={item.slug} item={item} type="blog" delay={i * 0.1} mouseDrag={postDrag} />)}
                    </div>
                </div>
            </section>


            {/* === CTA SECTION === */}
            <section className="py-32 relative overflow-hidden bg-[hsl(var(--ash))]">
                <div className="absolute inset-0 bg-primary/5"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/25 blur-[140px] rounded-full pointer-events-none"></div>

                <div className="container px-6 relative z-10 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-[hsl(var(--light))] mb-6">Bạn cần tìm thứ gì khác?</h2>
                    <p className="text-slate-400 mb-10 max-w-xl mx-auto">
                        Đừng ngần ngại gửi yêu cầu cho chúng tôi. Đội ngũ admin sẽ hỗ trợ tìm kiếm và cập nhật sớm nhất có thể.
                    </p>
                    <Button asChild size="lg" className="h-14 px-10 text-lg bg-[hsl(var(--absolute-white))] text-[hsl(var(--dark))] hover:bg-primary/90 font-bold rounded-full shadow-xl transition-all hover:scale-105">
                        <Link to="/request">Gửi Yêu Cầu Ngay <Send className="ml-2 w-5 h-5" /></Link>
                    </Button>
                </div>
            </section>

        </div>
    );
};

export default HomePage;