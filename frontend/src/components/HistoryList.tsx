import type { Alert } from "../types";

interface HistoryListProps {
  alerts: Alert[];
}

export default function HistoryList({ alerts }: HistoryListProps) {
  return (
    <div style={{ marginTop: "20px" }}>
      <h2>📜 Alert History</h2>
      {alerts.length === 0 ? (
        <p>No alerts yet.</p>
      ) : (
        <ul>
          {alerts.map((alert) => (
            <li key={alert.id} style={{ marginBottom: "10px" }}>
              <strong>{alert.stock ? alert.stock.toUpperCase() : "UNKNOWN"}</strong> | Target:{" "}
              {alert.alert_price} | Current: {alert.stock_price} |{" "}
              <span
                style={{
                  color:
                    alert.alert_type === "rise"
                      ? "red"
                      : alert.alert_type === "fall"
                      ? "green"
                      : "white",
                  fontWeight: "bold",
                }}
              >
                {alert.alert_type ? alert.alert_type.toUpperCase() : "UNKNOWN"}
              </span>
              {alert.audio_url && (
                <audio src={alert.audio_url} controls autoPlay style={{ marginLeft: "10px" }} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
