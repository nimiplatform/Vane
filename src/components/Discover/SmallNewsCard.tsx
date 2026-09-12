import { Discover } from '@/app/discover/page';
import { Link } from 'react-router-dom';

const SmallNewsCard = ({ item }: { item: Discover }) => (
  <Link
    to={`/?q=${encodeURIComponent(`Summary: ${item.url}`)}`}
    className="rounded-3xl overflow-hidden bg-light-secondary dark:bg-dark-secondary shadow-sm shadow-light-200/10 dark:shadow-black/25 group flex flex-col"
  >
    {item.thumbnail && (
      <div className="relative aspect-video overflow-hidden">
        <img
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          src={item.thumbnail}
          alt={item.title}
        />
      </div>
    )}
    <div className="p-4">
      <h3 className="font-semibold text-sm mb-2 leading-tight line-clamp-2 group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition duration-200">
        {item.title}
      </h3>
      <p className="text-black/60 dark:text-white/60 text-xs leading-relaxed line-clamp-2">
        {item.content}
      </p>
    </div>
  </Link>
);

export default SmallNewsCard;
