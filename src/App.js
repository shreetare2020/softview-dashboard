// ========================== APP.JS ==========================
// Premium Banking Pro Executive Version 2.0
// React + Firebase Connected UI
// Replace your existing App.js with this

import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [time, setTime] = useState(new Date());

  const [selectedFirm, setSelectedFirm] = useState("All Firms");

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Dummy Data
  const firms = [
    "All Firms",
    "Softview Technologies",
    "Royal Finance",
    "Prime Industries",
  ];

  const bankData = [
    {
      bank: "HDFC BANK",
      account: "1234567890",
      balance: "₹ 12,50,000",
      status: "ACTIVE",
    },
    {
      bank: "ICICI BANK",
      account: "7896541230",
      balance: "₹ 4,90,000",
      status: "ACTIVE",
    },
    {
      bank: "SBI BANK",
      account: "7418529630",
      balance: "₹ 1,10,000",
      status: "CLOSED",
    },
  ];

  const ledgerData = [
    {
      date: "09-05-2026",
      particular: "Client Receipt",
      receipt: "₹ 1,20,000",
      payment: "-",
      closing: "₹ 10,20,000",
    },
    {
      date: "09-05-2026",
      particular: "Office Expense",
      receipt: "-",
      payment: "₹ 25,000",
      closing: "₹ 9,95,000",
    },
  ];

  // LOGIN PAGE
  if (!loggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="luxury-top"></div>

          <h1 className="login-title">BANKING PRO</h1>

          <p className="executive-text">
            Executive Version 2.0
          </p>

          <div className="input-group">
            <label>Login ID</label>
            <input type="text" placeholder="Enter Login ID" />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="Enter Password" />
          </div>

          <button
            className="premium-btn"
            onClick={() => setLoggedIn(true)}
          >
            LOGIN
          </button>

          <div className="developer">
            Developed by – SOFTVIEW TECHNOLOGIES
            <br />
            Contact : +91 7972084304
          </div>
        </div>
      </div>
    );
  }

  // INTERNAL PAGE
  return (
    <div className="main-layout">

      {/* SIDEBAR */}
      <div className="sidebar">

        <div className="brand-section">
          <h1>BANKING PRO</h1>
          <p>Executive Version 2.0</p>
        </div>

        <div className="menu-section">

          <button
            className={activeMenu === "dashboard" ? "menu active" : "menu"}
            onClick={() => setActiveMenu("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={activeMenu === "firm" ? "menu active" : "menu"}
            onClick={() => setActiveMenu("firm")}
          >
            Firm Master
          </button>

          <button
            className={activeMenu === "bank" ? "menu active" : "menu"}
            onClick={() => setActiveMenu("bank")}
          >
            Bank Master
          </button>

          <button
            className={activeMenu === "user" ? "menu active" : "menu"}
            onClick={() => setActiveMenu("user")}
          >
            User Master
          </button>

          <button
            className={activeMenu === "setting" ? "menu active" : "menu"}
            onClick={() => setActiveMenu("setting")}
          >
            Settings
          </button>

        </div>

        <div className="branding-footer">
          DEVELOPED BY
          <br />
          SOFTVIEW TECHNOLOGIES
          <br />
          +91 7972084304
        </div>

      </div>

      {/* MAIN CONTENT */}
      <div className="content">

        {/* TOP HEADER */}
        <div className="top-header">

          <div className="welcome">
            Welcome To Banking Pro
          </div>

          <div className="header-right">
            <div className="clock-box">
              <span>Admin User</span>
              <span>
                {time.toLocaleDateString()}
              </span>
              <span>
                {time.toLocaleTimeString()}
              </span>
            </div>

            <button
              className="logout-btn"
              onClick={() => setLoggedIn(false)}
            >
              Logout
            </button>
          </div>

        </div>

        {/* DASHBOARD */}
        {activeMenu === "dashboard" && (
          <div>

            <div className="page-card">

              <div className="card-top">

                <h2>Dashboard Summary</h2>

                <div className="filter-box">
                  <label>Select Firm Here</label>

                  <select
                    value={selectedFirm}
                    onChange={(e) =>
                      setSelectedFirm(e.target.value)
                    }
                  >
                    {firms.map((firm, index) => (
                      <option key={index}>
                        {firm}
                      </option>
                    ))}
                  </select>

                </div>

              </div>

              {/* BANK SUMMARY TABLE */}
              <table className="premium-table">

                <thead>
                  <tr>
                    <th>Bank Name</th>
                    <th>Bank A/c No.</th>
                    <th>Bank Closing Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {bankData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.bank}</td>
                      <td>{item.account}</td>
                      <td>{item.balance}</td>

                      <td>
                        <span
                          className={
                            item.status === "ACTIVE"
                              ? "active-status"
                              : "closed-status"
                          }
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>

            {/* LEDGER */}
            <div className="page-card">

              <div className="ledger-top">

                <h2>Account Ledger View</h2>

                <div className="ledger-filters">
                  <button className="filter-btn">
                    Daily
                  </button>

                  <button className="filter-btn">
                    Monthly
                  </button>

                  <button className="filter-btn">
                    Period Wise
                  </button>
                </div>

              </div>

              <table className="premium-table">

                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Particular</th>
                    <th>Receipt</th>
                    <th>Payment</th>
                    <th>Closing Balance</th>
                  </tr>
                </thead>

                <tbody>

                  {ledgerData.map((item, index) => (
                    <tr key={index}>

                      <td>{item.date}</td>

                      <td>{item.particular}</td>

                      <td className="green-text">
                        ↓ {item.receipt}
                      </td>

                      <td className="red-text">
                        ↑ {item.payment}
                      </td>

                      <td>{item.closing}</td>

                    </tr>
                  ))}

                </tbody>

              </table>

              <div className="export-buttons">

                <button className="premium-btn">
                  Export Excel
                </button>

                <button className="premium-btn">
                  Export PDF
                </button>

              </div>

            </div>

          </div>
        )}

        {/* FIRM MASTER */}
        {activeMenu === "firm" && (
          <div className="page-card">

            <h2>Firm Master</h2>

            <div className="form-grid">

              <input placeholder="Firm Name" />
              <input placeholder="GST No" />
              <input placeholder="Office Address" />

            </div>

            <button className="premium-btn">
              Save Firm
            </button>

            <table className="premium-table">

              <thead>
                <tr>
                  <th>Firm Name</th>
                  <th>GST No</th>
                  <th>Address</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Softview Technologies</td>
                  <td>27ABCDE1234A1Z5</td>
                  <td>Mumbai</td>

                  <td>
                    <button className="table-btn">
                      Edit
                    </button>

                    <button className="table-btn delete">
                      Delete
                    </button>

                    <button className="table-btn close">
                      Close
                    </button>
                  </td>
                </tr>
              </tbody>

            </table>

          </div>
        )}

        {/* BANK MASTER */}
        {activeMenu === "bank" && (
          <div className="page-card">

            <h2>Bank Master</h2>

            <div className="form-grid">

              <input placeholder="Bank Name" />
              <input placeholder="Bank Branch" />
              <input placeholder="Bank A/c No." />
              <input placeholder="IFSC Code" />
              <input placeholder="Opening Balance" />

              <select>
                <option>DR</option>
                <option>CR</option>
              </select>

            </div>

            <button className="premium-btn">
              Save Bank
            </button>

          </div>
        )}

        {/* USER MASTER */}
        {activeMenu === "user" && (
          <div className="page-card">

            <h2>User Master</h2>

            <div className="form-grid">

              <input placeholder="User Code" />
              <input placeholder="User Name" />
              <input placeholder="User Email" />
              <input placeholder="Mobile" />

              <select>
                <option>Admin</option>
                <option>Operator</option>
                <option>Viewer</option>
              </select>

            </div>

            <button className="premium-btn">
              Save User
            </button>

          </div>
        )}

        {/* SETTINGS */}
        {activeMenu === "setting" && (
          <div className="page-card">

            <h2>Settings</h2>

            <div className="form-grid">

              <input
                type="password"
                placeholder="Old Password"
              />

              <input
                type="password"
                placeholder="New Password"
              />

              <input
                type="password"
                placeholder="Confirm Password"
              />

            </div>

            <button className="premium-btn">
              Change Password
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

export default App;