import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      alert("Login Error: Please check your email and password.");
    }
  };

  if (loading) return <div className="loader">Authenticating... Please Wait.</div>;

  if (!user) {
    return (
      <div className="loginPage">
        <form className="loginCard" onSubmit={handleLogin}>
          <h2>🏦 SOFTVIEW BANKING</h2>
          <p style={{color: '#666', fontSize: '14px'}}>Secure Professional Portal</p>
          <input type="email" placeholder="Admin Email" required onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required onChange={(e) => setPass(e.target.value)} />
          <button type="submit">ACCESS DASHBOARD</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="sidebar">
        <h2 className="brand">BANKING SYSTEM</h2>
        <div className="nav-links">
          <div className={activePage === "Dashboard" ? "active" : ""} onClick={() => setActivePage("Dashboard")}>📊 Dashboard</div>
          <div className={activePage === "Firm Master" ? "active" : ""} onClick={() => setActivePage("Firm Master")}>🏢 Firm Master</div>
          <div className={activePage === "Bank Master" ? "active" : ""} onClick={() => setActivePage("Bank Master")}>🏦 Bank Master</div>
        </div>
        <button className="logout-btn" onClick={() => signOut(auth)}>Log Out</button>
      </div>

      <div className="main-content">
        <div className="top-nav">
          <span className="page-title">{activePage}</span>
          <span className="user-info">{user.email}</span>
        </div>

        <div className="content-body">
           {/* Form Content will go here based on activePage */}
           {activePage === "Firm Master" && (
             <div className="card">
               <h3>Firm Management</h3>
               {/* Add Form Logic Here */}
             </div>
           )}
        </div>

        <div className="footer-fixed">
          <div className="clock-box">{time.toLocaleString()}</div>
          <div className="dev-credit">Developed by Softview Technologies | 7972084304</div>
        </div>
      </div>
    </div>
  );
}