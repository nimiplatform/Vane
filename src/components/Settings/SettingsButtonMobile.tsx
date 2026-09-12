import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function SettingsButtonMobile() {
  return <Link to="/settings" aria-label="Settings" className="p-2 text-black/60 dark:text-white/60"><Settings size={20} /></Link>;
}
