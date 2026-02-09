import { Link } from 'react-router-dom';
import { Card, CardContent, CardImage } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Cpu, BookOpen, ClipboardCheck, PenSquare } from 'lucide-react';
import { getDownloadUrl } from '@/api'; // Thêm import này

const PosterCard = ({ item, type }) => {
    const link = type === 'blog' ? `/blog/${item.slug}` : `/${type}s`; // Điều chỉnh link cho blog
    const title = type === 'blog' ? item.frontmatter.title : item.name;
    const icons = { software: Cpu, course: BookOpen, exam: ClipboardCheck, blog: PenSquare };
    const Icon = icons[type] || Cpu;

    // Lấy thumbnail:
    // - Đối với blog: item.frontmatter.thumbnail
    // - Đối với các loại khác: item.thumbnail
    const thumbnail = type === 'blog' ? item.frontmatter.thumbnail : item.thumbnail;

    return (
        <div className="basis-[45%] md:basis-1/4 lg:basis-1/5 flex-shrink-0 flex-grow-0 pl-4">
            <motion.div whileHover={{ y: -8 }} className="h-full">
                <Link to={link}>
                    <Card className="h-full group overflow-hidden transition-all duration-300 rounded-lg border-2 border-transparent hover:border-primary bg-card/50">
                        <CardImage className="bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/10">
                            {thumbnail ? (
                                <img 
                                    src={getDownloadUrl(thumbnail)} 
                                    alt={title} 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                />
                            ) : (
                                <Icon className="h-16 w-16 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                            )}
                        </CardImage>
                        <CardContent className="p-3">
                            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors duration-300">{title}</h3>
                        </CardContent>
                    </Card>
                </Link>
            </motion.div>
        </div>
    );
};

export default PosterCard;