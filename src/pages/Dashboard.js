import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function Dashboard() {
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [users, setUsers] = useState([]);
  const [time, setTime] = useState(new Date());

  // clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // firebase data
  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "firms"), (snap) => {
      setFirms(snap.docs.map((d) => d.data()));
    });

    const unsub2 = onSnapshot(collection(db, "banks"), (snap) => {
      setBanks(snap.docs.map((d) => d.data()));
    });

    const unsub3 = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => d.data()));
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  return (
    <div className="app">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>🏦 Banking</h2>

        <select>
          <option>Select Firm</option>
          {firms.map((f, i) => (
            <option key={i}>{f.name}</option>
          ))}
        </select>

        <div>📊 Dashboard</div>
        <div>🏢 Firm Master ({firms.length})</div>
        <div>🏦 Bank Master ({banks.length})</div>
        <div>👤 User Master ({users.length})</div>
      </div>

      {/* MAIN */}
      <div className="main">

        {/* HEADER */}
        <div className="header">
          <div>
            <b>{auth.currentUser?.email}</b>
            <div className="role">Logged In</div>
          </div>

          <div className="clock">
            {time.toLocaleDateString()} <br />
            {time.toLocaleTimeString()}
          </div>

          <button className="logout" onClick={() => signOut(auth)}>
            Logout
          </button>
        </div>

        {/* CONTENT */}
        <div className="dashboard">

          {/* CARDS */}
          <div style={{ display: "flex", gap: 20 }}>

            <div className="card">
              <div className="cardHeader">
                <span>Firms</span>
                <b>{firms.length}</b>
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <span>Banks</span>
                <b>{banks.length}</b>
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <span>Users</span>
                <b>{users.length}</b>
              </div>
            </div>

          </div>

          {/* LIST */}
          <div style={{ marginTop: 30 }}>
            <h3>Recent Firms</h3>

            {firms.map((f, i) => (
              <div className="item" key={i}>
                {f.name}
              </div>
            ))}

          </div>

        </div>

        {/* FOOTER */}
        <div className="footer">
          Developed by Softview Technologies | 7972084304
        </div>

      </div>
    </div>
  );
}