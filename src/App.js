import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [page, setPage] = useState("dashboard"); // dashboard | master

  // auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // login
  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };

  // logout
  const logout = async () => {
    await signOut(auth);
  };

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>Bank Login</h2>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={login}>Login</button>
        </div>
      </div>
    );
  }

  // DASHBOARD UI
  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <h3>🏦 Bank Panel</h3>
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        <button onClick={() => setPage("master")}>Master Data</button>
        <button onClick={logout}>Logout</button>
      </div>

      {/* Main Area */}
      <div className="main">
        {page === "dashboard" && (
          <div>
            <h1>Dashboard</h1>

            <div className="card-container">
              <div className="card">💰 Total Balance: ₹ 2,50,000</div>
              <div className="card">📈 Monthly Income: ₹ 80,000</div>
              <div className="card">💸 Expenses: ₹ 35,000</div>
            </div>
          </div>
        )}

        {page === "master" && (
          <div>
            <h1>Master Data</h1>

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Account</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Amit</td>
                  <td>SB-101</td>
                  <td>50,000</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Rahul</td>
                  <td>SB-102</td>
                  <td>1,20,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}