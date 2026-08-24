// frontend/src/components/Tooltip.tsx
// Fixed: portal + viewport-aware flip so top-bar tooltips never clip at viewport/header edge

import React, { useState, useRef, useLayoutEffect, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  maxWidth = '260px',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; transform: string } | null>(null);
  const [effectivePos, setEffectivePos] = useState(position);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const compute = () => {
    const el = triggerRef.current;
    const tip = tooltipRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tipH = tip?.offsetHeight ?? 36;
    const tipW = tip?.offsetWidth ?? 180;
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let pos = position;

    // Auto-flip: if top would clip viewport (header at y=0), force bottom
    if (pos === 'top' && rect.top - tipH - gap < 4) pos = 'bottom';
    if (pos === 'bottom' && rect.bottom + tipH + gap > vh - 4) pos = 'top';
    if (pos === 'left' && rect.left - tipW - gap < 4) pos = 'right';
    if (pos === 'right' && rect.right + tipW + gap > vw - 4) pos = 'left';
    setEffectivePos(pos);

    let top = 0, left = 0, transform = '';
    switch (pos) {
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'top':
        top = rect.top - gap;
        left = rect.left + rect.width / 2;
        transform = 'translate(-50%, -100%)';
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - gap;
        transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        transform = 'translate(0, -50%)';
        break;
    }
    // Clamp horizontal inside viewport
    if (pos === 'top' || pos === 'bottom') {
      const half = tipW / 2;
      if (left - half < 4) left = half + 4;
      if (left + half > vw - 4) left = vw - half - 4;
    }
    setCoords({ top, left, transform });
  };

  useLayoutEffect(() => {
    if (!isVisible) return;
    compute();
    // measure after first paint
    const raf = requestAnimationFrame(compute);
    return () => cancelAnimationFrame(raf);
  }, [isVisible, content, position]);

  useEffect(() => {
    if (!isVisible) return;
    const onScroll = () => compute();
    const onResize = () => compute();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={isVisible ? id : undefined}
      >
        {children}
      </div>
      {isVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
            id={id}
            role="tooltip"
            className="tooltip-popover slide-up-enter"
            style={{
              position: 'fixed',
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              transform: coords?.transform ?? 'translateX(-50%)',
              maxWidth,
              zIndex: 9999,
              pointerEvents: 'none',
              // keep arrow logic via data-pos if needed
            }}
            data-pos={effectivePos}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};
