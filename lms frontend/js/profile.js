document.addEventListener("DOMContentLoaded", async () => {
  const accessToken = localStorage.getItem("access");
  const apiBase = "http://127.0.0.1:8000/api";

  if (!accessToken) {
    alert("You must be logged in to view your profile.");
    window.location.href = "login.html";
    return;
  }

  async function loadProfile() {
    try {
      const response = await fetch(`${apiBase}/student/profile/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const result = await response.json();
      if (!response.ok || !Array.isArray(result.data) || result.data.length === 0) {
        throw new Error(result.message || "Unable to fetch profile.");
      }

      const profile = result.data[0];
      const user = profile.user || {};

      const firstName = user.first_name || "";
      const lastName = user.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim() || user.username || "User";

      // ✅ Update text content fields
      document.getElementById("stream").textContent = profile.stream || "--";
      document.getElementById("streamDetail").textContent = profile.stream || "--";
      document.getElementById("email").textContent = user.email || "--";
      document.getElementById("rollNumber").textContent = profile.id || "--";
      document.getElementById("fullName").textContent = fullName;

      // ✅ Update avatar image (same logic as dashboard)
      const avatarURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4361ee&color=fff`;
      const avatarImage = document.getElementById("avatarImage");
      avatarImage.src = avatarURL;
      avatarImage.alt = fullName;

      // ✅ Pre-fill form fields
      document.getElementById("firstName").value = firstName;
      document.getElementById("lastName").value = lastName;
      document.getElementById("editEmail").value = user.email || "";

    } catch (err) {
      console.error("Profile load error:", err);
      alert("⚠️ Failed to load student profile.");
    }
  }

  // Toggle forms
  document.getElementById("editBtn").addEventListener("click", () => {
    document.getElementById("editForm").style.display = "block";
    document.getElementById("passwordForm").style.display = "none";
  });

  document.getElementById("changePasswordBtn").addEventListener("click", () => {
    document.getElementById("passwordForm").style.display = "block";
    document.getElementById("editForm").style.display = "none";
  });

  // Update profile
  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const updatedData = {
      user: {
        first_name: document.getElementById("firstName").value.trim(),
        last_name: document.getElementById("lastName").value.trim(),
        email: document.getElementById("editEmail").value.trim()
      }
    };

    try {
      const response = await fetch(`${apiBase}/profile/update/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedData)
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert("✅ Profile updated successfully!");
        loadProfile();
        document.getElementById("editForm").style.display = "none";
      } else {
        alert("❌ Failed to update profile: " + (result.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("⚠️ Error updating profile.");
    }
  });

  // Change password
  document.getElementById("passwordForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("❌ All fields are required!");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("❌ New password and confirm password do not match!");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/change-password/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert("✅ " + result.message);
        localStorage.clear();
        window.location.href = "login.html";
      } else {
        alert("❌ Failed to change password: " + (result.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Password change error:", err);
      alert("⚠️ Error changing password.");
    }
  });

  loadProfile();
});

function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "login.html";
}
