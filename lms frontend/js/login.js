document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://127.0.0.1:8000/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const data = await response.json();
    console.log("Login response:", data);

    if (data.success && data.data && data.data.access && data.data.refresh) {
      localStorage.setItem("access", data.data.access);
      localStorage.setItem("refresh", data.data.refresh);
      alert("Login successful.");
      window.location.href = "dashboard.html";
    } else {
      alert("Login failed: " + (data.message || "Invalid credentials."));
    }

  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong. Please try again.");
  }
});




document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const spinner = document.getElementById("spinner");
  const feedback = document.getElementById("feedback");

  // Show spinner, hide feedback
  spinner.style.display = "block";
  feedback.style.display = "none";

  try {
    const response = await fetch("http://127.0.0.1:8000/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    spinner.style.display = "none";

    if (response.ok && data.data && data.data.access && data.data.refresh) {
  localStorage.setItem("access", data.data.access);
  localStorage.setItem("refresh", data.data.refresh);

  feedback.textContent = "✅ Login successful!";
  feedback.className = "feedback success";
  feedback.style.display = "block";

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1000);
} else {
  feedback.textContent = data.message || "❌ Login failed!";
  feedback.className = "feedback error";
  feedback.style.display = "block";
}

  } catch (err) {
    spinner.style.display = "none";
    feedback.textContent = "⚠️ Network error. Try again.";
    feedback.className = "feedback error";
    feedback.style.display = "block";
  }
});