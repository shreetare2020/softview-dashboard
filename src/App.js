import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Firestore Data
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [userMaster, setUserMaster] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { unsub(); clearInterval(timer); };
  }, []);

  // Fetch Data
  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUserMaster(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  // Excel Export with Color Logic
  const handleExport = (data, name) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${name}.xlsx`);
  };

  if (loading) return <div className="loader">Initializing Security...</div>;

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Banking Portal Login</h1>
          <form onSubmit={(e) => {
            e.preventDefault();
            signInWithEmailAndPassword(auth, e.target.email.value, e.target.password.value);
          }}>
            <input name="email" type="email" placeholder="Email Address" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit">LOGIN</button>
          </form>
        </div>
        <div className="login-footer">
          Developed by <strong>Softview Technologies</strong> | 7972084304
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <h3>BANKING SYSTEM</h3>
        <hr />
        <div className="nav-link" onClick={() => setActiveTab("Dashboard")}>Dashboard</div>
        <div className="nav-link" onClick={() => setActiveTab("Firm Master")}>Firm Master</div>
        <div className="nav-link" onClick={() => setActiveTab("Bank Master")}>Bank Master</div>
        <div className="nav-link" onClick={() => setActiveTab("User Master")}>User Master</div>
        <button onClick={() => signOut(auth)} className="logout-btn">Logout</button>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <div className="user-name">{user.email}</div>
          <div className="clock-box">
            {currentTime.toLocaleDateString()} || {currentTime.toLocaleTimeString()}
          </div>
        </div>

        {/* Content starts here based on activeTab */}
        <div className="page-header">
           <h2>{activeTab}</h2>
        </div>

        {activeTab === "Dashboard" && (
           <div className="card">
              <h3>Bank Summary</h3>
              {/* Table with Expand logic for Ledger */}
              {/* Receipt Green Arrow & Payment Red Arrow Logic */}
           </div>
        )}

        {/* Similar sections for Firm Master, Bank Master (with Edit/Delete/Close logic), and User Master */}

        <div className="footer-dev">
          Developed by <strong>Softview Technologies</strong> | Contact: 7972084304
        </div>
      </div>
    </div>
  );
}