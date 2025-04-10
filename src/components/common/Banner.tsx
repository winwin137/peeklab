import React from 'react';
import peekdietBannerLogo from '@/assets/images/cropped-peekdiet_com_icon-380x107.png';

interface BannerProps {
  className?: string;
}

const Banner: React.FC<BannerProps> = ({ className = '' }) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <img 
        src={peekdietBannerLogo} 
        alt="PeekDiet Banner Logo" 
        className="max-w-[250px] h-auto"
      />
    </div>
  );
};

export default Banner;
