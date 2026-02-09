import { useEffect, useState } from 'react';
import { getAdminSubmissions, deleteSubmission, getAdminExams, getDownloadUrl } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Loader2, Inbox, RefreshCw, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const SubmissionsAdminPage = () => {
    const [submissions, setSubmissions] = useState([]);
    const [exams, setExams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterExam, setFilterExam] = useState('all');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [submissionsRes, examsRes] = await Promise.all([getAdminSubmissions(), getAdminExams()]);
            setSubmissions(submissionsRes.data);
            setExams(examsRes.data);
            setFilterExam("all");
        } catch (err) { toast.error('Lỗi tải dữ liệu'); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const getExamName = (examId) => exams.find(e => e.id == examId)?.name || 'Không rõ';

    const handleDelete = (id) => {
        if (confirm('Bạn có chắc muốn xóa bài nộp này?')) {
            const promise = deleteSubmission(id).then(() => fetchData());
            toast.promise(promise, { loading: 'Đang xóa...', success: 'Xóa thành công!', error: 'Xóa thất bại!' });
        }
    };
    const filteredSubmissions = filterExam === 'all' ? submissions : submissions.filter(item => String(item.examId) === filterExam);

    return (
        <div className='pb-[2vh]'>
            <div className="flex flex-col justify-between items-start gap-2 md:flex-row md:items-center md:gap-4 mb-2">
                <h1 className="text-3xl font-bold">Danh sách Bài Nộp</h1>
                <div className="flex gap-2 flex-row md:gap-4">
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="h-10">  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading && 'animate-spin'}`} /> Làm mới </Button>

                    <Select value={filterExam} onValueChange={setFilterExam}>
                        <SelectTrigger className="w-full md:w-[220px]"> <SelectValue placeholder="Lọc theo bài test" /> </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả bài test</SelectItem>
                            {exams.map(exam => (<SelectItem key={exam.id} value={String(exam.id)}> {exam.name} </SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <Table><TableHeader><TableRow><TableHead>Học viên</TableHead><TableHead>Bài Test</TableHead><TableHead>Ngày nộp</TableHead><TableHead className="text-right">Hành Động</TableHead></TableRow></TableHeader>
                    <TableBody><AnimatePresence>
                        {isLoading ? (<TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>)
                            : filteredSubmissions.map(item => (
                                <motion.tr key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}>
                                    <TableCell>
                                        <div className="font-medium">{item.studentInfo.name}</div>
                                        <div className="text-sm text-muted-foreground">{item.studentInfo.email} | {item.studentInfo.phone}</div>
                                    </TableCell>
                                    <TableCell><Badge variant="secondary">{getExamName(item.examId)}</Badge></TableCell>
                                    <TableCell>{new Date(item.submissionDate).toLocaleString('vi-VN')}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button asChild variant="outline" size="sm"><a href={getDownloadUrl(item.fileName)} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /></a></Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        {!isLoading && filteredSubmissions.length === 0 && <TableRow><TableCell colSpan="4" className="text-center h-24"><Inbox className="mx-auto h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground mt-2">Chưa có bài nộp nào.</p></TableCell></TableRow>}
                    </AnimatePresence></TableBody></Table>
            </div>
        </div>
    );
};
export default SubmissionsAdminPage;