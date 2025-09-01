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
      {/* UA Designs Logo Image */}
      <img
        src="/UA LOGO.jpg"
        alt="UA Designs"
        style={{
          width: styles.width,
          height: styles.height,
          objectFit: 'contain',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onError={(e) => {
          // Fallback to text logo if image doesn't exist
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) {
            fallback.style.display = 'flex';
          }
        }}
      />
      {/* Fallback text logo (hidden by default) */}
      <div
        style={{
          width: styles.width,
          height: styles.height,
          background: 'linear-gradient(135deg, #009944 0%, #007733 100%)',
          borderRadius: '12px',
          display: 'none',
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
