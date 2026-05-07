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
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
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
    return onSnapshot(collection(db, "firms"), (s) => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
  }, [user]);

  if (loading) return <div style={{padding: "50px", textAlign: "center"}}>Verifying Session...</div>;

  if (!user) {
    return (
      <div className="loginPage">
        <div className="loginCard">
          <h2>🏦 SOFTVIEW BANKING</h2>
          <input placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPass(e.target.value)} />
          <button onClick={() => signInWithEmailAndPassword(auth, email, pass)}>SECURE LOGIN</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display: "flex"}}>
      <div className="sidebar">
        <h3>MANAGEMENT</h3>
        <div className={`nav-item ${activePage === "Dashboard" ? "active" : ""}`} onClick={() => setActivePage("Dashboard")}>📊 Dashboard</div>
        <div className={`nav-item ${activePage === "Firm Master" ? "active" : ""}`} onClick={() => setActivePage("Firm Master")}>🏢 Firm Master</div>
        <button onClick={() => signOut(auth)} style={{background: "red", color: "white", border: "none", padding: "10px", width: "100%", marginTop: "20px", borderRadius: "5px", cursor: "pointer"}}>Logout</button>
      </div>
      <div style={{flex: 1, padding: "30px"}}>
        <h2>{activePage}</h2>
        {activePage === "Firm Master" && (
          <div style={{background: "white", padding: "20px", borderRadius: "10px"}}>
             <h4>Add New Firm</h4>
             <input id="fName" placeholder="Firm Name" style={{padding: "10px", marginRight: "10px"}} />
             <button onClick={() => addDoc(collection(db, "firms"), {name: document.getElementById('fName').value})} style={{padding: "10px", background: "green", color: "white", border: "none"}}>Add</button>
             <table style={{marginTop: "20px"}}>
               <thead><tr><th>SR.</th><th>FIRM NAME</th></tr></thead>
               <tbody>{firms.map((f, i) => <tr key={i}><td>{i+1}</td><td>{f.name}</td></tr>)}</tbody>
             </table>
          </div>
        )}
        <div className="footer-right">
           <b>{time.toLocaleString()}</b><br/>
           Developed by Softview Technologies | 7972084304
        </div>
      </div>
    </div>
  );
}