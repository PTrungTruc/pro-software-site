import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getAdminBlogPosts, updateBlogPost, deleteBlogPost, getBlogCategories, uploadImages, addBlogPost, getDownloadUrl } from '@/api';
import { useForm, Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Loader2, Inbox, RefreshCw, Pencil, Search, ImagePlus , Star, PenSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ImageGalleryManager = ({ imageList, setImageList, control }) => {
    const [isUploading, setIsUploading] = useState(false);
    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        setIsUploading(true);
        const formData = new FormData();
        acceptedFiles.forEach(file => { formData.append('images', file); });
        try {
            const res = await uploadImages(formData);
            if (res.data.success) {
                const newImageFiles = res.data.fileNames;
                const currentImages = control._getWatch('images') || [];
                setImageList([...currentImages, ...newImageFiles]);
                toast.success(`${newImageFiles.length} ảnh đã được tải lên!`);
            }
        } catch (error) { toast.error("Tải ảnh lên thất bại."); } 
        finally { setIsUploading(false); }
    }, [control, setImageList]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });
    const handleDeleteImage = (fileName) => { if (confirm('Bạn có chắc muốn xóa ảnh này?')) { setImageList(prev => prev.filter(img => img !== fileName)); } };
    const handleSetPrimary = (fileName) => { setImageList(prev => [fileName, ...prev.filter(img => img !== fileName)]); toast.success(`Ảnh đã được đặt làm đại diện.`); };

    return (
        <div className="space-y-4 p-1">
            <Label>Thư viện ảnh (Ảnh đầu tiên là ảnh đại diện)</Label>
            <div {...getRootProps()} className={cn("border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors", isDragActive ? "border-primary bg-primary/10" : "hover:border-muted-foreground/50")}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">{isUploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <ImagePlus className="h-8 w-8" />}{isUploading ? <p>Đang tải lên...</p> : <p>Kéo thả ảnh vào đây, hoặc nhấn để chọn file</p>}</div>
            </div>
            {imageList && imageList.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">{imageList.map((fileName, index) => (
                    <div key={fileName} className="relative group aspect-square">
                        <img src={getDownloadUrl(fileName)} alt={`preview ${index}`} className="w-full h-full object-cover rounded-md" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                            <Button size="icon" variant="destructive" className="h-7 w-7" title="Xóa ảnh" onClick={() => handleDeleteImage(fileName)}><Trash2 className="h-4 w-4" /></Button>
                            {index > 0 && <Button size="icon" variant="secondary" className="h-7 w-7" title="Đặt làm ảnh chính" onClick={() => handleSetPrimary(fileName)}><Star className="h-4 w-4" /></Button>}
                        </div>
                        {index === 0 && <Badge className="absolute top-1 left-1">Chính</Badge>}
                    </div>
                ))}</div>
            )}
        </div>
    );
};

const BlogForm = ({ initialData, onFinish, onCancel }) => {
    const { register, handleSubmit, reset, setValue, control } = useForm({ defaultValues: initialData || { images: [] } });
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!initialData;
    
    useEffect(() => {
        getBlogCategories().then(res => setCategories(res.data));
        reset(initialData || { images: [] });
    }, [initialData, reset]);
    
    const onSubmit = (data) => {
        setIsSubmitting(true);
        const promise = isEditMode ? updateBlogPost(initialData.slug, data) : addBlogPost(data);
        toast.promise(promise, {
            loading: isEditMode ? 'Đang cập nhật...' : 'Đang đăng bài...',
            success: () => { onFinish(); return 'Thao tác thành công!'; },
            error: (err) => err.response?.data?.message || 'Thao tác thất bại!',
        });
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto px-2">
             <Controller name="images" control={control} defaultValue={initialData?.images || []} render={({ field }) => ( <ImageGalleryManager imageList={field.value} setImageList={field.onChange} control={control} /> )} />
            <div className="space-y-2"><Label htmlFor="title">Tiêu đề bài viết</Label><Input id="title" {...register("title", { required: true })} /></div>
            <div className="space-y-2"><Label htmlFor="categoryId">Chủ đề</Label>
                <select id="categoryId" {...register("categoryId")} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="">-- Chọn --</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
            </div>
            <div className="space-y-2"><Label htmlFor="content">Nội dung (Hỗ trợ Markdown)</Label><Textarea id="content" {...register("content", { required: true })} rows={12}/></div>
            <DialogFooter className="pt-4 sticky bottom-0 bg-card py-4 z-10"><Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Lưu Thay Đổi'}</Button></DialogFooter>
        </form>
    );
};

const BlogAdminPage = () => {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => { setIsLoading(true); try { const [postsRes, categoriesRes] = await Promise.all([getAdminBlogPosts(), getBlogCategories()]); setPosts(postsRes.data); setCategories(categoriesRes.data); } catch (err) { toast.error('Lỗi tải dữ liệu'); } finally { setIsLoading(false); } };
    useEffect(() => { fetchData(); }, []);
    
    const getCategoryName = (categoryId) => categories.find(c => c.id == categoryId)?.name || 'N/A';
    const filteredPosts = useMemo(() => posts.filter(item => (filterCategory === 'all' || item.frontmatter.categoryId == filterCategory)).filter(item => item.frontmatter.title.toLowerCase().includes(searchTerm.toLowerCase())), [posts, filterCategory, searchTerm]);
    
    const handleOpenDialog = (item = null) => { 
        const formData = item ? { ...item.frontmatter, content: item.content, slug: item.slug } : null;
        setEditingItem(formData); 
        setIsDialogOpen(true); 
    };
    const handleCloseDialog = () => setIsDialogOpen(false);
    const handleFormSuccess = () => { handleCloseDialog(); fetchData(); };
    const handleDelete = (slug) => { if (confirm('Bạn có chắc muốn xóa bài viết này?')) { const promise = deleteBlogPost(slug).then(() => fetchData()); toast.promise(promise, { loading: 'Đang xóa...', success: 'Xóa thành công!', error: 'Xóa thất bại!' }); } };

    return (
        <div className='pb-[2vh]'>
            <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold">Quản lý Blog</h1><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="mr-2 h-4 w-4" /> Làm mới</Button><Button onClick={() => handleOpenDialog(null)}><PlusCircle className="mr-2 h-4 w-4" /> Viết bài mới</Button></div></div>
            <div className="mb-6 p-4 bg-card border rounded-lg flex gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" /><Input placeholder="Tìm kiếm..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><Select onValueChange={setFilterCategory} value={filterCategory}><SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả Chủ đề</SelectItem>{categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}</SelectContent></Select></div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>{editingItem ? 'Sửa Bài Viết' : 'Viết Bài Mới'}</DialogTitle></DialogHeader><BlogForm initialData={editingItem} onFinish={handleFormSuccess} onCancel={handleCloseDialog} /></DialogContent></Dialog>
            <div className="bg-card rounded-lg shadow-md border"><Table><TableHeader><TableRow><TableHead className="w-20">Ảnh</TableHead><TableHead>Tiêu đề</TableHead><TableHead>Chủ đề</TableHead><TableHead>Ngày đăng</TableHead><TableHead className="text-right w-[110px]">Hành Động</TableHead></TableRow></TableHeader>
                <TableBody><AnimatePresence>
                    {isLoading ? (<TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>) 
                    : filteredPosts.map(item => (
                        <motion.tr key={item.slug} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}>
                            <TableCell>{item.frontmatter.images && item.frontmatter.images.length > 0 ? <img src={getDownloadUrl(item.frontmatter.images[0])} alt={item.frontmatter.title} className="w-12 h-12 object-cover rounded-md"/> : <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center"><PenSquare className="h-6 w-6 text-muted-foreground"/></div>}</TableCell>
                            <TableCell className="font-medium">{item.frontmatter.title}</TableCell>
                            <TableCell><Badge variant="outline">{getCategoryName(item.frontmatter.categoryId)}</Badge></TableCell>
                            <TableCell className="text-muted-foreground text-sm">{item.frontmatter.date}</TableCell>
                            <TableCell className="text-right"><div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(item)} title="Sửa"><Pencil className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.slug)} title="Xóa"><Trash2 className="h-4 w-4" /></Button>
                            </div></TableCell>
                        </motion.tr>
                    ))}
                    {!isLoading && filteredPosts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center h-24"><Inbox className="mx-auto h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground mt-2">Không tìm thấy bài viết nào.</p></TableCell></TableRow>}
                </AnimatePresence></TableBody></Table>
            </div>
        </div>
    );
};
export default BlogAdminPage;