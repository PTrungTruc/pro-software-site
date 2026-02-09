import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { submitRequest } from '@/api';

const RequestPage = () => {
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

    const onSubmit = async (data) => {
        const payload = {
            name: data.name,
            email: data.email,
            phone: data.phone || "",
            message: data.message
        };
        console.log(payload);

        const promise = submitRequest(payload).then(res => {
            if (res.data.success) {
                reset();
                return res.data.message;
            }
            throw new Error(res.data.message || 'Gửi yêu cầu thất bại');
        });

        toast.promise(promise, {
            loading: 'Đang gửi yêu cầu...',
            success: (msg) => (<span className="whitespace-pre-line">{msg}</span>),
            error: (err) => err.message
        });
    };

    return (
        <div className="min-h-screen bg-[hsl(var(--ash))] px-6 py-12 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 24 }} className="w-full px-2 sm:px-0 md:max-w-2xl lg:max-w-3xl 2xl:max-w-4xl">
                <Card className="rounded-2xl bg-card/80 border border-border backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-xl md:text-2xl 2xl:text-3xl text-center text-primary">Gửi Yêu Cầu</CardTitle>
                        <p className="text-xs md:text-sm 2xl:text-base text-muted-foreground text-center">Điền thông tin để chúng tôi hỗ trợ bạn nhanh nhất</p>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-4 md:p-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5 2xl:space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Họ và tên <span className='text-[red]'>*</span></Label>
                                <Input id="name" placeholder="Nguyễn Văn A" {...register('name', { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email <span className='text-[red]'>*</span></Label>
                                <Input id="email" type="email" placeholder="email@example.com" {...register('email', { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Số điện thoại (không bắt buộc)</Label>
                                <Input id="phone" type="tel" pattern="[0-9]{10,11}" inputMode="numeric" placeholder="0123 456 789" {...register('phone')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Nội dung yêu cầu <span className='text-[red]'>*</span></Label>
                                <Textarea id="message" rows={5} placeholder="Nhập nội dung bạn muốn yêu cầu..." {...register('message', { required: true })} />
                            </div>
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang gửi...</> : <><Send className="mr-2 h-4 w-4" />Gửi yêu cầu</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default RequestPage;