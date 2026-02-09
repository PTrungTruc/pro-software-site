import { useEffect, useState, useMemo } from 'react';
import { getPublicBlogPosts, getPublicBlogCategories, getDownloadUrl } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'; // ĐÃ SỬA
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardImage } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PenSquare, Search, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Label } from '@/components/ui/label';

const BlogCard = ({ post, categoryName, isFeatured = false }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        whileHover={{ y: -5 }}
        className="h-full"
    >
        <Link to={`/blog/${post.slug}`} className="h-full">
            <Card className="h-full flex flex-col group overflow-hidden transition-all duration-300 rounded-2xl border-2 border-transparent hover:border-primary bg-card/50">
                <CardImage
                    className={cn("bg-gradient-to-br from-slate-800 to-green-900 border-b border-white/10", isFeatured ? "aspect-video md:aspect-[2.5/1] 2xl:aspect-[4/3]" : "aspect-video 2xl:aspect-[4/3]")}>
                    {post.frontmatter.thumbnail ? <img src={getDownloadUrl(post.frontmatter.thumbnail)} alt={post.frontmatter.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center"><PenSquare className="h-16 w-16 text-muted-foreground/50" /></div>}
                </CardImage>
                <CardContent className="p-6 flex-grow flex flex-col">
                    <Badge variant="secondary" className="mb-2 self-start 2xl:text-sm">{categoryName}</Badge>
                    <CardTitle className={cn("font-bold group-hover:text-primary transition-colors", isFeatured ? "text-2xl md:text-3xl 2xl:text-lg" : "text-xl 2xl:text-lg")}>{post.frontmatter.title}</CardTitle>
                    <CardDescription className="mt-auto pt-4 text-xs">{new Date(post.frontmatter.date).toLocaleDateString('vi-VN')}</CardDescription>
                </CardContent>
            </Card>
        </Link>
    </motion.div>
);

const FilterSidebar = ({ categories, activeCategorySlug, handleFilterChange, searchTerm, setSearchTerm }) => (
    <aside className="w-full space-y-8 h-fit rounded-xl border border-border bg-card/80 backdrop-blur p-5 md:sticky md:top-24">
        <div><Label htmlFor="search" className="font-semibold text-lg text-foreground">Tìm kiếm</Label><div className="relative mt-3"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="search" placeholder="Tiêu đề bài viết..." className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></div>
        <div><h3 className="font-semibold text-lg mb-3 text-foreground">Chủ đề</h3><div className="flex flex-col items-start gap-1">
            <Button variant="ghost" onClick={() => handleFilterChange('category', 'all')} className={cn("justify-start w-full", activeCategorySlug === 'all' ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-accent/30")}>Tất cả</Button>
            {categories.map(cat => (<Button key={cat.id} variant="ghost" onClick={() => handleFilterChange('category', cat.slug)} className={cn("justify-start w-full truncate", activeCategorySlug === cat.slug ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-accent/30")}>{cat.name}</Button>))}
        </div></div>
    </aside>
)

const BlogListPage = () => {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const activeCategorySlug = queryParams.get('category') || 'all';
    const currentPage = parseInt(queryParams.get('page') || '1');
    const ITEMS_PER_PAGE = 7;

    useEffect(() => {
        setIsLoading(true);
        Promise.all([getPublicBlogPosts(), getPublicBlogCategories()])
            .then(([postsRes, categoriesRes]) => {
                setPosts(postsRes.data ?? []);
                setCategories(categoriesRes.data ?? []);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const handleCategoryClick = (categorySlug) => { const path = categorySlug === 'all' ? '/blog' : `/blog/category/${categorySlug}`; navigate(path); };
    const handlePageChange = (page) => { const newParams = new URLSearchParams(location.search); newParams.set('page', String(page)); navigate(`${location.pathname}?${newParams.toString()}`); };
    const filteredPosts = useMemo(() => { const category = categories.find(c => c.slug === activeCategorySlug); const categoryId = category ? category.id : null; return posts.filter(item => activeCategorySlug === 'all' || item.frontmatter.categoryId == categoryId).filter(item => item.frontmatter.title.toLowerCase().includes(searchTerm.toLowerCase())); }, [posts, categories, activeCategorySlug, searchTerm]);
    const paginatedPosts = useMemo(() => { const firstItemIndex = (currentPage - 1) * ITEMS_PER_PAGE; const lastItemIndex = firstItemIndex + ITEMS_PER_PAGE; return filteredPosts.slice(firstItemIndex, lastItemIndex); }, [currentPage, filteredPosts]);
    const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
    const getCategoryName = (categoryId) => categories.find(c => c.id == categoryId)?.name || 'Chưa phân loại';

    const handleFilterChange = (key, value) => {
        const params = new URLSearchParams(location.search)

        if (key === 'category') {
            if (value === 'all') params.delete('category')
            else params.set('category', value)
            params.delete('page') // reset page
        }

        if (key === 'search') {
            if (!value) params.delete('search')
            else params.set('search', value)
            params.delete('page')
        }

        if (key === 'page') {
            params.set('page', String(value))
        }

        navigate(`${location.pathname}?${params.toString()}`)
    };

    useEffect(() => {
        setSearchTerm(queryParams.get('search') || '')
    }, [location.search]);

    return (
        <div className="min-h-screen w-full bg-[hsl(var(--ash))] justify-items-center">
            <div className="w-full mx-1 px-6 py-12">
                <div className="md:hidden mb-6">
                    <Button variant="outline" onClick={() => setIsFilterOpen(true)} className="w-full"><Filter className="mr-2 h-4 w-4" /> Mở Bộ lọc</Button>
                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => setIsFilterOpen(false)}>
                                <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 left-0 h-full w-4/5 max-w-sm bg-card p-6" onClick={e => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)} className="absolute top-4 right-4"><X /></Button>
                                    <FilterSidebar categories={categories} activeCategorySlug={activeCategorySlug} handleFilterChange={slug => { handleFilterChange(slug); setIsFilterOpen(false); }} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex flex-col md:flex-row gap-10">
                    <div className="hidden md:block w-72 shrink-0">
                        <FilterSidebar categories={categories} activeCategorySlug={activeCategorySlug} handleFilterChange={handleFilterChange} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                    </div>

                    <main className="flex-1">
                        <AnimatePresence>
                            <motion.div className="grid gap-6 min-h-[20vh] sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                                {isLoading ? Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <Skeleton key={i} className="h-96 rounded-xl" />)
                                    : paginatedPosts.length > 0 ? (
                                        paginatedPosts.map((post, index) =>
                                            <div key={post.slug} className={cn((index === 0 && paginatedPosts.length > 2 && currentPage === 1) && "sm:col-span-2 lg:col-span-3 2xl:col-span-1")}>
                                                <BlogCard post={post} categoryName={getCategoryName(post.frontmatter.categoryId)} isFeatured={index === 0 && currentPage === 1} />
                                            </div>
                                        )
                                    ) : (<div className="col-span-full text-center py-20"><PenSquare className="mx-auto h-16 w-16 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">Không tìm thấy bài viết</h3><p className="mt-2 text-muted-foreground">Hãy thử một từ khóa hoặc bộ lọc khác.</p></div>)}
                            </motion.div>
                        </AnimatePresence>

                        {totalPages > 1 && (
                            <div className="mt-12 flex justify-center">
                                <div className="bg-[hsl(var(--ash-glow))] border border-border rounded-2xl p-1 2xl:p-2">
                                    <Pagination className="2xl:text-lg">
                                        <PaginationContent className="2xl:gap-2">
                                            <PaginationItem className="2xl:h-11">
                                                <PaginationPrevious className="2xl:h-11 2xl:px-4" onClick={() => handleFilterChange('page', Math.max(1, currentPage - 1))} />
                                            </PaginationItem>
                                            {[...Array(totalPages)].map((_, i) => (
                                                <PaginationItem key={i} className="2xl:h-11">
                                                    <PaginationLink className="2xl:h-11 2xl:min-w-[44px] 2xl:text-lg" onClick={() => handleFilterChange('page', i + 1)} isActive={currentPage === i + 1}>
                                                        {i + 1}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem className="2xl:h-11">
                                                <PaginationNext className="2xl:h-11 2xl:px-4" onClick={() => handleFilterChange('page', Math.min(totalPages, currentPage + 1))} />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
export default BlogListPage;