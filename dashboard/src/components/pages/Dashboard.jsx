import { useEffect, useState } from 'react';
import { getStats } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hdd, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{value}</div>
      </CardContent>
    </Card>
);

const DashboardPage = () => {
    const [stats, setStats] = useState({ softwareCount: 0, blogCount: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await getStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };
        fetchStats();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <motion.div 
                className="grid gap-6 md:grid-cols-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <StatCard title="Phần Mềm" value={stats.softwareCount} icon={Hdd} color="text-blue-500" />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <StatCard title="Bài Viết Blog" value={stats.blogCount} icon={Pencil} color="text-green-500" />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default DashboardPage;