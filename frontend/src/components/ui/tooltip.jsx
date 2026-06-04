import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

const POSITIONS = {
  top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left:   "right-full top-1/2 -translate-y-1/2 mr-2",
  right:  "left-full top-1/2 -translate-y-1/2 ml-2",
};

/**
 * Tooltip — wraps any trigger element.
 *
 * <Tooltip content="Copy message" side="top">
 *   <Button ...>...</Button>
 * </Tooltip>
 */
export function Tooltip({ children, content, side = "top", className, ...rest }) {
  const [visible, setVisible] = useState(false);

  if (!content) return children;

  // Forward any injected props (e.g. onClick / aria-* added by DropdownMenuTrigger
  // asChild) onto the wrapper so the trigger actually toggles the menu.
  return (
    <div
      {...rest}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1    }}
            exit={{ opacity: 0, scale: 0.88    }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className={cn(
              "absolute z-[60] px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium",
              "bg-[var(--color-text-primary)] text-[var(--color-bg)]",
              "whitespace-nowrap pointer-events-none shadow-lg",
              POSITIONS[side],
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
