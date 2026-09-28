export function PageSpinner({ label = "Loading" }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center" role="status">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
