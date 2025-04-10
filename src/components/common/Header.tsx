import React from 'react';
import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import bannerImage from '@/assets/images/banner.png';

interface HeaderProps {
  onMenuToggle?: () => void;
  onProfileClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  onProfileClick 
}) => {
  return (
    <header className="flex items-center justify-between p-2 px-4 bg-background">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onMenuToggle}
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      <img 
        src={bannerImage} 
        alt="PeekDiet Banner" 
        className="max-h-10 max-w-[200px] object-contain"
      />
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onProfileClick}
      >
        <User className="h-6 w-6" />
      </Button>
    </header>
  );
};

export default Header;
