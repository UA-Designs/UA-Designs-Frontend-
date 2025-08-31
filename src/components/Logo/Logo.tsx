import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

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
          container: { fontSize: '16px', gap: '4px' },
          ua: { fontSize: '20px', lineHeight: '20px' },
          designs: { fontSize: '12px', lineHeight: '12px' }
        };
      case 'large':
        return {
          container: { fontSize: '24px', gap: '8px' },
          ua: { fontSize: '36px', lineHeight: '36px' },
          designs: { fontSize: '18px', lineHeight: '18px' }
        };
      default: // medium
        return {
          container: { fontSize: '18px', gap: '6px' },
          ua: { fontSize: '28px', lineHeight: '28px' },
          designs: { fontSize: '14px', lineHeight: '14px' }
        };
    }
  };

  const styles = getSizeStyles();

  return (
    <div 
      className={`ua-designs-logo ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: styles.container.gap,
        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
        fontWeight: 'bold',
        ...styles.container
      }}
    >
      {/* UA Block Letters */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'fit-content',
          height: styles.ua.lineHeight,
        }}
      >
        {/* 3D UA Block Effect */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0d0d0d 100%)',
            border: '2px solid #00ff00',
            borderRadius: '4px',
            padding: '8px 16px',
            boxShadow: `
              0 0 20px rgba(0, 255, 0, 0.4),
              0 4px 8px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            transform: 'perspective(100px) rotateX(5deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          <Text
            style={{
              fontSize: styles.ua.fontSize,
              lineHeight: styles.ua.lineHeight,
              fontWeight: '900',
              color: '#ffffff',
              textShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
              letterSpacing: '2px',
              fontFamily: "'Inter', 'SF Pro Display', sans-serif",
            }}
          >
            UA
          </Text>
          
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
      </div>

      {/* Designs Script Text */}
      {showText && (
        <Text
          style={{
            fontSize: styles.designs.fontSize,
            lineHeight: styles.designs.lineHeight,
            color: '#00ff00',
            fontFamily: "'Inter', 'SF Pro Display', sans-serif",
            fontWeight: '300',
            fontStyle: 'italic',
            textShadow: '0 0 8px rgba(0, 255, 0, 0.4)',
            letterSpacing: '1px',
            transform: 'translateY(-2px)',
          }}
        >
          designs
        </Text>
      )}
    </div>
  );
};

export default Logo;
