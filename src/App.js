import React, { useEffect, useState } from "react";
import "./App.css";
import { auth } from "./firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => {
    // Refresh hone par session check karega
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      alert("Unauthorized Access! Please check credentials.");
    }
  };

  if (loading) return <div className="loader">Verifying Portal Security...</div>;

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="shield-icon">🛡️</div>
          <h2>Banking Portal Login</h2>
          <p>Secure Enterprise Access</p>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email Address" required onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required onChange={(e) => setPass(e.target.value)} />
            <button type="submit">LOGIN</button>
          </form>
        </div>
        {/* Page ke sabse niche ye credit line rahegi */}
        <div className="footer-credit">
          Developed by <strong>Softview Technologies</strong> | Contact: <strong>7972084304</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
       <nav>
         <h3>Banking Dashboard</h3>
         <button onClick={() => signOut(auth)}>Logout</button>
       </nav>
       <div style={{padding: '20px'}}>Dashboard Active</div>
    </div>
  );
}