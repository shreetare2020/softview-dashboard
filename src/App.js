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

  if (loading) return <div className="loader">Loading Dashboard...</div>;

  if (!user) {
    return (
      <div className="loginPage">
        {/* Aapka Login Card */}
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>BANKING SYSTEM</h2>
        <div className="nav-link" onClick={() => setActivePage("Dashboard")}>📊 Dashboard</div>
        <div className="nav-link" onClick={() => setActivePage("Firm Master")}>🏢 Firm Master</div>
        {/* Logout Button */}
      </div>
      
      <div className="main-content">
        <h2 style={{color: '#1a2a44'}}>{activePage}</h2>
        {activePage === "Firm Master" && (
          <div className="card">
            <h3>Add New Firm</h3>
            {/* Form Inputs here */}
            <table className="pro-table">
               {/* Firm Data Table */}
            </table>
          </div>
        )}

        <div className="footer-info">
          <div className="clock-box">{time.toLocaleDateString()} | {time.toLocaleTimeString()}</div>
          <div className="dev-credit">Developed by Softview Technologies | 7972084304</div>
        </div>
      </div>
    </div>
  );
}