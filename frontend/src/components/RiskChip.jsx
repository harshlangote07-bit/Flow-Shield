export default function RiskChip({ risk, children }) {
  return (
    <span className={`risk-chip ${risk}`}>
      {children || risk}
    </span>
  );
}