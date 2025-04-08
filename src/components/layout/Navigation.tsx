import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, X, 
  LayoutDashboard, 
  History, 
  Activity, 
  ChartLine, 
  Info, 
  User 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const NavLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: History },
    { name: 'Sessions', path: '/sessions', icon: Activity },
    { name: 'Track Glucose', path: '/track', icon: ChartLine },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="w-full bg-background shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        <Link 
          to="/" 
          className="flex items-center text-xl font-bold text-foreground"
        >
          PeekDiet
        </Link>

        {/* Hamburger Menu - ALWAYS VISIBLE */}
        <div className="block">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-500 hover:text-gray-700 md:block"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px]">
              <SheetHeader>
                <SheetTitle>PeekDiet Menu</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-4 py-4">
                {NavLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
