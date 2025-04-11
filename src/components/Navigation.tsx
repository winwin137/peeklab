import { Link, useLocation } from 'react-router-dom';
import { History, Activity, LineChart, LayoutDashboard, LogOut, Settings, User, Menu, X, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import bannerImage from '@/assets/images/banner.png';

const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Don't render on login page
  if (location.pathname === '/login') return null;

  const isActive = (path: string) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/');
  };

  const navLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/sessions', icon: Activity, label: 'Sessions' },
    { path: '/track', icon: LineChart, label: 'Track Glucose' },
    { path: '/about', icon: Info, label: 'About' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Hamburger menu - ALWAYS VISIBLE */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isMobileMenuOpen ? (
                <X className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 stroke-[3] text-gray-500 hover:text-gray-700" />
              ) : (
                <Menu className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 stroke-[3] text-gray-500 hover:text-gray-700" />
              )}
            </Button>
          </div>
          
          {/* Banner Image - Centered */}
          <div className="flex-grow flex justify-center items-center">
            <img 
              src={bannerImage} 
              alt="PeekDiet Banner" 
              className="max-h-10 max-w-[200px] object-contain"
            />
          </div>
          
          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                      <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile menu - ALWAYS VISIBLE WHEN OPEN */}
      {isMobileMenuOpen && (
        <div className="block">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-peekdiet-primary text-white'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <link.icon className="h-5 w-5 mr-2" />
                  {link.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;