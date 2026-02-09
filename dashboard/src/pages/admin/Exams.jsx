import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getAdminExams, updateExam, deleteExam, getExamCategories, getDownloadUrl, uploadThumbnail } from '@/api';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios'; // Dùng cho upload file lớn
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Loader2, Inbox, RefreshCw, Pencil, Search, Download, ImagePlus, ClipboardCheck, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

const ExamForm = ({ initialData, onFinish, onCancel }) => {
    const { register, handleSubmit, reset, setValue, control, watch } = useForm({
        defaultValues: initialData || {}
    });
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingThumb, setIsUploadingThumb] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const isEditMode = !!initialData;
    const thumbnailValue = watch('thumbnail');

    useEffect(() => {
        getExamCategories().then(res => setCategories(res.data));
        reset(initialData || {});
    }, [initialData, reset]);

    const handleThumbnailUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsUploadingThumb(true);
        const formData = new FormData();
        formData.append('thumbnail', file);
        try {
            const res = await uploadThumbnail(formData);
            if (res.data.success) {
                toast.success("Tải thumbnail thành công!");
                setValue('thumbnail', res.data.fileName, { shouldDirty: true });
            }
        } catch (error) {
            toast.error("Tải thumbnail thất bại.");
        } finally {
            setIsUploadingThumb(false);
        }
    };

    const onFormSubmit = async (data) => {
        setIsSubmitting(true);

        if (isEditMode) {
            const promise = updateExam(initialData.id, data).finally(() => setIsSubmitting(false));
            toast.promise(promise, {
                loading: 'Đang cập nhật thông tin...',
                success: () => { onFinish(); return 'Cập nhật thành công!'; },
                error: 'Cập nhật thất bại!',
            });
        } else {
            const file = data.mainFile[0];
            if (!file) {
                toast.error("Vui lòng chọn file đề thi.");
                setIsSubmitting(false);
                return;
            }

            const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const originalFilename = file.name;
            let uploadSuccess = true;

            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);
                const chunkFormData = new FormData();
                chunkFormData.append('chunk', chunk);
                chunkFormData.append('chunkNumber', i);
                chunkFormData.append('totalChunks', totalChunks);
                chunkFormData.append('originalFilename', originalFilename);

                try {
                    await axios.post('http://14.241.225.202:3001/api/upload-chunk', chunkFormData, { withCredentials: true });
                    setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
                } catch (error) {
                    toast.error(`Lỗi khi tải lên chunk ${i + 1}: ${error.message}`);
                    uploadSuccess = false;
                    break;
                }
            }

            if (uploadSuccess) {
                try {
                    await axios.post('http://14.241.225.202:3001/api/assemble-chunks', {
                        originalFilename, totalChunks,
                        entity: 'exams', // SỬA LỖI QUAN TRỌNG Ở ĐÂY
                        name: data.name,
                        categoryId: data.categoryId,
                        description: data.description,
                        thumbnail: data.thumbnail || '',
                    }, { withCredentials: true });

                    toast.success("Upload và xử lý file thành công!");
                    onFinish();
                } catch (error) {
                    toast.error("Lỗi khi ghép file: " + (error.response?.data?.message || error.message));
                }
            }
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col max-h-[70vh] overflow-y-auto p-1">
            <div className="flex-1 overflow-y-auto pb-1 mb-3 space-y-4">
                <div className="space-y-2">
                    <Label>Ảnh đại diện (Thumbnail)</Label>
                    <div className="w-full h-32 object-contain rounded-md border bg-muted flex items-center justify-center">
                        {thumbnailValue ? <img src={getDownloadUrl(thumbnailValue)} alt="thumbnail preview" className="max-h-full max-w-full rounded-md" /> : <ImagePlus className="h-10 w-10 text-muted-foreground" />}
                    </div>
                    <div className="flex items-center gap-2">
                        <Input id="thumbnail-upload" type="file" onChange={handleThumbnailUpload} accept="image/*" disabled={isUploadingThumb || isSubmitting} className="flex-1" />
                        {isUploadingThumb && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <input type="hidden" {...register('thumbnail')} />
                </div>

                <div className="space-y-2"><Label htmlFor="name">Tên bài test</Label><Input id="name" {...register("name", { required: true })} /></div>
                <div className="space-y-2"><Label htmlFor="categoryId">Chủ đề</Label>
                    <select id="categoryId" {...register("categoryId")} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="">-- Chọn --</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
                </div>
                <div className="space-y-2"><Label htmlFor="description">Mô tả</Label><Textarea id="description" {...register("description", { required: true })} /></div>

                {!isEditMode && <div className="space-y-2"><Label htmlFor="mainFile">File đề thi (có thể là file lớn)</Label><Input id="mainFile" type="file" {...register("mainFile")} /></div>}

                {isSubmitting && !isEditMode && (
                    <div className="space-y-2 pt-2">
                        <Label>Tiến độ upload file chính</Label>
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-sm text-muted-foreground text-center">{uploadProgress}%</p>
                    </div>
                )}
            </div>

            <DialogFooter className="sticky bottom-0 bg-card pt-2 border-t border-border z-10">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Hủy</Button>
                <Button type="submit" disabled={isSubmitting || isUploadingThumb}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isEditMode ? 'Đang lưu...' : 'Đang tải lên...'}</> : 'Lưu Thay Đổi'}</Button>
            </DialogFooter>
        </form>
    );
};

const ExamsAdminPage = () => {
    const [exams, setExams] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => { setIsLoading(true); try { const [examsRes, categoriesRes] = await Promise.all([getAdminExams(), getExamCategories()]); setExams(examsRes.data); setCategories(categoriesRes.data); } catch (err) { toast.error('Lỗi tải dữ liệu'); } finally { setIsLoading(false); } };
    useEffect(() => { fetchData(); }, []);

    const getCategoryName = (categoryId) => categories.find(c => c.id == categoryId)?.name || 'N/A';
    const filteredExams = useMemo(() => {
        if (!exams) return [];
        return exams.filter(item => (filterCategory === 'all' || item.categoryId == filterCategory)).filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [exams, filterCategory, searchTerm]);
    const handleOpenDialog = (item = null) => { setEditingItem(item); setIsDialogOpen(true); };
    const handleCloseDialog = () => setIsDialogOpen(false);
    const handleFormSuccess = () => { handleCloseDialog(); fetchData(); };
    const handleDelete = (id) => { if (confirm('Bạn có chắc muốn xóa bài test này?')) { const promise = deleteExam(id).then(() => fetchData()); toast.promise(promise, { loading: 'Đang xóa...', success: 'Xóa thành công!', error: 'Xóa thất bại!' }); } };

    return (
        <div className='pb-[2vh]'>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6"><h1 className="text-3xl font-bold">Quản lý Bài Test</h1><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}><RefreshCw className={`mr-2 h-4 w-4 ${isLoading && "animate-spin"}`} /> Làm mới</Button><Button onClick={() => handleOpenDialog(null)}><PlusCircle className="mr-2 h-4 w-4" /> Thêm Mới</Button></div></div>
            <div className="mb-6 p-4 bg-card border rounded-lg flex flex-col md:flex-row gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Tìm kiếm theo tên..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><Select onValueChange={setFilterCategory} value={filterCategory}><SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Lọc theo chủ đề" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả Chủ đề</SelectItem>{categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}</SelectContent></Select></div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{editingItem ? 'Sửa Thông tin Bài Test' : 'Thêm Bài Test Mới'}</DialogTitle></DialogHeader><ExamForm initialData={editingItem} onFinish={handleFormSuccess} onCancel={handleCloseDialog} /></DialogContent></Dialog>
            <div className="bg-card rounded-lg shadow-md border"><Table><TableHeader><TableRow><TableHead className="w-20">Ảnh</TableHead><TableHead>Tên</TableHead><TableHead>Mô tả</TableHead><TableHead>Chủ đề</TableHead><TableHead className="text-right w-[140px]">Hành Động</TableHead></TableRow></TableHeader>
                <TableBody><AnimatePresence>
                    {isLoading ? (<TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>)
                        : filteredExams.map(item => (
                            <motion.tr key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}>
                                <TableCell>{item.thumbnail ? <img src={getDownloadUrl(item.thumbnail)} alt={item.name} className="w-12 h-12 object-cover rounded-md" /> : <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center"><ClipboardCheck className="h-6 w-6 text-muted-foreground" /></div>}</TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="max-w-xs text-muted-foreground text-xs truncate whitespace-pre line-clamp-4" title={item.description}>{item.description}</TableCell>
                                <TableCell><Badge variant="outline">{getCategoryName(item.categoryId)}</Badge></TableCell>
                                <TableCell className="text-right"><div className="flex items-center justify-end gap-2">
                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8" disabled={!item.fileName}><a href={getDownloadUrl(item.fileName)} target="_blank" rel="noreferrer" title="Tải file"><Download className="h-4 w-4" /></a></Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(item)} title="Sửa"><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)} title="Xóa"><Trash2 className="h-4 w-4" /></Button>
                                </div></TableCell>
                            </motion.tr>
                        ))}
                    {!isLoading && filteredExams.length === 0 && <TableRow><TableCell colSpan={5} className="text-center h-24"><Inbox className="mx-auto h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground mt-2">Không tìm thấy bài test nào.</p></TableCell></TableRow>}
                </AnimatePresence></TableBody></Table>
            </div>
        </div>
    );
};
export default ExamsAdminPage;