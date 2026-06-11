import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  icon,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      confirmBtn:
        "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
      defaultIcon: <Trash2 size={20} />,
    },
    warning: {
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      confirmBtn:
        "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700",
      defaultIcon: <AlertTriangle size={20} />,
    },
    info: {
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      confirmBtn:
        "bg-primary text-white hover:opacity-90 active:opacity-80",
      defaultIcon: <AlertTriangle size={20} />,
    },
  };

  const v = variantStyles[variant];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-[9999] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-soft bg-white p-6 shadow-[0_24px_60px_-12px_rgba(40,40,90,0.25)]"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${v.iconBg} ${v.iconColor}`}>
              {icon || v.defaultIcon}
            </div>

            {/* Content */}
            <h3 className="text-[16px] font-semibold text-foreground">{title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
              {description}
            </p>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-[13px] font-medium text-foreground/70 transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`rounded-xl px-4 py-2 text-[13px] font-medium transition-all ${v.confirmBtn}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
