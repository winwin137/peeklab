import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:bg-primary/90"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div 
        className={`
          fixed top-0 right-0 h-full 
          w-[90vw] max-w-[500px] 
          bg-white dark:bg-gray-800 
          shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          z-40 overflow-y-auto
        `}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Menu</h2>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav>
            <ul className="space-y-4">
              {[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Profile', href: '/profile' },
                { label: 'History', href: '/history' },
                { label: 'Meal Sessions', href: '/sessions' },
                { label: 'Track Glucose', href: '/track' },
                { label: 'About', href: '/about' }
              ].map((item) => (
                <li key={item.href}>
                  <a 
                    href={item.href}
                    className="block py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
