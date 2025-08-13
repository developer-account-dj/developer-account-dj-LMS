// document.getElementById("registerForm").addEventListener("submit", async function (e) {
//   e.preventDefault();

//   // Clear previous error messages
//   document.getElementById("usernameError").innerText = "";
//   document.getElementById("emailError").innerText = "";
//   document.getElementById("passwordError").innerText = "";
//   document.getElementById("password2Error").innerText = "";

//   const username = document.getElementById("username").value.trim();
//   const email = document.getElementById("email").value.trim();
//   const password = document.getElementById("password").value;
//   const password2 = document.getElementById("password2").value;

//   if (password !== password2) {
//     document.getElementById("password2Error").innerText = "Passwords do not match.";
//     return;
//   }

//   const passwordStrength = getPasswordStrength(password);
//   console.log("Password Strength:", passwordStrength);

//   // ❌ Block form submission if password is weak
//   if (passwordStrength === "Weak") {
//     document.getElementById("passwordError").innerText = "Password is too weak.";
//     return;
//   }

//   const payload = {
//     username,
//     email,
//     password,
//     password2,
//   };

//   try {
//     const spinner = document.getElementById("spinner");
//     spinner.classList.remove("hidden");

//     const response = await fetch("http://127.0.0.1:8000/api/register/", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     });

//     const data = await response.json();
//     spinner.classList.add("hidden");

//     if (response.ok && data.success) {
//       document.getElementById("registerSuccess").classList.remove("hidden");
//       setTimeout(() => {
//         window.location.href = "login.html";
//       }, 2000);
//     } else {
//       if (data.username) {
//         document.getElementById("usernameError").innerText = data.username;
//       }
//       if (data.email) {
//         document.getElementById("emailError").innerText = data.email;
//       }
//       if (data.password) {
//         document.getElementById("passwordError").innerText = data.password;
//       }
//       if (data.password2) {
//         document.getElementById("password2Error").innerText = data.password2;
//       }
//       if (data.message) {
//         alert(data.message);
//       }
//     }
//   } catch (error) {
//     console.error("Registration error:", error);
//     alert("Something went wrong. Please try again.");
//   }
// });

// function getPasswordStrength(password) {
//   let score = 0;
//   if (password.length >= 8) score++;
//   if (/[A-Z]/.test(password)) score++;
//   if (/[a-z]/.test(password)) score++;
//   if (/\d/.test(password)) score++;
//   if (/[^A-Za-z0-9]/.test(password)) score++;

//   if (score <= 2) return "Weak";
//   if (score === 3 || score === 4) return "Medium";
//   return "Strong";
// }

// function showPasswordStrength() {
//   const password = document.getElementById("password").value;
//   const hint = document.getElementById("strengthHint");
//   const strength = getPasswordStrength(password);
//   hint.innerText = `Password Strength: ${strength}`;
//   hint.style.color = strength === "Weak" ? "red" : strength === "Medium" ? "orange" : "green";
// }



document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const password2 = document.getElementById("password2").value;
  const strengthHint = document.getElementById("strengthHint");

  if (password !== password2) {
    strengthHint.innerText = "❌ Passwords do not match.";
    strengthHint.style.color = "red";
    return;
  }

  const passwordStrength = getPasswordStrength(password);
  if (passwordStrength === "Weak") {
    strengthHint.innerText = "❌ Password too weak. Use a stronger one.";
    strengthHint.style.color = "red";
    return;
  }

  const payload = {
    username,
    email,
    password,
    password2,
  };

  try {
    const spinner = document.getElementById("spinner");
    const successBox = document.getElementById("registerSuccess");
    spinner.classList.remove("hidden");
    strengthHint.innerText = ""; // clear previous hints

    const response = await fetch("http://127.0.0.1:8000/api/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    spinner.classList.add("hidden");

    if (response.ok && data.success) {
      successBox.classList.remove("hidden");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      if (data.data?.username?.[0]) {
        strengthHint.innerText = `🚫 ${data.data.username[0]}`;
        strengthHint.style.color = "red";
      } else {
        strengthHint.innerText = `❌ ${data.message || "Registration failed."}`;
        strengthHint.style.color = "red";
      }
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("Something went wrong. Please try again.");
  }
});

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return "Weak";
  if (score === 3 || score === 4) return "Medium";
  return "Strong";
}


document.getElementById("password").addEventListener("input", function () {
  const password = this.value;
  const strengthHint = document.getElementById("strengthHint");

  if (password.length === 0) {
    strengthHint.innerText = "";
    return;
  }

  const strength = getPasswordStrength(password);
  if (strength === "Weak") {
    strengthHint.innerText = "🔴 Weak password";
    strengthHint.style.color = "red";
  } else if (strength === "Medium") {
    strengthHint.innerText = "🟠 Medium password";
    strengthHint.style.color = "orange";
  } else {
    strengthHint.innerText = "🟢 Strong password";
    strengthHint.style.color = "green";
  }
});