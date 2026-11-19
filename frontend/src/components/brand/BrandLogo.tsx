import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { icon: 22, textClass: 'text-[15px]' },
  md: { icon: 26, textClass: 'text-[16px]' },
  lg: { icon: 34, textClass: 'text-[22px]' },
} as const;

/**
 * Componente oficial del logotipo de Vertical.
 * Isotipo geométrico de tres barras verticales ascendentes que construyen una "V"
 * en monocromo puro (`currentColor`: #09090B en Light / #FAFAFA en Dark).
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  const { icon, textClass } = SIZE_MAP[size];

  return (
    <span
      className={`inline-flex items-center gap-2.5 select-none text-[var(--text-primary)] ${className}`}
      aria-label="Vertical"
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M4.5 9.95C4.5 9.28726 5.03726 8.75 5.7 8.75H9.3C9.96274 8.75 10.5 9.28726 10.5 9.95V21.25L4.5 15.25V9.95Z"
          fill="currentColor"
        />
        <path
          d="M13 13.95C13 13.2873 13.5373 12.75 14.2 12.75H17.8C18.4627 12.75 19 13.2873 19 13.95V23.75L16 26.75L13 23.75V13.95Z"
          fill="currentColor"
        />
        <path
          d="M21.5 6.45C21.5 5.78726 22.0373 5.25 22.7 5.25H26.3C26.9627 5.25 27.5 5.78726 27.5 6.45V15.25L21.5 21.25V6.45Z"
          fill="currentColor"
        />
      </svg>
      {variant === 'full' && (
        <span className={`font-bold tracking-[-0.03em] leading-none whitespace-nowrap ${textClass}`}>
          Vertical
        </span>
      )}
    </span>
  );
};
