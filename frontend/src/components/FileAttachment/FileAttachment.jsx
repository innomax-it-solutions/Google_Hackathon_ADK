export function AttachmentChip({ file, onRemove }) {
  const isImage = file.type.startsWith("image/");
  const sizeMB  = (file.size / (1024 * 1024)).toFixed(1);

  return (
    <div className="
      inline-flex items-center gap-2 max-w-[200px]
      bg-[var(--color-surface-2)] border border-[var(--color-border)]
      rounded-xl px-3 py-1.5
    ">
      <span className="text-base flex-shrink-0">{isImage ? "🖼" : "📄"}</span>
      <span className="truncate text-[12px] font-medium text-[var(--color-text-secondary)]">
        {file.name}
      </span>
      <span className="text-[10px] text-[var(--color-text-tertiary)] flex-shrink-0">
        {sizeMB}MB
      </span>
      <button
        onClick={onRemove}
        className="
          flex-shrink-0 ml-0.5
          text-[var(--color-text-tertiary)]
          hover:text-red-500 transition-colors duration-100
        "
        title="Remove"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function MessageAttachments({ attachments }) {
  if (!attachments?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {attachments.map((f, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-1.5 bg-white/20 rounded-xl px-2.5 py-1 text-[12px] text-white/90"
        >
          <span>{f.type?.startsWith("image/") ? "🖼" : "📄"}</span>
          <span className="max-w-[120px] truncate">{f.name}</span>
        </div>
      ))}
    </div>
  );
}
