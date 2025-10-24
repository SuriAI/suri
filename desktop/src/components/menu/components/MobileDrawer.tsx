import { useEffect } from 'react';
import type { MenuSection } from '../types';
import type { AttendanceGroup } from '../../../types/recognition';
import { MobileHeader } from './MobileHeader';
import { MobileNav } from './MobileNav';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: MenuSection;
  onSectionChange: (section: MenuSection) => void;
  selectedGroup: AttendanceGroup | null;
}


export function MobileDrawer({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
  selectedGroup,
}: MobileDrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-black
          border-r border-white/10 z-50 lg:hidden
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <MobileHeader onClose={onClose} />

        {/* Navigation */}
        <MobileNav
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          selectedGroup={selectedGroup}
          onClose={onClose}
        />
      </div>
    </>
  );
}

