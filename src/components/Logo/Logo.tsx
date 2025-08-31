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
      {/* Fallback to text logo if image doesn't exist */}
      <div
        style={{
          width: styles.width,
          height: styles.height,
          background: 'linear-gradient(135deg, #00cc66 0%, #00aa55 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000000',
          fontSize: size === 'small' ? '16px' : size === 'large' ? '32px' : '24px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0, 204, 102, 0.3)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 204, 102, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 204, 102, 0.3)';
        }}
      >
        UA
      </div>
    </div>
  );
};

export default Logo;
