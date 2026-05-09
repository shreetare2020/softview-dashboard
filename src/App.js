// ============================ APP.JS ============================

import React, { useEffect, useState } from "react";
import "./App.css";

import { db } from "./firebase";

import {
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

import * as XLSX from "xlsx";

import { saveAs } from "file-saver";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";

function App() {

  // ================= LOGIN =================

  const [loggedIn, setLoggedIn] =
    useState(true);

  // ================= CLOCK =================

  const [time, setTime] =
    useState(new Date());

  // ================= MENU =================

  const [activeMenu, setActiveMenu] =
    useState("dashboard");

  // ================= FIRMS =================

  const [firms, setFirms] =
    useState([]);

  const [firmName, setFirmName] =
    useState("");

  // ================= BANKS =================

  const [banks, setBanks] =
    useState([]);

  const [bankName, setBankName] =
    useState("");

  const [accountNo, setAccountNo] =
    useState("");

  const [openingBalance,
    setOpeningBalance] =
    useState("");

  const [linkedFirm,
    setLinkedFirm] =
    useState("");

  // ================= LEDGER =================

  const [ledger, setLedger] =
    useState([]);

  // ================= FILTER =================

  const [selectedFirm,
    setSelectedFirm] =
    useState("All Firms");

  const [expandedBank,
    setExpandedBank] =
    useState(null);

  const [ledgerFilter,
    setLedgerFilter] =
    useState("daily");

  const [fromDate,
    setFromDate] =
    useState("");

  const [toDate,
    setToDate] =
    useState("");

  // ================= CLOCK =================

  useEffect(() => {

    const interval =
      setInterval(() => {

        setTime(new Date());

      }, 1000);

    return () =>
      clearInterval(interval);

  }, []);

  // ================= FETCH =================

  useEffect(() => {

    fetchFirms();
    fetchBanks();
    fetchLedger();

  }, []);

  // ================= FETCH FIRMS =================

  const fetchFirms = async () => {

    const snapshot =
      await getDocs(
        collection(db, "firms")
      );

    const data =
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    setFirms(data);
  };

  // ================= FETCH BANKS =================

  const fetchBanks = async () => {

    const snapshot =
      await getDocs(
        collection(db, "banks")
      );

    const data =
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    setBanks(data);
  };

  // ================= FETCH LEDGER =================

  const fetchLedger = async () => {

    const snapshot =
      await getDocs(
        collection(db, "ledger")
      );

    const data =
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    setLedger(data);
  };

  // ================= SAVE FIRM =================

  const saveFirm = async () => {

    await addDoc(
      collection(db, "firms"),
      {
        firmName,
      }
    );

    setFirmName("");

    fetchFirms();

    alert("Firm Saved");
  };

  // ================= SAVE BANK =================

  const saveBank = async () => {

    await addDoc(
      collection(db, "banks"),
      {
        bankName,
        accountNo,
        openingBalance,
        linkedFirm,
      }
    );

    setBankName("");
    setAccountNo("");
    setOpeningBalance("");

    fetchBanks();

    alert("Bank Saved");
  };

  // ================= FILTERED BANKS =================

  const filteredBanks =
    selectedFirm === "All Firms"
      ? banks
      : banks.filter(
          (item) =>
            item.linkedFirm ===
            selectedFirm
        );

  // ================= FILTER LEDGER =================

  const getFilteredLedger =
    (bankName) => {

      const today =
        new Date();

      return ledger.filter(
        (item) => {

          if (
            item.bankName !== bankName
          )
            return false;

          const itemDate =
            new Date(item.date);

          if (
            ledgerFilter ===
            "daily"
          ) {

            return (
              itemDate.toDateString() ===
              today.toDateString()
            );
          }

          if (
            ledgerFilter ===
            "monthly"
          ) {

            return (
              itemDate.getMonth() ===
                today.getMonth() &&
              itemDate.getFullYear() ===
                today.getFullYear()
            );
          }

          if (
            ledgerFilter ===
              "period" &&
            fromDate &&
            toDate
          ) {

            return (
              itemDate >=
                new Date(
                  fromDate
                ) &&
              itemDate <=
                new Date(toDate)
            );
          }

          return true;
        }
      );
    };

  // ================= EXCEL EXPORT =================

  const exportExcel =
    (bankName) => {

      const data =
        getFilteredLedger(
          bankName
        );

      const formattedData =
        data.map((item) => ({

          Date: item.date,

          "Opening Balance":
            item.openingBalance,

          Particular:
            item.particular,

          Receipt:
            item.receipt,

          Payment:
            item.payment,

          "Closing Balance":
            item.closingBalance,

        }));

      const worksheet =
        XLSX.utils.json_to_sheet(
          formattedData
        );

      worksheet["!cols"] = [

        { wch: 15 },

        { wch: 20 },

        { wch: 35 },

        { wch: 15 },

        { wch: 15 },

        { wch: 20 },

      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Ledger"
      );

      const excelBuffer =
        XLSX.write(workbook, {

          bookType: "xlsx",

          type: "array",

        });

      const fileData =
        new Blob([excelBuffer], {

          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",

        });

      saveAs(
        fileData,
        `${bankName}_Ledger.xlsx`
      );
    };

  // ================= PDF EXPORT =================

  const exportPDF =
    (bankName) => {

      const doc =
        new jsPDF();

      doc.setFontSize(18);

      doc.text(
        `${bankName} Ledger`,
        14,
        20
      );

      autoTable(doc, {

        startY: 30,

        head: [[

          "Date",

          "Opening",

          "Particular",

          "Receipt",

          "Payment",

          "Closing",

        ]],

        body:
          getFilteredLedger(
            bankName
          ).map((item) => [

            item.date,

            item.openingBalance,

            item.particular,

            item.receipt,

            item.payment,

            item.closingBalance,

          ]),

        headStyles: {

          fillColor: [255, 215, 0],

          textColor: [0, 0, 0],

        },

        bodyStyles: {

          fillColor: [18, 44, 71],

          textColor: [255, 255, 255],

        },

      });

      doc.save(
        `${bankName}_Ledger.pdf`
      );
    };

  // ================= LOGIN PAGE =================

  if (!loggedIn) {

    return (

      <div className="login-page">

        <div className="login-card">

          <h1>BANKING PRO</h1>

          <input
            placeholder="Login ID"
          />

          <input
            placeholder="Password"
            type="password"
          />

          <button
            onClick={() =>
              setLoggedIn(true)
            }
          >
            LOGIN
          </button>

        </div>

      </div>
    );
  }

  // ================= MAIN PAGE =================

  return (

    <div className="main-container">

      {/* SIDEBAR */}

      <div className="sidebar">

        <h1>BANKING PRO</h1>

        <button
          onClick={() =>
            setActiveMenu(
              "dashboard"
            )
          }
        >
          Dashboard
        </button>

        <button
          onClick={() =>
            setActiveMenu("firm")
          }
        >
          Firm Master
        </button>

        <button
          onClick={() =>
            setActiveMenu("bank")
          }
        >
          Bank Master
        </button>

      </div>

      {/* CONTENT */}

      <div className="content">

        {/* HEADER */}

        <div className="header">

          <h2>
            Welcome To Banking Pro
          </h2>

          <div className="clock">

            {time.toLocaleDateString()}
            <br />

            {time.toLocaleTimeString()}

          </div>

        </div>

        {/* DASHBOARD */}

        {activeMenu ===
          "dashboard" && (

          <div className="card">

            <div className="top-bar">

              <h2>Dashboard</h2>

              <select
                value={selectedFirm}
                onChange={(e) =>
                  setSelectedFirm(
                    e.target.value
                  )
                }
              >

                <option>
                  All Firms
                </option>

                {firms.map(
                  (item) => (

                    <option
                      key={item.id}
                      value={
                        item.firmName
                      }
                    >
                      {item.firmName}
                    </option>

                  )
                )}

              </select>

            </div>

            <table>

              <thead>

                <tr>

                  <th></th>

                  <th>Firm</th>

                  <th>Bank</th>

                  <th>Account</th>

                  <th>Balance</th>

                </tr>

              </thead>

              <tbody>

                {filteredBanks.map(
                  (item) => (

                    <React.Fragment
                      key={item.id}
                    >

                      <tr>

                        <td>

                          <button
                            className="expand-btn"
                            onClick={() =>
                              setExpandedBank(
                                expandedBank ===
                                  item.bankName
                                  ? null
                                  : item.bankName
                              )
                            }
                          >

                            {expandedBank ===
                            item.bankName
                              ? "▲"
                              : "▼"}

                          </button>

                        </td>

                        <td>
                          {
                            item.linkedFirm
                          }
                        </td>

                        <td>
                          {
                            item.bankName
                          }
                        </td>

                        <td>
                          {
                            item.accountNo
                          }
                        </td>

                        <td>
                          ₹
                          {
                            item.openingBalance
                          }
                        </td>

                      </tr>

                      {/* LEDGER */}

                      {expandedBank ===
                        item.bankName && (

                        <tr>

                          <td colSpan="5">

                            <div className="ledger-box">

                              {/* FILTER */}

                              <div className="ledger-top">

                                <div className="ledger-buttons">

                                  <button
                                    onClick={() =>
                                      setLedgerFilter(
                                        "daily"
                                      )
                                    }
                                  >
                                    Daily
                                  </button>

                                  <button
                                    onClick={() =>
                                      setLedgerFilter(
                                        "monthly"
                                      )
                                    }
                                  >
                                    Monthly
                                  </button>

                                  <button
                                    onClick={() =>
                                      setLedgerFilter(
                                        "period"
                                      )
                                    }
                                  >
                                    Period Wise
                                  </button>

                                </div>

                                {ledgerFilter ===
                                  "period" && (

                                  <div className="date-filter">

                                    <input
                                      type="date"
                                      value={
                                        fromDate
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        setFromDate(
                                          e
                                            .target
                                            .value
                                        )
                                      }
                                    />

                                    <input
                                      type="date"
                                      value={
                                        toDate
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        setToDate(
                                          e
                                            .target
                                            .value
                                        )
                                      }
                                    />

                                  </div>

                                )}

                              </div>

                              {/* LEDGER TABLE */}

                              <table className="ledger-table">

                                <thead>

                                  <tr>

                                    <th>
                                      Date
                                    </th>

                                    <th>
                                      Opening
                                    </th>

                                    <th>
                                      Particular
                                    </th>

                                    <th>
                                      Receipt
                                    </th>

                                    <th>
                                      Payment
                                    </th>

                                    <th>
                                      Closing
                                    </th>

                                  </tr>

                                </thead>

                                <tbody>

                                  {getFilteredLedger(
                                    item.bankName
                                  ).map(
                                    (
                                      led
                                    ) => (

                                      <tr
                                        key={
                                          led.id
                                        }
                                      >

                                        <td>
                                          {
                                            led.date
                                          }
                                        </td>

                                        <td>
                                          ₹
                                          {
                                            led.openingBalance
                                          }
                                        </td>

                                        <td>
                                          {
                                            led.particular
                                          }
                                        </td>

                                        <td className="receipt">

                                          ↓ ₹
                                          {
                                            led.receipt
                                          }

                                        </td>

                                        <td className="payment">

                                          ↑ ₹
                                          {
                                            led.payment
                                          }

                                        </td>

                                        <td>

                                          ₹
                                          {
                                            led.closingBalance
                                          }

                                        </td>

                                      </tr>

                                    )
                                  )}

                                </tbody>

                              </table>

                              {/* EXPORT */}

                              <div className="export-buttons">

                                <button
                                  onClick={() =>
                                    exportExcel(
                                      item.bankName
                                    )
                                  }
                                >
                                  Export Excel
                                </button>

                                <button
                                  onClick={() =>
                                    exportPDF(
                                      item.bankName
                                    )
                                  }
                                >
                                  Export PDF
                                </button>

                              </div>

                            </div>

                          </td>

                        </tr>

                      )}

                    </React.Fragment>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default App;