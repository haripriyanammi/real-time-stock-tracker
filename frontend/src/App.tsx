// src/App.tsx
import { useEffect, useState } from "react";
import Ably from "ably";
import AlertForm from "./components/AlertForm";
import HistoryList from "./components/HistoryList";
import type { Alert } from "./types";
import ablyKey from "./config/ably";

export default function App() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Fetch all alerts from backend
    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/alerts");
        const data: Alert[] = await res.json();
        setAlerts(data);
      } catch (err) {
        console.error("Error fetching alerts:", err);
      }
    };

    fetchAlerts();

    // Ably real-time subscription
    const ably = new Ably.Realtime({ key: ablyKey });
    const channel = ably.channels.get("alerts");

    channel.subscribe("alert-created", (msg) => {
      const newAlert: Alert = msg.data as Alert;
      setAlerts((prev) => [newAlert, ...prev]);

      // Optional: play audio automatically if exists
      if (newAlert.audio_url) {
        const audio = new Audio(newAlert.audio_url);
        audio.play().catch(console.error);
      }
    });

    return () => {
      channel.unsubscribe();
      ably.close();
    };
  }, []);

  const handleFormSubmit = async (symbol: string, target: number) => {
    console.log("Submitting alert:", symbol, target);

    try {
      const res = await fetch("http://localhost:5000/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, targetprice: target }),

      });
     const result = await res.json();
const newAlert: Alert = result.alert;
setAlerts((prev) => [newAlert, ...prev]);
 
    } catch (err) {
      console.error("Error creating alert:", err);
    }
  };

  return (
    <div style={{ padding: "20px", minHeight: "100vh", backgroundColor: "#242424", color: "white" }}>
      <h1>📈 Stock Alert Tracker</h1>
      <AlertForm onSubmit={handleFormSubmit} />
      <HistoryList alerts={alerts} />
    </div>
  );
}
