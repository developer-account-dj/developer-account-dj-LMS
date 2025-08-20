document.addEventListener("DOMContentLoaded", async () => {
  const accessToken = localStorage.getItem("access");

  if (!accessToken) {
    alert("You must be logged in to view this page.");
    window.location.href = "login.html";
    return;
  }

  try {
    // 🔄 Load student profile
    const profileRes = await fetch("http://127.0.0.1:8000/api/student/profile/", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    const profileData = await profileRes.json();

    if (!profileRes.ok || !profileData.success || !Array.isArray(profileData.data)) {
      throw new Error(profileData.message || "Failed to load profile.");
    }

    const studentProfile = profileData.data[0];

    const firstName = studentProfile.user.first_name || "";
    const lastName = studentProfile.user.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();

    // ✅ Update welcome name
    document.getElementById("studentName").textContent = fullName;

    // ✅ Update avatar
    const avatarImg = document.getElementById("studentAvatar");
    avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4361ee&color=fff`;
    avatarImg.alt = fullName;

    // ✅ Load dashboard data and request history
    await loadDashboardData(accessToken);
    await loadRequestHistory(accessToken);

  } catch (error) {
    console.error("Error loading student profile:", error);
    alert("⚠️ Failed to load profile data.");
  }
});

async function loadDashboardData(accessToken) {
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
        <td>${req.book_title || "Unknown"}
        <td>${req.is_approved ? "✅ Approved" : "⏳ Pending"}</td>
        <td>${req.requested_at ? req.requested_at.split("T")[0] : "Unknown"}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading request history:", error);
    alert("⚠️ Failed to load request history.");
  }
}

function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "login.html";
}
