import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function SettingsButton() {
  return <Link to="/settings" aria-label="Settings" className="rounded-lg p-2 text-black/60 dark:text-white/60 hover:bg-light-200 dark:hover:bg-dark-200"><Settings size={22} /></Link>;
}
