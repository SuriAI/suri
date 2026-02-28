import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  position?: TooltipPosition;
  delay?: number;
  disabled?: boolean;
}

interface TooltipCoords {
  top: number;
  left: number;
  arrowStyle: React.CSSProperties;
}

const TOOLTIP_OFFSET = 8;
const ARROW_SIZE = 5;
const SCREEN_PADDING = 8;

function computeCoords(
  triggerRect: DOMRect,
  tw: number,
  th: number,
  preferred: TooltipPosition,
): { top: number; left: number; actualPosition: TooltipPosition } {
  const { innerWidth: vw, innerHeight: vh } = window;
  const midX = triggerRect.left + triggerRect.width / 2;
  const midY = triggerRect.top + triggerRect.height / 2;

  const slots: Record<TooltipPosition, { top: number; left: number }> = {
    top: {
      top: triggerRect.top - th - TOOLTIP_OFFSET - ARROW_SIZE,
      left: midX - tw / 2,
    },
    bottom: {
      top: triggerRect.bottom + TOOLTIP_OFFSET + ARROW_SIZE,
      left: midX - tw / 2,
    },
    left: {
      top: midY - th / 2,
      left: triggerRect.left - tw - TOOLTIP_OFFSET - ARROW_SIZE,
    },
    right: {
      top: midY - th / 2,
      left: triggerRect.right + TOOLTIP_OFFSET + ARROW_SIZE,
    },
  };

  const fits: Record<TooltipPosition, boolean> = {
    top: slots.top.top >= SCREEN_PADDING,
    bottom: slots.bottom.top + th <= vh - SCREEN_PADDING,
    left: slots.left.left >= SCREEN_PADDING,
    right: slots.right.left + tw <= vw - SCREEN_PADDING,
  };

  const order: TooltipPosition[] = [
    preferred,
    "top",
    "bottom",
    "left",
    "right",
  ];
  const actual = order.find((p) => fits[p]) ?? preferred;

  let { top, left } = slots[actual];
  left = Math.max(SCREEN_PADDING, Math.min(left, vw - tw - SCREEN_PADDING));
  top = Math.max(SCREEN_PADDING, Math.min(top, vh - th - SCREEN_PADDING));

  return { top, left, actualPosition: actual };
}

function buildArrowStyle(
  actual: TooltipPosition,
  triggerRect: DOMRect,
  tooltipLeft: number,
  tooltipTop: number,
): React.CSSProperties {
  const midX = triggerRect.left + triggerRect.width / 2;
  const midY = triggerRect.top + triggerRect.height / 2;
  const solidDark = `${ARROW_SIZE}px solid #111214`;
  const transparent = `${ARROW_SIZE}px solid transparent`;

  if (actual === "top") {
    return {
      position: "absolute",
      top: "100%",
      left: Math.max(8, midX - tooltipLeft),
      transform: "translateX(-50%)",
      borderLeft: transparent,
      borderRight: transparent,
      borderTop: solidDark,
      borderBottom: "none",
      width: 0,
      height: 0,
    };
  }
  if (actual === "bottom") {
    return {
      position: "absolute",
      bottom: "100%",
      left: Math.max(8, midX - tooltipLeft),
      transform: "translateX(-50%)",
      borderLeft: transparent,
      borderRight: transparent,
      borderBottom: solidDark,
      borderTop: "none",
      width: 0,
      height: 0,
    };
  }
  if (actual === "left") {
    return {
      position: "absolute",
      left: "100%",
      top: Math.max(8, midY - tooltipTop),
      transform: "translateY(-50%)",
      borderTop: transparent,
      borderBottom: transparent,
      borderLeft: solidDark,
      borderRight: "none",
      width: 0,
      height: 0,
    };
  }
  // right
  return {
    position: "absolute",
    right: "100%",
    top: Math.max(8, midY - tooltipTop),
    transform: "translateY(-50%)",
    borderTop: transparent,
    borderBottom: transparent,
    borderRight: solidDark,
    borderLeft: "none",
    width: 0,
    height: 0,
  };
}

type InjectableProps = React.HTMLAttributes<HTMLElement> & {
  ref?: React.Ref<Element>;
};

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 500,
  disabled = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);

  const triggerRef = useRef<Element>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  const show = useCallback(() => {
    if (disabled || !content) return;
    clearTimer();
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [disabled, content, clearTimer, delay]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (!visible || !triggerRef.current) return;

    const measure = () => {
      if (!triggerRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tw = tooltipRef.current?.offsetWidth ?? 160;
      const th = tooltipRef.current?.offsetHeight ?? 30;

      const { top, left, actualPosition } = computeCoords(
        triggerRect,
        tw,
        th,
        position,
      );
      const arrowStyle = buildArrowStyle(
        actualPosition,
        triggerRect,
        left,
        top,
      );
      setCoords({ top, left, arrowStyle });
    };

    measure();
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [visible, position, content]);

  if (!content || disabled) return children;

  const child = React.cloneElement<InjectableProps>(
    children as ReactElement<InjectableProps>,
    {
      ref: triggerRef,
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        show();
        const prev = (children.props as InjectableProps).onMouseEnter;
        if (prev) prev(e);
      },
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
        hide();
        const prev = (children.props as InjectableProps).onMouseLeave;
        if (prev) prev(e);
      },
      onFocus: (e: React.FocusEvent<HTMLElement>) => {
        show();
        const prev = (children.props as InjectableProps).onFocus;
        if (prev) prev(e);
      },
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        hide();
        const prev = (children.props as InjectableProps).onBlur;
        if (prev) prev(e);
      },
    },
  );

  return (
    <>
      {child}
      {createPortal(
        <AnimatePresence>
          {visible && coords && (
            <motion.div
              ref={tooltipRef}
              role="tooltip"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              className="fixed z-[99999] pointer-events-none"
              style={{ top: coords.top, left: coords.left }}
            >
              <div className="relative bg-[#111214] text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.65)] border border-white/[0.08] max-w-[260px] whitespace-nowrap">
                {content}
                <div style={coords.arrowStyle} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
