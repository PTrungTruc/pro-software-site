import { useEffect, useState } from 'react';
import { getBlogPosts, addBlogPost, deleteBlogPost } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea'; // Giả sử bạn có component này

const BlogPage = () => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  
    const fetchPosts = async () => {
      try {
        const { data } = await getBlogPosts();
        setPosts(data);
      } catch (error) {
        toast.error('Không thể tải danh sách bài viết');
      } finally {
        setIsLoading(false);
      }
    };
  
    useEffect(() => {
      fetchPosts();
    }, []);
  
    const onSubmit = async (data) => {
      const promise = addBlogPost(data).then(response => {
          setPosts(prev => [response.data, ...prev]);
          reset();
          setIsDialogOpen(false);
      });
  
      toast.promise(promise, {
        loading: 'Đang đăng bài...',
        success: 'Đăng bài thành công!',
        error: 'Đăng bài thất bại!',
      });
    };
  
    const handleDelete = async (slug) => {
      const promise = deleteBlogPost(slug).then(() => {
          setPosts(prev => prev.filter(post => post.slug !== slug));
      });
  
      toast.promise(promise, {
          loading: 'Đang xóa...',
          success: 'Xóa thành công!',
          error: 'Xóa thất bại!',
      });
    };
  
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Quản lý Blog</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Viết Bài Mới</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Viết Bài Mới</DialogTitle>
                <DialogDescription>Nội dung hỗ trợ cú pháp Markdown.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="title">Tiêu đề</Label>
                  <Input id="title" {...register("title", { required: true })} />
                </div>
                <div>
                  <Label htmlFor="content">Nội dung (Markdown)</Label>
                  <textarea id="content" {...register("content", { required: true })} className="h-48 w-full rounded-md border p-2" />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="secondary">Hủy</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Đăng Bài
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
  
        <div className="bg-white rounded-lg shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu Đề</TableHead>
                <TableHead>Ngày Đăng</TableHead>
                <TableHead className="text-right">Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
              {isLoading ? (
                  <TableRow><TableCell colSpan="3" className="text-center">Đang tải...</TableCell></TableRow>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <motion.tr
                    key={post.slug}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <TableCell className="font-medium">{post.frontmatter.title}</TableCell>
                    <TableCell>{post.frontmatter.date}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(post.slug)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow><TableCell colSpan="3" className="text-center">Chưa có bài viết nào.</TableCell></TableRow>
              )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>
    );
};

export default BlogPage;