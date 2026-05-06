import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const nav = useNavigate();

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      nav("/");
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginCard">
        <h2>Banking Dashboard</h2>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setPass(e.target.value)}
        />

        <button onClick={login}>Login</button>

        <p>Softview Technologies | 7972084304</p>
      </div>
    </div>
  );
}