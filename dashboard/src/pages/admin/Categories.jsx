import { useEffect, useState } from 'react';
import { 
    getSoftwareCategories, addSoftwareCategory, deleteSoftwareCategory,
    getBlogCategories, addBlogCategory, deleteBlogCategory,
    getCourseCategories, addCourseCategory, deleteCourseCategory,
    getExamCategories, addExamCategory, deleteExamCategory 
} from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';

const CategoryManager = ({ title, getCategories, addCategory, deleteCategory }) => {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchCategories = () => {
        setIsLoading(true);
        getCategories().then(res => setCategories(res.data)).finally(() => setIsLoading(false));
    };
    
    useEffect(() => {
        fetchCategories();
    }, [getCategories]);


    const handleAdd = (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast.error("Tên chủ đề không được để trống.");
            return;
        };
        const promise = addCategory({ name: newCategoryName }).then(() => {
            setNewCategoryName('');
            fetchCategories();
        });
        toast.promise(promise, { loading: 'Đang thêm...', success: 'Thêm thành công!', error: 'Thêm thất bại!' });
    };

    const handleDelete = (id) => {
        if (confirm('Bạn có chắc muốn xóa chủ đề này? Tất cả nội dung liên quan có thể bị ảnh hưởng.')) {
            const promise = deleteCategory(id).then(() => fetchCategories());
            toast.promise(promise, { loading: 'Đang xóa...', success: 'Xóa thành công!', error: 'Xóa thất bại!' });
        }
    };

    return (
        <Card className="shadow-md h-full">
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Tên chủ đề mới" />
                    <Button type="submit" size="icon"><PlusCircle className="h-4 w-4" /></Button>
                </form>
                <div className="border rounded-md max-h-96 2xl:max-h-full overflow-y-auto">
                    <Table className="2xl:h-full">
                        <TableHeader><TableRow><TableHead>Tên Chủ đề</TableHead><TableHead className="text-right w-[100px]">Hành động</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {isLoading ? <TableRow><TableCell colSpan={2} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                            : categories.map(cat => (
                                <TableRow key={cat.id}>
                                    <TableCell className="font-medium">{cat.name}</TableCell>
                                    <TableCell className="text-right"><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                            ))}
                             {!isLoading && categories.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">Chưa có chủ đề nào.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};


const CategoriesAdminPage = () => {
  return (
    <div className='h-full '>
        <h1 className="text-3xl font-bold mb-6">Quản lý Chủ đề</h1>
        <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-8 pb-[3vh]">
            <CategoryManager 
                title="Chủ đề Phần mềm"
                getCategories={getSoftwareCategories}
                addCategory={addSoftwareCategory}
                deleteCategory={deleteSoftwareCategory}
            />
             <CategoryManager 
                title="Chủ đề Giáo trình"
                getCategories={getCourseCategories}
                addCategory={addCourseCategory}
                deleteCategory={deleteCourseCategory}
            />
            <CategoryManager 
                title="Chủ đề Bài Test"
                getCategories={getExamCategories}
                addCategory={addExamCategory}
                deleteCategory={deleteExamCategory}
            />
            <CategoryManager 
                title="Chủ đề Blog"
                getCategories={getBlogCategories}
                addCategory={addBlogCategory}
                deleteCategory={deleteBlogCategory}
            />
        </div>
    </div>
  )
};

export default CategoriesAdminPage;