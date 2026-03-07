import React from 'react';
import { ROLE_LABELS, ROLE_COLORS, type Role } from '../../lib/rbac';

interface TierBadgeProps {
  role: Role | string | null | undefined;
  style?: React.CSSProperties;
}

/**
 * Small colored badge showing the user's role / tier.
 * Keeps users aware of their access level without confusion about missing buttons.
 */
export function TierBadge({ role, style }: TierBadgeProps) {
  if (!role) return null;

  const colors = ROLE_COLORS[role as Role] ?? { bg: '#f3f4f6', text: '#4b5563' };
  const label  = ROLE_LABELS[role as Role] ?? role;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: colors.bg,
        color: colors.text,
        ...style,
      }}
    >
      {label}
    </span>
  );
}
