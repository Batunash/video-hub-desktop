import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState(false);

  const refreshStatus = async () => {
    const res = await window.api.invoke("server:status");
    setStatus(res.running);
  };

  const startServer = async () => {
    await window.api.invoke("server:start");
    refreshStatus();
  };

  const stopServer = async () => {
    await window.api.invoke("server:stop");
    refreshStatus();
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>VideoHub Server</h1>

        <p style={styles.statusText}>
          Status:{" "}
          <span
            style={{
              ...styles.badge,
              backgroundColor: status ? "#22c55e" : "#ef4444",
            }}
          >
            {status ? "Running" : "Stopped"}
          </span>
        </p>

        {status ? (
          <button style={styles.stopBtn} onClick={stopServer}>
            Stop Server
          </button>
        ) : (
          <button style={styles.startBtn} onClick={startServer}>
            Start Server
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#0f0f0f",
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    color: "white",
  },

  card: {
    padding: "40px",
    borderRadius: "12px",
    backgroundColor: "#1a1a1a",
    minWidth: "350px",
    textAlign: "center",
    boxShadow: "0 0 15px rgba(0,0,0,0.4)",
  },

  title: {
    marginBottom: "20px",
    fontSize: "26px",
    fontWeight: "bold",
  },

  statusText: {
    marginBottom: "25px",
    fontSize: "18px",
  },

  badge: {
    padding: "6px 12px",
    fontWeight: "bold",
    borderRadius: "8px",
    marginLeft: "10px",
  },

  startBtn: {
    backgroundColor: "#22c55e",
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    width: "100%",
    transition: "0.2s",
  },

  stopBtn: {
    backgroundColor: "#ef4444",
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    width: "100%",
    transition: "0.2s",
  },
};
