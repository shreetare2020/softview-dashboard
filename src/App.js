import React, { useState } from "react";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    // temporary fake login (Firebase baad me add karenge)
    if (email && password) {
      setIsLoggedIn(true);
    } else {
      alert("Enter email and password");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
  };

  // 👉 LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Login Page</h2>

          <form onSubmit={handleLogin}>
            <input
              style={styles.input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button style={styles.button} type="submit">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 👉 DASHBOARD SCREEN
  return (
    <div style={styles.dashboard}>
      <h1>Dashboard ✅</h1>
      <p>Welcome to Banking System</p>

      <button style={styles.logout} onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f4f4",
  },
  card: {
    padding: "30px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  input: {
    display: "block",
    margin: "10px auto",
    padding: "10px",
    width: "250px",
  },
  button: {
    padding: "10px 20px",
    background: "green",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  dashboard: {
    padding: "20px",
  },
  logout: {
    padding: "10px 20px",
    background: "red",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
};

export default App;