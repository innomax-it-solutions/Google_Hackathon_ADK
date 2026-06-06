import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

/**
 * Inline, animated alert for form-level errors (e.g. invalid credentials).
 * Mounts/unmounts with a smooth height+fade transition.
 */
export default function FormAlert({ message }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: "auto", marginBottom: 4 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <motion.div
            role="alert"
            initial={{ x: 0 }}
            animate={{ x: [0, -6, 6, -4, 4, 0] }}
            transition={{ duration: 0.4 }}
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-[18px] w-[18px] flex-shrink-0" />
            <span className="leading-relaxed">{message}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
