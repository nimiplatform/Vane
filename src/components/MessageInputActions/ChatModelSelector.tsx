import { BrainCog } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function ChatModelSelector() {
  return <Link to="/settings?section=ai" className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-black/60 dark:text-white/60"><BrainCog size={16} /> AI models</Link>;
}
