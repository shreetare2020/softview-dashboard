import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Refresh check ke liye
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Ye function check karega ki user logged in hai ya nahi
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        setUser(null);
      }
      setLoading(false); // Verification khatam
    });
    
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => { unsub(); clearInterval(timer); };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      alert("Invalid Credentials! Dubara koshish karein.");
    }
  };

  // Jab tak loading ho, tab tak screen khali rahegi (Refresh security)
  if (loading) return <div className="loader-container">Verifying Security...</div>;

  // Agar user nahi hai, toh sirf Login Page dikhega
  if (!user) {
    return (
      <div className="login-screen">
        <form className="login-panel" onSubmit={handleLogin}>
          <div className="logo-area">🏦</div>
          <h2>SOFTVIEW BANKING</h2>
          <p>Dignified Financial Management</p>
          <input type="email" placeholder="Admin Email" required onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required onChange={(e) => setPass(e.target.value)} />
          <button type="submit">LOGIN TO PORTAL</button>
        </form>
      </div>
    );
  }

  // Login hone ke baad Dashboard
  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>BANKING SYSTEM</h2>
        <div className={`nav-item ${activePage === "Dashboard" ? "active" : ""}`} onClick={() => setActivePage("Dashboard")}>📊 Dashboard</div>
        <div className={`nav-item ${activePage === "Firm Master" ? "active" : ""}`} onClick={() => setActivePage("Firm Master")}>🏢 Firm Master</div>
        <button className="logout-btn" onClick={() => signOut(auth)}>LOGOUT</button>
      </div>
      
      <div className="main-content">
        <header>
          <span className="page-title">{activePage}</span>
          <span className="user-label">{user.email}</span>
        </header>
        
        <div className="content-body">
          {/* Dashboard/Master content yahan ayega */}
          <div className="card">Abhi design set ho raha hai...</div>
        </div>

        <div className="professional-footer">
          <div className="clock-box">{time.toLocaleString()}</div>
          <div className="dev-tag">Developed by Softview Technologies | 7972084304</div>
        </div>
      </div>
    </div>
  );
}