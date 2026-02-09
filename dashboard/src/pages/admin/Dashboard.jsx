import { useEffect, useState } from 'react';
import { getAdminStats } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, Pencil, Mail, BookOpen, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, to }) => (
    <Link to={to} className="block group">
        <Card className="shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className={`h-5 w-5 transition-colors ${color} group-hover:${color}`} />
          </CardHeader>
          <CardContent><div className="text-4xl font-bold group-hover:text-primary transition-colors">{value}</div></CardContent>
        </Card>
    </Link>
);

const DashboardPage = () => {
    const [stats, setStats] = useState({ softwareCount: 0, blogCount: 0, requestCount: 0, courseCount: 0, examCount: 0 });
    
    useEffect(() => {
        getAdminStats()
            .then(res => setStats(res.data))
            .catch(err => console.error("Failed to fetch admin stats", err));
    }, []);

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><StatCard to="/admin/requests" title="Yêu Cầu Mới" value={stats.requestCount} icon={Mail} color="text-red-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard to="/admin/software" title="Phần Mềm" value={stats.softwareCount} icon={HardDrive} color="text-blue-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard to="/admin/courses" title="Giáo trình" value={stats.courseCount} icon={BookOpen} color="text-purple-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard to="/admin/exams" title="Bài Test" value={stats.examCount} icon={ClipboardCheck} color="text-orange-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard to="/admin/blog" title="Bài Viết Blog" value={stats.blogCount} icon={Pencil} color="text-green-500" /></motion.div>
            </motion.div>
        </div>
    );
};
export default DashboardPage;