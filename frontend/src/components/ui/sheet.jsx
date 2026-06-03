import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * Sheet — bottom drawer for mobile overlay panels.
 * Controlled: parent manages open/onClose state.
 */
export function Sheet({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] rounded-t-3xl max-h-[88vh] overflow-hidden flex flex-col safe-bottom"
          >
            {/* Drag handle */}
            <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
            </div>
            <div className="overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function SheetHeader({ className, children, ...props }) {
  return (
    <div className={cn("px-5 pt-3 pb-4 border-b border-[var(--color-border-subtle)]", className)} {...props}>
      {children}
    </div>
  );
}

export function SheetTitle({ className, children, ...props }) {
  return (
    <h2 className={cn("text-[16px] font-semibold text-[var(--color-text-primary)]", className)} {...props}>
      {children}
    </h2>
  );
}

export function SheetDescription({ className, children, ...props }) {
  return (
    <p className={cn("text-[13px] text-[var(--color-text-tertiary)] mt-0.5", className)} {...props}>
      {children}
    </p>
  );
}

export function SheetContent({ className, children, ...props }) {
  return (
    <div className={cn("px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}
