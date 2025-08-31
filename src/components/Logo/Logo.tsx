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
          container: { width: '60px', height: '40px' },
          uaBlock: { width: '50px', height: '25px' },
          uaText: { fontSize: '14px' },
          designsText: { fontSize: '8px', top: '30px' }
        };
      case 'large':
        return {
          container: { width: '120px', height: '80px' },
          uaBlock: { width: '100px', height: '50px' },
          uaText: { fontSize: '28px' },
          designsText: { fontSize: '16px', top: '60px' }
        };
      default: // medium
        return {
          container: { width: '90px', height: '60px' },
          uaBlock: { width: '75px', height: '37px' },
          uaText: { fontSize: '20px' },
          designsText: { fontSize: '12px', top: '45px' }
        };
    }
  };

  const styles = getSizeStyles();

  return (
    <div 
      className={`ua-designs-logo ${className}`}
      style={{
        position: 'relative',
        width: styles.container.width,
        height: styles.container.height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* UA Block - 3D Effect */}
      <div
        style={{
          position: 'relative',
          width: styles.uaBlock.width,
          height: styles.uaBlock.height,
          background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0d0d0d 100%)',
          border: '2px solid #00ff00',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `
            0 0 20px rgba(0, 255, 0, 0.4),
            0 4px 8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          transform: 'perspective(100px) rotateX(5deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* UA Text */}
        <div
          style={{
            fontSize: styles.uaText.fontSize,
            fontWeight: '900',
            color: '#ffffff',
            textShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
            letterSpacing: '2px',
            fontFamily: "'Inter', 'SF Pro Display', sans-serif",
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          UA
        </div>
        
        {/* Neon Glow Effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '1px solid #00ff00',
            borderRadius: '4px',
            boxShadow: '0 0 15px rgba(0, 255, 0, 0.6)',
            animation: 'neonPulse 2s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Designs Script Text */}
      {showText && (
        <div
          style={{
            position: 'absolute',
            top: styles.designsText.top,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: styles.designsText.fontSize,
            color: '#00ff00',
            fontFamily: "'Inter', 'SF Pro Display', sans-serif",
            fontWeight: '300',
            fontStyle: 'italic',
            textShadow: '0 0 8px rgba(0, 255, 0, 0.4)',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
          }}
        >
          designs
        </div>
      )}
    </div>
  );
};

export default Logo;
