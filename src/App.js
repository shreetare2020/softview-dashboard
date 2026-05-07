import React, { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [newFirmName, setNewFirmName] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => { unsubAuth(); clearInterval(timer); };
  }, []);

  // Data Syncing Logic
  useEffect(() => {
    if (!user) return;
    const unsubFirms = onSnapshot(collection(db, "firms"), (s) => 
      setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubBanks = onSnapshot(collection(db, "banks"), (s) => 
      setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    
    return () => { unsubFirms(); unsubBanks(); };
  }, [user]);

  const handleAddFirm = async () => {
    if(!newFirmName) return alert("Please enter firm name");
    await addDoc(collection(db, "firms"), { name: newFirmName, timestamp: serverTimestamp() });
    setNewFirmName("");
  };

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Initializing System...</div>;

  if (!user) {
    return (
      <div className="loginPage">
        {/* Simple Login Card */}
        <div className="loginCard">
           <h2>🏦 SECURE LOGIN</h2>
           <button onClick={() => signInWithEmailAndPassword(auth, "admin@gmail.com", "password")}>Login as Admin</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>BANKING SYSTEM</h2>
        <select value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'20px'}}>
          <option value="">Select Firm</option>
          {firms.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)}
        </select>
        <div className="nav-links">
          <div className={`nav-item ${activePage === "Dashboard" ? "active" : ""}`} onClick={() => setActivePage("Dashboard")}>📊 Dashboard</div>
          <div className={`nav-item ${activePage === "Firm Master" ? "active" : ""}`} onClick={() => setActivePage("Firm Master")}>🏢 Firm Master</div>
          <div className={`nav-item ${activePage === "Bank Master" ? "active" : ""}`} onClick={() => setActivePage("Bank Master")}>🏦 Bank Master</div>
        </div>
        <button className="logout-btn" onClick={() => signOut(auth)} style={{marginTop:'auto', width:'100%', padding:'10px', background:'#e11d48', color:'white', border:'none', borderRadius:'5px'}}>Logout</button>
      </div>

      <div className="main-content">
        <div className="header-nav">
          <h2 style={{margin:0}}>{activePage}</h2>
          <span style={{color:'#64748b'}}>{user.email}</span>
        </div>

        {activePage === "Firm Master" && (
          <div className="card">
            <h3>Register New Firm</h3>
            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
              <input style={{flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #ddd'}} placeholder="Firm Name" value={newFirmName} onChange={(e)=>setNewFirmName(e.target.value)} />
              <button onClick={handleAddFirm} style={{padding:'10px 25px', background:'#22c55e', color:'white', border:'none', borderRadius:'8px', cursor:'pointer'}}>Add Firm</button>
            </div>
            <table>
              <thead><tr><th>Sr. No</th><th>Firm Name</th></tr></thead>
              <tbody>
                {firms.map((f, i) => <tr key={f.id}><td>{i+1}</td><td>{f.name}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}

        {/* Similar cards for Bank Master and Dashboard can be added here */}

        <div className="professional-footer">
          <div className="clock-text">{time.toLocaleDateString()} | {time.toLocaleTimeString()}</div>
          <div className="dev-text">Developed by Softview Technologies | 7972084304</div>
        </div>
      </div>
    </div>
  );
}