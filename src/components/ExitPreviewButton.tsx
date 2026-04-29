export default function ExitPreviewButton() {
  return (
    <a
      href="/api/disable-draft"
      className="fixed bottom-4 right-4 z-[60] inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-yellow-400 text-blue-700 font-extrabold text-xs tracking-[0.16em] uppercase shadow-[0_8px_24px_rgba(8,24,63,.35)] hover:-translate-y-px transition"
    >
      <span className="w-2 h-2 rounded-full bg-blue-700"></span>
      Exit preview
    </a>
  )
}
