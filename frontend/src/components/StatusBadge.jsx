// Shows a coloured pill based on the application status
export default function StatusBadge({ status }) {
  const styles = {
    applied: { background: "#dbeafe", color: "#1d4ed8" },
    interviewing: { background: "#fef9c3", color: "#a16207" },
    offer: { background: "#dcfce7", color: "#15803d" },
    rejected: { background: "#fee2e2", color: "#b91c1c" },
  };

  const style = styles[status] || styles.applied;

  return (
    <span className="status-badge" style={style}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
