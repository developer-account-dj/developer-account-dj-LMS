document.addEventListener("DOMContentLoaded", () => {
  const accessToken = localStorage.getItem("access");

  if (!accessToken) {
    alert("You must be logged in to view this page.");
    window.location.href = "login.html";
    return;
  }

  loadBooks(accessToken);
  loadRequestHistory(accessToken);
  setupRequestForm(accessToken);
});

// Load books for dropdown
async function loadBooks(accessToken) {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/books/", {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to load books.");

    const bookSelect = document.getElementById("bookSelect");
    bookSelect.innerHTML = '<option value="">-- Choose a book --</option>';

    data.data.forEach(book => {
      const option = document.createElement("option");
      option.value = book.id;
      option.textContent = book.title;
      bookSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading books:", error);
    alert("⚠️ Failed to load books.");
  }
}

// Load request history
async function loadRequestHistory(accessToken) {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/book-requests/", {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to load request history.");

    const tableBody = document.getElementById("requestTableBody");
    tableBody.innerHTML = "";

    data.data.forEach(req => {
      const row = document.createElement("tr");

      const returnBtn = (!req.is_returned && req.is_approved)
        ? `<button onclick="returnBook(${req.id})">🔁 Return</button>`
        : "";

      row.innerHTML = `
        <td>${req.book_title || "Unknown"}</td>
        <td>${req.is_approved ? "✅ Approved" : "⏳ Pending"}</td>
        <td>${req.requested_at?.slice(0, 10) || "-"}</td>
        <td>${req.approved_at?.slice(0, 10) || "-"}</td>
        <td>${req.return_due_date?.slice(0, 10) || "-"}</td>
        <td>${req.is_returned ? "✔️" : "❌"}</td>
        <td>${req.is_overdue ? "⚠️ Yes" : "✅ No"}</td>
        <td>${returnBtn}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading request history:", error);
    alert("⚠️ Failed to load request history.");
  }
}

// Handle book request submission
function setupRequestForm(accessToken) {
  const form = document.getElementById("requestForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const bookId = document.getElementById("bookSelect").value;
    if (!bookId) {
      alert("Please select a book.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/book-requests/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ book: bookId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to request book.");

      alert("✅ Book requested successfully!");
      loadRequestHistory(accessToken);
    } catch (error) {
      console.error("Error requesting book:", error);
      alert("⚠️ Could not request book.");
    }
  });
}

// ✅ Return Book Function
async function returnBook(id) {
  const accessToken = localStorage.getItem("access");
  if (!confirm("Are you sure you want to return this book?")) return;

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/book-requests/${id}/return/`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || "Failed to return book.");
    } else {
      alert("✅ Book returned successfully.");
      loadRequestHistory(accessToken);
    }
  } catch (error) {
    console.error("Error returning book:", error);
    alert("Something went wrong.");
  }
}

// Logout
function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "login.html";
}
