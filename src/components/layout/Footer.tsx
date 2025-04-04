import React from 'react';

// This version number should be updated whenever significant changes are made
const APP_VERSION = '1.2.0';

const Footer: React.FC = () => {
  return (
    <footer className="border-t py-4 mt-auto">
      <div className="container flex justify-between items-center text-xs text-muted-foreground">
        <div>
          <span>© 2025 PeekDiet</span>
        </div>
        <div>
          <span>Version {APP_VERSION}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
