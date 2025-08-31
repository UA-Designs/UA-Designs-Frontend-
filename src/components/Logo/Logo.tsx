import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  showText = true, 
  className = '' 
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: '60px',
          height: '36px'
        };
      case 'large':
        return {
          width: '120px',
          height: '72px'
        };
      default: // medium
        return {
          width: '90px',
          height: '54px'
        };
    }
  };

  const styles = getSizeStyles();

  return (
    <div 
      className={`ua-designs-logo ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src="/ua-designs-logo.svg"
        alt="UA Designs Logo"
        style={{
          width: styles.width,
          height: styles.height,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 10px rgba(0, 255, 0, 0.3))',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'drop-shadow(0 0 15px rgba(0, 255, 0, 0.6)) scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'drop-shadow(0 0 10px rgba(0, 255, 0, 0.3)) scale(1)';
        }}
      />
    </div>
  );
};

export default Logo;
