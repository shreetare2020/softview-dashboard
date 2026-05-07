import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => { unsub(); clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "firms"), (s) => 
      setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
  }, [user]);

  if (loading) return <div style={{padding: "50px", textAlign: "center"}}>Verifying Portal Access...</div>;

  if (!user) {
    return (
      <div style={{height: "100vh", background: "#1a2a44", display: "flex", justifyContent: "center", alignItems: "center"}}>
        <div className="card" style={{width: "320px", textAlign: "center"}}>
          <h2 style={{color: "#1a2a44"}}>SECURE LOGIN</h2>
          <button onClick={() => signInWithEmailAndPassword(auth, "dashboardadmin@gmail.com", "password")}>Access Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="sidebar">
        <h2>BANKING SYSTEM</h2>
        <div className={`nav-link ${activePage === "Dashboard" ? "active" : ""}`} onClick={() => setActivePage("Dashboard")}>📊 Dashboard</div>
        <div className={`nav-link ${activePage === "Firm Master" ? "active" : ""}`} onClick={() => setActivePage("Firm Master")}>🏢 Firm Master</div>
        <button onClick={() => signOut(auth)} style={{marginTop: "20px", color: "red", background: "none", border: "none", cursor: "pointer"}}>Log Out</button>
      </div>

      <div className="main-body">
        <h2 style={{color: "#1a2a44"}}>{activePage}</h2>
        {activePage === "Firm Master" && (
          <div className="card">
            <h3>Add New Firm</h3>
            {/* Form inputs would go here */}
            <table>
              <thead><tr><th>Sr.</th><th>Firm Name</th></tr></thead>
              <tbody>{firms.map((f, i) => <tr key={i}><td>{i+1}</td><td>{f.name}</td></tr>)}</tbody>
            </table>
          </div>
        )}

        <div className="footer-right">
          <div className="clock-text">{time.toLocaleString()}</div>
          <div className="dev-text">Developed by Softview Technologies | 7972084304</div>
        </div>
      </div>
    </div>
  );
}