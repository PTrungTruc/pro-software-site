import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicBlogPost, getPublicBlogCategories } from '@/api';
import { Loader2, ArrowLeft } from 'lucide-react';
import { marked } from 'marked';
import { Badge } from '@/components/ui/badge';
import CommentsSection from '@/components/CommentsSection';
import { motion } from 'framer-motion';

const BlogPostPage = () => {
    const [post, setPost] = useState(null);

    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { slug } = useParams();

    useEffect(() => {
        setIsLoading(true);
        window.scrollTo(0, 0);
        Promise.all([getPublicBlogPost(slug), getPublicBlogCategories()])
            .then(([postRes, categoriesRes]) => { setPost(postRes.data ? postRes.data : []); setCategories(categoriesRes.data ? categoriesRes.data : []); })
            .catch(err => { console.error(err); setPost(null); })
            .finally(() => setIsLoading(false));
    }, [slug]);

    const getCategoryName = (categoryId) => categories.find(c => c.id == categoryId)?.name || '';

    if (isLoading) { return <div className="container mx-auto px-6 py-24 text-center"><Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" /></div>; }
    if (!post) { return <div className="container mx-auto px-6 py-24 text-center"><h1 className="text-4xl font-bold">404</h1><p className="text-muted-foreground mt-4">Không tìm thấy bài viết.</p><Link to="/blog" className="mt-6 inline-block text-primary">Quay lại Blog</Link></div>; }

    const createMarkup = () => ({ __html: marked.parse(post.htmlContent) });
    const contentId = `blog-${slug}`;
    const categoryName = getCategoryName(post.frontmatter.categoryId);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen w-full flex flex-col bg-card">
            <div className="flex-1 bg-muted justify-items-center">
                <div className="container min-w-full mx-1 px-4 py-10 md:py-12 h-full w-full">
                    <div className=" mx-auto h-full flex flex-col">
                        <Link to="/blog" className="inline-flex items-center mb-8 text-primary font-semibold hover:underline opacity-80 hover:opacity-100 transition-opacity">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách Blog
                        </Link>
                        <article className="flex-1 min-w-full">
                            <header className="mb-8 border-b border-[hsl(var(--white))] pb-8">
                                {categoryName && <Badge className="mb-4">{categoryName}</Badge>}
                                <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-4">{post.frontmatter.title}</h1>
                                <p className="text-muted-foreground mt-4 text-lg">
                                    {new Date(post.frontmatter.date).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                </p>
                            </header>
                            <div
                                className="prose prose-lg dark:prose-invert max-w-none prose-h2:font-bold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-lg prose-blockquote:border-primary"
                                dangerouslySetInnerHTML={createMarkup()}
                            />
                        </article>
                        <CommentsSection contentId={contentId} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
export default BlogPostPage;