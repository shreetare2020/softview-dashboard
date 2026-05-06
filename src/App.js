// ... (imports same rahenge)

export default function App() {
  // ... (auth aur data fetching states same rahengi)

  // 🔥 YAHAN UPDATE HUA HAI: LEDGER ENGINE WITH ARROWS
  const getLedger = (account) => {
    let runningBalance = 0; 
    const acc = String(account || "").trim();

    const list = transactions
      .filter((t) => String(t.account || t.Account || "").trim() === acc)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return list.map((t) => {
      const amt = Number(t.amount || t.Amount || 0);
      const type = String(t.type || t.Type || "").toLowerCase();

      let receipt = 0, payment = 0;
      if (type === "receipt" || type === "cr") {
        receipt = amt;
        runningBalance += amt;
      } else {
        payment = amt;
        runningBalance -= amt;
      }

      return { ...t, receipt, payment, balance: runningBalance };
    });
  };

  // DASHBOARD UI MEIN TABLE STRUCTURE
  return (
    <div className="app">
      {/* Sidebar aur Header ka code wahi rahega */}
      
      <div className="content">
        <h2>Dashboard</h2>
        {selectedFirm && banks
          .filter((b) => b.firm === selectedFirm)
          .map((b, i) => (
            <div key={i} className="card ledger-card">
              <div className="card-header" onClick={() => setExpanded(expanded === b.account ? null : b.account)}>
                <b>🏦 {b.name} | {b.account} | ₹{getBalance(b.account)}</b>
              </div>

              {expanded === b.account && (
                <div className="ledger-container">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Particulars</th>
                        <th>Receipt (DR)</th>
                        <th>Payment (CR)</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getLedger(b.account).map((l, idx) => (
                        <tr key={idx}>
                          <td>{l.date}</td>
                          <td>{l.remark || "Transaction"}</td>
                          <td style={{color: 'green'}}>
                            {l.receipt > 0 ? `⬇ ₹${l.receipt}` : "-"}
                          </td>
                          <td style={{color: 'red'}}>
                            {l.payment > 0 ? `⬆ ₹${l.payment}` : "-"}
                          </td>
                          <td style={{fontWeight: 'bold'}}>₹{l.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}