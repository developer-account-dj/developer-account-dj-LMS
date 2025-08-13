document.addEventListener("DOMContentLoaded", async () => {
  const accessToken = localStorage.getItem("access");

  if (!accessToken) {
    alert("You must be logged in to view this page.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/api/book-requests/", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch book requests.");
    }

    const requests = data.data;
    let approved = 0;
    let returned = 0;

    requests.forEach(r => {
      if (r.is_approved) approved++;
      if (r.is_returned) returned++;
    });

    document.getElementById("approvedCount").textContent = approved;
    document.getElementById("returnedCount").textContent = returned;
    document.getElementById("totalRequests").textContent = requests.length;

    // ✅ Load book request table
    loadRequestHistory(accessToken);

  } catch (error) {
    console.error("Error loading dashboard data:", error);
    alert("⚠️ Could not load dashboard data.");
  }
});

function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "login.html";
}

async function loadRequestHistory(accessToken) {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/book-requests/", {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    const contentType = response.headers.get("Content-Type");
    const data = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok || !data || !Array.isArray(data.data)) {
      throw new Error(data?.detail || "Unexpected response format.");
    }

    const tableBody = document.getElementById("requestTableBody");
    tableBody.innerHTML = "";

    data.data.forEach(req => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${req.book_title || "Unknown"}</td>
        <td>${req.is_approved ? "✅ Approved" : "⏳ Pending"}</td>
        <td>${req.requested_at ? req.requested_at.split("T")[0] : "Unknown"}</td>
        <td>${req.is_returned ? "✅ Returned" : "❌ Not Returned"}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading request history:", error);
    alert("⚠️ Failed to load request history.");
  }
}
