// The summary cards at the top of the dashboard
export default function StatCard({ label, count, color }) {
  return (
    <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <p className="stat-count" style={{ color }}>{count}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}