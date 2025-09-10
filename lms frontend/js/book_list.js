document.addEventListener("DOMContentLoaded", async () => {
  const accessToken = localStorage.getItem("access");

  if (!accessToken) {
    alert("You must be logged in to view this page.");
    window.location.href = "login.html";
    return;
  }

  const bookGrid = document.getElementById("bookGrid");
  const categoryFilter = document.getElementById("categoryFilter");
  const searchInput = document.getElementById("searchInput");

  // Fetch and populate streams
  async function loadStreams() {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/streams/", {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        // Keep "All Streams" option at top
        categoryFilter.innerHTML = `<option value="all">All Streams</option>`;

        data.data.forEach(stream => {
          const opt = document.createElement("option");
          opt.value = stream.id; // pass id for filtering
          opt.textContent = stream.name;
          categoryFilter.appendChild(opt);
        });
      }
    } catch (err) {
      console.error("Error loading streams:", err);
    }
  }

  // Fetch and display books with optional search/stream filters
  async function loadBooks() {
    let url = "http://127.0.0.1:8000/api/books/";

    const search = searchInput.value.trim();
    const stream = categoryFilter.value || "all";

    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (stream) params.push(`stream=${encodeURIComponent(stream)}`);

    if (params.length) url += `?${params.join("&")}`;

    try {
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      const data = await res.json();

      bookGrid.innerHTML = "";

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        data.data.forEach(book => {
          const card = document.createElement("div");
          card.className = "book-card";
          card.innerHTML = `
            <h3>${book.title}</h3>
            <p><strong>Author:</strong> ${book.author_name || "Unknown"}</p>
            <p><strong>Stream:</strong> ${book.stream_name || "All"}</p>
          `;
          bookGrid.appendChild(card);
        });
      } else {
        bookGrid.innerHTML = "<p>No books found.</p>";
      }
    } catch (err) {
      console.error("Error loading books:", err);
      alert("⚠️ Could not load books.");
    }
  }

  // Event listeners
  categoryFilter.addEventListener("change", loadBooks);
  searchInput.addEventListener("input", () => {
    clearTimeout(searchInput._timeout);
    searchInput._timeout = setTimeout(loadBooks, 400); // debounce
  });

  // Initial load
  await loadStreams();
  await loadBooks();
});

// 🔓 Logout
function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "login.html";
}
