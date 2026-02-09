import { useEffect, useState } from 'react';
import { getAdminRequests, updateRequestStatus, deleteRequest } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, Trash2, Loader2, Inbox, Mail } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';


const RequestsAdminPage = () => {
  const [requests, setRequests] = useState([]);
  const { fetchNewRequests, requestVersion } = useOutletContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [requestVersion]);

  const fetchRequests = () => {
    getAdminRequests().then(res => setRequests(res.data)).catch(() => toast.error('Lỗi tải danh sách yêu cầu')).finally(() => setIsLoading(false));
  };

  const handleUpdateStatus = (id, status) => {
    const promise = updateRequestStatus(id, status).then(() => { fetchRequests(); fetchNewRequests(); });
    toast.promise(promise, { loading: 'Đang cập nhật...', success: 'Cập nhật thành công!', error: 'Cập nhật thất bại!' });
  };

  const handleDelete = (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa yêu cầu này?')) {
      const promise = deleteRequest(id).then(() => { fetchRequests(); fetchNewRequests(); });
      toast.promise(promise, { loading: 'Đang xóa...', success: 'Xóa thành công!', error: 'Xóa thất bại!' });
    }
  };

  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'new': return <Badge variant="destructive">Mới</Badge>;
      case 'done': return <Badge variant="secondary">Đã xử lý</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }

  const subjectMail = encodeURIComponent("Liên hệ");
  const bodyMail = encodeURIComponent(
  `Xin chào,

Mình liên hệ để trao đổi về yêu cầu đã gửi trước đó.
Rất mong nhận được phản hồi từ bạn.

Trân trọng,`);

  return (
    <div className='pb-[2vh]'>
      <h1 className="text-3xl font-bold mb-6">Quản lý Yêu cầu</h1>
      <div className="bg-white rounded-lg shadow-md">
        <Table><TableHeader><TableRow><TableHead>Trạng thái</TableHead><TableHead>Người gửi</TableHead><TableHead>Nội dung</TableHead><TableHead>Điện thoại</TableHead><TableHead className="text-right">Hành Động</TableHead></TableRow></TableHeader>
          <TableBody><AnimatePresence>
            {isLoading ? (<TableRow><TableCell colSpan="5" className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>)
              : requests.length > 0 ? (requests.map((req) => (
                <motion.tr key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}>
                  <TableCell><StatusBadge status={req.status} /></TableCell>
                  <TableCell><div className="font-medium">{req.name}</div><span className="mr-1">✉️</span><a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${req.email}&su=${subjectMail}&body=${bodyMail}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline cursor-pointer" > {req.email} </a></TableCell>
                  <TableCell className="max-w-sm"><p className="truncate line-clamp-2 whitespace-pre-line" title={req.message}>{req.message}</p></TableCell>
                  <TableCell><div className="font-medium">{req.phone || "Không có điện thoại liên hệ"}</div></TableCell>
                  <TableCell className="text-right flex flex-col gap-2 lg:flex-row lg:justify-end lg:items-center lg:gap-2">
                    {req.status === 'new' && <Button size="sm" onClick={() => handleUpdateStatus(req.id, 'done')}><Check className="h-4 w-4 mr-1" /> Xong</Button>}
                    {req.status === 'done' && <Button size="sm" className="border border-yellow-500 bg-yellow-100 text-yellow-600 hover:bg-yellow-200" onClick={() => handleUpdateStatus(req.id, 'new')}><Check className="h-4 w-4 mr-1" /> Hoàn tác</Button>}
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(req.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </motion.tr>)))
                : (<TableRow><TableCell colSpan="5" className="text-center h-24"><Inbox className="mx-auto h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">Không có yêu cầu nào.</p></TableCell></TableRow>)}
          </AnimatePresence></TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RequestsAdminPage;