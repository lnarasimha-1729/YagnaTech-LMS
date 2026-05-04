export default function NoData({ message = 'No data available', className = '' }) {
  return (
    <div className={`text-center text-sm text-muted-foreground py-8 ${className}`}>
      {message}
    </div>
  );
}
