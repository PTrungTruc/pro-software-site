import { useEffect, useState } from 'react';
import { getSoftware, addSoftware, deleteSoftware } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';

const SoftwarePage = () => {
  const [software, setSoftware] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchSoftware = async () => {
    try {
      const { data } = await getSoftware();
      setSoftware(data);
    } catch (error) {
      toast.error('Không thể tải danh sách phần mềm');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSoftware();
  }, []);

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('version', data.version);
    formData.append('description', data.description);
    formData.append('softwareFile', data.softwareFile[0]);

    const promise = addSoftware(formData).then(response => {
        setSoftware(prev => [response.data, ...prev]);
        reset();
        setIsDialogOpen(false);
    });

    toast.promise(promise, {
      loading: 'Đang tải lên...',
      success: 'Thêm phần mềm thành công!',
      error: 'Thêm phần mềm thất bại!',
    });
  };

  const handleDelete = async (id) => {
    const promise = deleteSoftware(id).then(() => {
        setSoftware(prev => prev.filter(item => item.id !== id));
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
        <h1 className="text-3xl font-bold">Quản lý Phần mềm</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Thêm Mới</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm Phần Mềm Mới</DialogTitle>
              <DialogDescription>Điền thông tin và tải file lên.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Tên phần mềm</Label>
                <Input id="name" {...register("name", { required: true })} />
              </div>
               <div>
                <Label htmlFor="version">Phiên bản</Label>
                <Input id="version" {...register("version", { required: true })} />
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Input id="description" {...register("description", { required: true })} />
              </div>
              <div>
                <Label htmlFor="softwareFile">File cài đặt</Label>
                <Input id="softwareFile" type="file" {...register("softwareFile", { required: true })} />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Hủy</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Lưu
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
              <TableHead>Tên Phần Mềm</TableHead>
              <TableHead>Phiên Bản</TableHead>
              <TableHead className="text-right">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
            {isLoading ? (
                <TableRow><TableCell colSpan="3" className="text-center">Đang tải...</TableCell></TableRow>
            ) : software.length > 0 ? (
                software.map((item) => (
                <motion.tr
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -50 }}
                >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.version}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                </motion.tr>
                ))
            ) : (
                <TableRow><TableCell colSpan="3" className="text-center">Chưa có phần mềm nào.</TableCell></TableRow>
            )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SoftwarePage;