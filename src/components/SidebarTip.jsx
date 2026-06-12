// Hover label shown to the right of an icon while a sidebar rail is collapsed.
// The parent element must be `group relative` for the hover transition to work.
export default function SidebarTip({ children }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150 group-hover:opacity-100">
      {children}
    </span>
  )
}
