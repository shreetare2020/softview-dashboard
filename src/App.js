import React, { useState } from "react";

export default function App() {
  const [user] = useState("Admin User");

  const now = new Date();
  const dateTime = `${now.toLocaleDateString()} | ${now.toLocaleTimeString()}`;

  return (
    <div style={{ fontFamily: "sans-serif" }} className="min-h-screen bg-gray-100 text-sm">

      {/* Top Bar */}
      <div className="flex justify-between items-start p-3 bg-white shadow">
        <div></div>
        <div className="text-right">
          <div className="font-bold">{user}</div>
          <div className="text-gray-500">{dateTime}</div>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-5 gap-3 p-3">

        {/* Sidebar */}
        <div className="col-span-1 space-y-2">
          <div className="p-2 bg-white shadow rounded">Dashboard</div>
          <div className="p-2 bg-white shadow rounded">Firm Master</div>
          <div className="p-2 bg-white shadow rounded">Bank Master</div>
          <div className="p-2 bg-white shadow rounded">User Master</div>
          <button className="w-full bg-red-500 text-white p-2 rounded">Logout</button>
        </div>

        {/* Content */}
        <div className="col-span-4 space-y-4">

          {/* Dashboard */}
          <div className="bg-white shadow p-3 rounded">
            <div className="flex justify-between">
              <h2 className="font-bold">Bank Summary</h2>
              <button className="bg-blue-500 text-white px-2 py-1 rounded">Expand</button>
            </div>

            <table className="w-full text-xs border mt-3">
              <thead>
                <tr className="bg-gray-200">
                  <th>Date</th>
                  <th>Opening</th>
                  <th>Particular</th>
                  <th>Receipt</th>
                  <th>Payment</th>
                  <th>Closing</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>01-05</td>
                  <td>1000</td>
                  <td>Sales</td>
                  <td style={{ color: "green" }}>↓ 500</td>
                  <td style={{ color: "red" }}>↑ 0</td>
                  <td>1500</td>
                </tr>
              </tbody>
            </table>

            <div className="flex gap-2 mt-2">
              <button className="bg-green-500 text-white px-2 py-1 rounded">Excel Export</button>
              <button className="bg-purple-500 text-white px-2 py-1 rounded">PDF Export</button>
            </div>
          </div>

          {/* Firm Master */}
          <div className="bg-white shadow p-3 rounded">
            <h2 className="font-bold">Firm Master</h2>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <input className="border p-1" placeholder="Firm Name" />
              <input className="border p-1" placeholder="Bank Link" />
              <button className="bg-blue-500 text-white rounded">Add Firm</button>
            </div>
          </div>

          {/* Bank Master */}
          <div className="bg-white shadow p-3 rounded">
            <h2 className="font-bold">Bank Master</h2>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <input className="border p-1" placeholder="Bank Name" />
              <input className="border p-1" placeholder="Account No" />
              <input className="border p-1" placeholder="Branch" />
              <input className="border p-1" placeholder="Opening Amt" />
            </div>
            <button className="mt-2 bg-blue-500 text-white px-2 py-1 rounded">Add Bank</button>
          </div>

          {/* User Master */}
          <div className="bg-white shadow p-3 rounded">
            <h2 className="font-bold">User Master</h2>
            <div className="grid grid-cols-5 gap-2 mt-2">
              <input className="border p-1" placeholder="User Code" />
              <input className="border p-1" placeholder="Name" />
              <input className="border p-1" placeholder="Email" />
              <input className="border p-1" placeholder="Password" />
              <select className="border p-1">
                <option>Admin</option>
                <option>Viewer</option>
              </select>
            </div>
            <button className="mt-2 bg-blue-500 text-white px-2 py-1 rounded">Add User</button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="text-xs p-2 text-left text-gray-600">
        Developed by Softview Technologies | Contact: 7972084304
      </div>

    </div>
  );
}
