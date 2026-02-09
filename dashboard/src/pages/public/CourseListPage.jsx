import { useEffect, useState, useMemo } from 'react'
import { getPublicCourses, getDownloadUrl, getPublicCourseCategories } from '@/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, BookOpen, Search, Filter, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

// === CARD FUTURISTIC (Phiên bản cho Giáo Trình) === 
const CourseCard = ({ item, categoryName }) => (
    <motion.div layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} whileHover={{ y: -6, scale: 1.02 }} transition={{ duration: 0.25 }} className="group h-full">
        <div className="h-full flex flex-col rounded-xl bg-card/80 border border-border hover:border-primary/40 hover:shadow-[0_0_18px_-4px_hsl(var(--primary)/0.35)] transition-all duration-300 overflow-hidden backdrop-blur">
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-muted">
                {item.thumbnail ? <img src={getDownloadUrl(item.thumbnail)} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors"><BookOpen size={48} /></div>}
                {/* Category */}
                <div className="absolute top-2 right-2">
                    <Badge className="bg-popover/70 text-primary border border-primary/30 backdrop-blur hover:text-[hsl(var(--white))]">{categoryName}</Badge>
                </div>
            </div>
            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-foreground text-base mb-2 truncate group-hover:text-primary transition-colors">{item.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-grow">{item.description}</p>
                <Button asChild size="sm" className="w-full bg-primary/15 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/40 transition-all shadow-none hover:shadow-[0_0_16px_hsl(var(--primary)/0.45)]">
                    <a href={getDownloadUrl(item.fileName)} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" /> Tải Giáo Trình</a>
                </Button>
            </div>
        </div>
    </motion.div>
)

const CourseListPage = () => {
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [openFilter, setOpenFilter] = useState(false);

    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const currentPage = parseInt(queryParams.get('page') || '1');
    const activeCategorySlug = slug || 'all';
    const ITEMS_PER_PAGE = 30; // 5 hàng x 6 cột

    useEffect(() => {
        Promise.all([getPublicCourses(), getPublicCourseCategories()]).then(([res, cats]) => {
            setCourses(res.data || [])
            setCategories(cats.data || [])
        }).finally(() => setIsLoading(false))
    }, []);

    useEffect(() => { setOpenFilter(false) }, [location.pathname]);

    const handleCategoryClick = (slug) => navigate(slug === 'all' ? '/courses' : `/courses/category/${slug}`);
    const handlePageChange = (page) => {
        const params = new URLSearchParams(location.search);
        params.set('page', page);
        navigate(`${location.pathname}?${params}`);
    };

    const filtered = useMemo(() => courses.filter(i => (activeCategorySlug === 'all' || i.categoryId == categories.find(c => c.slug === activeCategorySlug)?.id) && i.name.toLowerCase().includes(searchTerm.toLowerCase())), [courses, categories, activeCategorySlug, searchTerm]);
    const paginated = useMemo(() => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filtered, currentPage]);
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const getCatName = (id) => categories.find(c => c.id == id)?.name || 'Khác';

    // SIDEBAR
    const SidebarContent = () => (
        <>
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center"><Filter className="mr-2 text-primary" /> Bộ Lọc</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Tìm giáo trình..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Chủ đề</h3>
                <div className="flex flex-col gap-1">
                    <Button variant="ghost" onClick={() => handleCategoryClick('all')} className={cn("justify-start", activeCategorySlug === 'all' && "bg-primary/10 text-primary")}>Tất cả</Button>
                    {categories.map(cat => <Button key={cat.id} variant="ghost" onClick={() => handleCategoryClick(cat.slug)} className={cn("justify-start truncate", activeCategorySlug === cat.slug && "bg-primary/10 text-primary")}>{cat.name}</Button>)}
                </div>
            </div>
        </>
    )

    return (
        <div className="flex min-h-screen w-full bg-[hsl(var(--ash))]">

            {/* === SIDEBAR TRÁI (DESKTOP) === */}
            <aside className="hidden lg:block w-72 sticky top-20 h-[calc(100vh-5rem)] bg-card/80 backdrop-blur border-r border-border p-6 overflow-y-auto"><SidebarContent /></aside>

            {/* === NỘI DUNG CHÍNH === */}
            <main className="flex-1 p-6 lg:p-8">
                {/* Mobile filter button */}
                <Button variant="outline" className="lg:hidden mb-6 w-full flex gap-2" onClick={() => setOpenFilter(true)} ><Filter className="h-4 w-4" /> Bộ lọc</Button>
                {/* === HOẠT ẢNH CỦA SIDEBAR === */}
                <AnimatePresence>
                    {openFilter && (
                        <>
                            <motion.div onClick={() => setOpenFilter(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" />
                            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed bottom-0 left-0 right-0 z-40 bg-card rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4"><h2 className="font-bold">Bộ lọc</h2><Button size="icon" variant="ghost" onClick={() => setOpenFilter(false)}><X /></Button></div>
                                <SidebarContent />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Grid */}
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {isLoading ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />) : (paginated.length > 0 ? (paginated.map(item => <CourseCard key={item.id} item={item} categoryName={getCatName(item.categoryId)} />)) : (<div className="col-span-full text-center py-20"><Search className="mx-auto h-16 w-16 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">Không tìm thấy kết quả</h3><p className="mt-2 text-muted-foreground">Hãy thử một từ khóa hoặc bộ lọc khác.</p></div>))}
                </motion.div>

                {totalPages > 1 && (
                    <div className="mt-12 flex justify-center">
                        <div className="bg-[hsl(var(--ash-glow))] border border-border rounded-2xl p-1  ">
                            <Pagination><PaginationContent>
                                <PaginationItem><PaginationPrevious onClick={() => handlePageChange(Math.max(1, currentPage - 1))} /></PaginationItem>
                                {[...Array(totalPages)].map((_, i) => <PaginationItem key={i}><PaginationLink isActive={currentPage === i + 1} onClick={() => handlePageChange(i + 1)}>{i + 1}</PaginationLink></PaginationItem>)}
                                <PaginationItem><PaginationNext onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} /></PaginationItem>
                            </PaginationContent></Pagination>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default CourseListPage