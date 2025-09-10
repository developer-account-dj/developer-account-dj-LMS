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
    console.log("PROFILE DATA:", profileData);

    if (!profileRes.ok ) {
      throw new Error(profileData.message || "Failed to load profile.");
    }

    const studentProfile = Array.isArray(profileData.data)
      ? profileData.data[0]
      : profileData.data || profileData;

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


function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "login.html";
}
