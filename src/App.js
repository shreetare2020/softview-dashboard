import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Refresh check logic
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");

  useEffect(() => {
    // Ye function refresh hone par sabse pehle chalta hai
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        setUser(null);
        // Agar refresh par session nahi mila, toh user null ho jayega
      }
      setLoading(false); // Check khatam, ab UI dikhao
    });
    return () => unsub();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      alert("Unauthorized Access! Sahi details bhariye.");
    }
  };

  // 1. Refresh hone par sabse pehle ye dikhega (Security Gate)
  if (loading) {
    return (
      <div className="security-gate">
        <div className="spinner"></div>
        <p>Verifying Secure Connection...</p>
      </div>
    );
  }

  // 2. Agar login nahi hai, toh sirf Login Screen (Back/Refresh block)
  if (!user) {
    return (
      <div className="login-overlay">
        <form className="login-box" onSubmit={handleLogin}>
          <div className="icon">🛡️</div>
          <h2>ADMIN PORTAL</h2>
          <p>Please login to continue</p>
          <input type="email" placeholder="Email Address" required onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required onChange={(e) => setPass(e.target.value)} />
          <button type="submit">LOGIN</button>
        </form>
      </div>
    );
  }

  // 3. Authenticated Dashboard
  return (
    <div className="dashboard-wrapper">
      <div className="sidebar-pro">
        <h2 className="brand-name">SOFTVIEW</h2>
        <div className={`menu-item ${activePage === "Dashboard" ? "active" : ""}`} onClick={() => setActivePage("Dashboard")}>📊 Dashboard</div>
        <div className={`menu-item ${activePage === "Firm Master" ? "active" : ""}`} onClick={() => setActivePage("Firm Master")}>🏢 Firm Master</div>
        <div className="logout-zone">
          <button onClick={() => signOut(auth)}>LOGOUT</button>
        </div>
      </div>
      
      <div className="main-stage">
        <div className="top-bar">
          <h3>{activePage}</h3>
          <span className="user-mail">{user.email}</span>
        </div>
        <div className="page-content">
          <div className="card">
            <h4>Welcome to Professional Dashboard</h4>
            <p>System is secured with real-time session tracking.</p>
          </div>
        </div>
      </div>
    </div>
  );
}