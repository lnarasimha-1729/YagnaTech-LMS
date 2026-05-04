export default function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;
  const go = (p) => onPageChange && onPageChange(Math.max(1, Math.min(totalPages, p)));
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button className="px-3 py-1 text-sm border rounded-md disabled:opacity-50" disabled={page <= 1} onClick={() => go(page - 1)}>Prev</button>
      <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
      <button className="px-3 py-1 text-sm border rounded-md disabled:opacity-50" disabled={page >= totalPages} onClick={() => go(page + 1)}>Next</button>
    </div>
  );
}
