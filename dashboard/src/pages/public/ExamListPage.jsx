import React, { useEffect, useState, useMemo } from 'react';
import { getPublicExams, getDownloadUrl, getPublicExamCategories, submitWork } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, ClipboardCheck, Search, Filter, X, Upload, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const SubmissionForm = ({ exam, onCancel, onSuccess }) => {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm();
    const onSubmit = async (data) => {
        const formData = new FormData();
        formData.append('examId', exam.id);
        formData.append('name', data.name);
        formData.append('phone', data.phone);
        formData.append('email', data.email);
        formData.append('submissionFile', data.submissionFile[0]);
        const promise = submitWork(formData).then(res => {
            if (res.data.success) { onSuccess(); return res.data.message; }
            else { throw new Error(res.data.message || 'Nộp bài thất bại.'); }
        });
        toast.promise(promise, { loading: 'Đang nộp bài...', success: (msg) => msg, error: (err) => err.message });
    };
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2"><Label htmlFor="name">Họ và tên</Label><Input id="name" {...register("name", { required: true })} /></div>
            <div className="space-y-2"><Label htmlFor="phone">Số điện thoại</Label><Input id="phone" type="tel" pattern="[0-9]{10,11}" placeholder="Vui lòng nhập 10-11 số" className="py-1" {...register("phone", { required: true })} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" {...register("email", { required: true })} /></div>
            <div className="space-y-2"><Label htmlFor="submissionFile">File bài làm của bạn</Label><Input id="submissionFile" className="file:text-[hsl(var(--white))] text-[hsl(var(--white))]" type="file" {...register("submissionFile", { required: true })} /></div>
            <DialogFooter className="pt-4"><Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Xác nhận Nộp bài'}</Button></DialogFooter>
        </form>
    );
};

const ExamCard = ({ item, categoryName, onSubmissionClick }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        whileHover={{ y: -6 }}
        className="h-full"
    >
        <Card className="h-full flex flex-col group rounded-2xl overflow-hidden bg-card/80 border border-border hover:border-primary/40 hover:shadow-[0_0_20px_-6px_hsl(var(--primary)/0.35)] transition-all backdrop-blur">
            {/* Header */}
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-3">
                    <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors"> {item.name} </CardTitle>
                    {item.categoryId && (
                        <Badge className="bg-popover/70 text-primary border border-primary/30 backdrop-blur hover:text-[hsl(var(--white))]">{categoryName}</Badge>
                    )}
                </div>
            </CardHeader>
            {/* Content */}
            <CardContent className="flex-grow pt-0"><p className="text-sm text-muted-foreground truncate whitespace-pre line-clamp-4" title={item.description}>{item.description}</p></CardContent>
            {/* Footer */}
            <CardFooter className="flex gap-2 pt-4">
                <Button asChild className="flex-1 bg-primary/15 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/40">
                    <a href={getDownloadUrl(item.fileName)} target="_blank" rel="noreferrer"> <Download className="mr-2 h-4 w-4" /> Tải Đề </a>
                </Button>
                <Button variant="outline" className="flex-1 border-border text-foreground hover:border-primary/40" onClick={onSubmissionClick} > <Upload className="mr-2 h-4 w-4" /> Nộp Bài </Button>
            </CardFooter>
        </Card>
    </motion.div>
);

const ExamListPage = () => {
    const [exams, setExams] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExam, setSelectedExam] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const activeCategorySlug = queryParams.get('category') || 'all';
    const currentPage = parseInt(queryParams.get('page') || '1');
    const ITEMS_PER_PAGE = 9;

    useEffect(() => {
        setIsLoading(true);
        Promise.all([getPublicExams(), getPublicExamCategories()]).then(([examsRes, categoriesRes]) => {
            setExams(examsRes.data ? examsRes.data : []);
            setCategories(categoriesRes.data ? categoriesRes.data : []);
        }).finally(() => setIsLoading(false));
    }, []);

    const filteredExams = useMemo(() => {
        const category = categories.find(c => c.slug === activeCategorySlug);
        const categoryId = category ? category.id : null;
        return exams
            .filter(item => activeCategorySlug === 'all' || item.categoryId == categoryId)
            .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [activeCategorySlug, exams, categories, searchTerm]);

    const paginatedExams = useMemo(() => {
        const firstItemIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const lastItemIndex = firstItemIndex + ITEMS_PER_PAGE;
        return filteredExams.slice(firstItemIndex, lastItemIndex);
    }, [currentPage, filteredExams]);

    const totalPages = Math.ceil(filteredExams.length / ITEMS_PER_PAGE);
    const getCategoryName = (categoryId) => categories.find(c => c.id == categoryId)?.name || 'Chưa phân loại';

    const handleFilterChange = (key, value) => {
        const newParams = new URLSearchParams(location.search);
        if (key === 'page') {
            newParams.set('page', String(value));
        } else if (key === 'category') {
            if (value === 'all') {
                newParams.delete('category');
            } else {
                newParams.set('category', value);
            }
            newParams.delete('page'); // Reset về trang 1 khi đổi category
        }
        navigate(`${location.pathname}?${newParams.toString()}`);
    };

    useEffect(() => {
        setSearchTerm(queryParams.get('search') || '');
    }, [location.search]);


    return (
        <div className="flex flex-col min-h-screen mx-auto px-6 py-12 bg-[hsl(var(--ash))]">

            <div className="sticky top-16 md:top-20 z-40 mb-6 md:mb-8 backdrop-blur-lg py-3 md:py-4 space-y-3 md:space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm bài test theo tên..."
                        className="pl-11 md:pl-12 h-11 md:h-12 text-sm md:text-md rounded-full bg-[hsl(var(--ash))] text-foreground border-border shadow-inner focus:ring-primary/30"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <Button size="sm" variant={activeCategorySlug === 'all' ? 'default' : 'outline'} className="rounded-full shrink-0 px-4" onClick={() => handleFilterChange('category', 'all')} > Tất cả </Button>
                    {categories.map(cat => (
                        <Button
                            key={cat.id}
                            size="sm"
                            variant={activeCategorySlug === cat.slug ? 'default' : 'outline'}
                            className="rounded-full shrink-0 px-4"
                            onClick={() => handleFilterChange('category', cat.slug)}
                        > {cat.name} </Button>
                    ))}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nộp bài cho: {selectedExam?.name}</DialogTitle>
                        <DialogDescription>Điền thông tin và tải lên bài làm của bạn.</DialogDescription>
                    </DialogHeader>
                    <SubmissionForm exam={selectedExam} onCancel={() => setIsDialogOpen(false)} onSuccess={() => setIsDialogOpen(false)} />
                </DialogContent>
            </Dialog>

            <main className="flex-1">
                <AnimatePresence>
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-8 min-h-[12vh]  2xl:min-h-[15vh]">
                        {isLoading ? (Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />))
                            : paginatedExams.length > 0 ? (paginatedExams.map((item) => <ExamCard key={item.id} item={item} categoryName={getCategoryName(item.categoryId)} onSubmissionClick={() => { setSelectedExam(item); setIsDialogOpen(true); }} />)
                            ) : (<div className="col-span-full text-center py-20"><Search className="mx-auto h-16 w-16 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">Không tìm thấy kết quả</h3><p className="mt-2 text-muted-foreground">Hãy thử một từ khóa hoặc bộ lọc khác.</p></div>)}
                    </motion.div>
                </AnimatePresence>
                {totalPages > 1 &&
                    <div className="mt-12 flex justify-center">
                        <div className="bg-[hsl(var(--ash-glow))] border border-border rounded-2xl p-1  ">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem><PaginationPrevious onClick={() => handleFilterChange('page', Math.max(1, currentPage - 1))} /></PaginationItem>
                                    <PaginationItem><PaginationLink isActive>{currentPage}</PaginationLink></PaginationItem>
                                    <PaginationItem><PaginationNext onClick={() => handleFilterChange('page', Math.min(totalPages, currentPage + 1))} /></PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                }
            </main>
        </div>
    );
};
export default ExamListPage;