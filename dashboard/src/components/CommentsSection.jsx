import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getComments, postComment } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CommentsSection = ({ contentId }) => {
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

    const fetchComments = () => {
        if (!contentId) return;
        setIsLoading(true);
        getComments(contentId)
            .then(res => setComments(res.data))
            .catch(() => toast.error("Không thể tải bình luận"))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchComments();
    }, [contentId]);

    const onSubmit = async (data) => {
        const promise = postComment(contentId, data).then(res => {
            if(res.status === 201) {
                setComments(prev => [res.data, ...prev]);
                reset();
                return "Gửi bình luận thành công!";
            } else {
                throw new Error("Có lỗi xảy ra");
            }
        });
        toast.promise(promise, { loading: "Đang gửi...", success: (msg) => msg, error: "Gửi bình luận thất bại!"});
    };

    return (
        <div className="mt-16 pt-12 border-t border-[hsl(var(--white))]">
            <h2 className="text-3xl font-bold mb-8 flex items-center">
                <MessageCircle className="mr-3 h-8 w-8 text-primary" />
                Thảo luận ({comments.length})
            </h2>

            {/* Form Gửi Bình luận */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <form onSubmit={handleSubmit(onSubmit)} className="mb-12 p-6 bg-secondary rounded-xl border border-border/50">
                    <div className="space-y-2 mb-4">
                        <Label htmlFor="author">Tên của bạn</Label>
                        <Input id="author" {...register('author', { required: true })} placeholder="Nhập tên hiển thị..." className="bg-background" />
                    </div>
                    <div className="space-y-2 mb-4">
                        <Label htmlFor="text">Nội dung bình luận</Label>
                        <Textarea id="text" {...register('text', { required: true })} placeholder="Viết bình luận của bạn ở đây..." rows={4} className="bg-background"/>
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                        {isSubmitting ? "Đang gửi..." : <>Gửi Bình luận <Send className="ml-2 h-4 w-4" /></>}
                    </Button>
                </form>
            </motion.div>

            {/* Danh sách Bình luận */}
            <div className="space-y-6">
                {isLoading ? (
                    <>
                        <Skeleton className="h-28 w-full rounded-xl" />
                        <Skeleton className="h-28 w-full rounded-xl" />
                    </>
                ) : comments.length > 0 ? (
                    <AnimatePresence>
                        {comments.map(comment => (
                            <motion.div 
                                key={comment.id} 
                                className="flex gap-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                layout
                            >
                                <div className="w-12 h-12 rounded-full border border-border bg-primary/10 flex items-center justify-center font-bold text-lg text-primary flex-shrink-0">
                                    {comment.author.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 border border-border/50 rounded-lg p-4 bg-secondary">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-bold text-foreground">{comment.author}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(comment.date).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <p className="text-foreground/90 whitespace-pre-wrap">{comment.text}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <p className="text-center text-muted-foreground py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                )}
            </div>
        </div>
    );
};

export default CommentsSection;