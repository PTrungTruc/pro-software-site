import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Skeleton } from '@/components/ui/skeleton';
import PosterCard from './PosterCard';

const ContentCarousel = ({ title, items, type, isLoading }) => {
    const [emblaRef] = useEmblaCarousel({ align: 'start', dragFree: true, containScroll: 'trimSnaps' });

    return (
        <section className="py-10">
            <h2 className="text-3xl font-bold mb-6 container px-6">{title}</h2>
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex -ml-4">
                    {isLoading ? Array.from({length: 8}).map((_, i) => 
                        <div key={i} className="basis-[45%] md:basis-1/4 lg:basis-1/5 flex-shrink-0 flex-grow-0 pl-4">
                            <Skeleton className="aspect-[3/4] rounded-lg" />
                        </div>)
                    : items.map(item => <PosterCard key={item.id || item.slug} item={item} type={type} />)}
                </div>
            </div>
        </section>
    );
};

export default ContentCarousel;