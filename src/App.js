import React, { useState } from "react";
import { login, signup } from "./authService";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSignup, setIsSignup] = useState(false);

  const handleAuth = async () => {
    try {
      if (isSignup) {
        await signup(email, password, "viewer");
        alert("Signup successful! Now login.");
        setIsSignup(false);
      } else {
        await login(email, password);
        alert("Login success");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">

        <h2>🏦 Banking Dashboard</h2>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* LOGIN / SIGNUP BUTTON */}
        <button onClick={handleAuth}>
          {isSignup ? "Create Account (Signup)" : "Login"}
        </button>

        {/* 🔥 SIGNUP TOGGLE BUTTON (THIS WAS MISSING) */}
        <p
          style={{
            cursor: "pointer",
            color: "blue",
            marginTop: "10px"
          }}
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup
            ? "Already have account? Login"
            : "New user? Create account (Signup)"}
        </p>

      </div>
    </div>
  );
}

export default App;