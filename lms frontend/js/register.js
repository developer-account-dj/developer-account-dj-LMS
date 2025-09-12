// Password strength check (rule-based with min length = 8)
function getPasswordStrength(password) {
  if (!password) return "Weak";

  if (password.length < 8) {
    return "Too short";
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  // Weak → only numbers OR only alphabets
  if ((hasLower || hasUpper) && !hasDigit && !hasSpecial) return "Weak";
  if (hasDigit && !hasLower && !hasUpper && !hasSpecial) return "Weak";

  // Strong → must have lowercase + uppercase + digit + special
  if (hasLower && hasUpper && hasDigit && hasSpecial) return "Strong";

  // Medium → mix of alphabets + digits (but not all 4 requirements)
  if ((hasLower || hasUpper) && hasDigit) return "Medium";

  // Default fallback
  return "Weak";
}

// Show password strength in UI
function showPasswordStrength() {
  const password = document.getElementById('password').value;
  const strengthBar = document.querySelector('.strength-bar');
  const strengthHint = document.getElementById('strengthHint');

  let hint = "Weak";
  let barColor = "#ef4444";
  let barWidth = "25%";

  const strength = getPasswordStrength(password);

  if (strength === "Too short") {
    hint = "Too short (min 8 chars)";
    barColor = "#ef4444"; // red
    barWidth = "25%";
  } else if (strength === "Weak") {
    hint = "Weak";
    barColor = "#ef4444"; // red
    barWidth = "33%";
  } else if (strength === "Medium") {
    hint = "Medium";
    barColor = "#f59e0b"; // orange
    barWidth = "66%";
  } else if (strength === "Strong") {
    hint = "Strong";
    barColor = "#10b981"; // green
    barWidth = "100%";
  }

  // Update UI
  strengthBar.style.width = barWidth;
  strengthBar.style.background = barColor;
  strengthHint.textContent = hint;
  strengthHint.style.color = barColor;
}

// Toggle password visibility
function setupPasswordToggles() {
  const togglePassword = document.getElementById('togglePassword');
  const togglePassword2 = document.getElementById('togglePassword2');
  const passwordInput = document.getElementById('password');
  const passwordInput2 = document.getElementById('password2');
  
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.querySelector('i').classList.toggle('fa-eye');
      this.querySelector('i').classList.toggle('fa-eye-slash');
    });
  }
  
  if (togglePassword2 && passwordInput2) {
    togglePassword2.addEventListener('click', function() {
      const type = passwordInput2.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput2.setAttribute('type', type);
      this.querySelector('i').classList.toggle('fa-eye');
      this.querySelector('i').classList.toggle('fa-eye-slash');
    });
  }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  const registerButton = document.getElementById('registerButton');
  const spinnerContainer = document.getElementById('spinnerContainer');
  const successMessage = document.getElementById('registerSuccess');
  const strengthHint = document.getElementById('strengthHint');
  
  // Setup password toggles
  setupPasswordToggles();
  
  // Password strength indicator
  document.getElementById('password').addEventListener('input', function() {
    const password = this.value;
    
    if (password.length === 0) {
      strengthHint.textContent = 'Password strength indicator';
      strengthHint.style.color = 'var(--text-light)';
      document.querySelector('.strength-bar').style.width = '0%';
      return;
    }
    
    showPasswordStrength();
  });
  
  // Form submission handler
  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => {
      el.textContent = '';
    });
    strengthHint.textContent = '';
    
    // Basic validation
    if (password !== password2) {
      strengthHint.textContent = '❌ Passwords do not match.';
      strengthHint.style.color = 'var(--error)';
      return;
    }
    
    const passwordStrength = getPasswordStrength(password);
    if (passwordStrength === "Too short" || passwordStrength === "Weak" || passwordStrength === "Medium") {
      strengthHint.textContent = '❌ Password not strong enough. Use at least 1 uppercase, 1 lowercase, 1 digit, and 1 special char.';
      strengthHint.style.color = 'var(--error)';
      return;
    }
    
    // Show loading state
    registerButton.style.display = 'none';
    spinnerContainer.classList.remove('hidden');
    
    try {
      const payload = {
        username,
        email,
        password,
        password2,
      };
      
      const response = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      // Hide loading state
      spinnerContainer.classList.add('hidden');
      registerButton.style.display = 'flex';
      
      if (response.ok && data.success) {
        successMessage.classList.remove('hidden');
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } else {
        if (data.data?.username?.[0]) {
          document.getElementById('usernameError').textContent = data.data.username[0];
        } else if (data.data?.email?.[0]) {
          document.getElementById('emailError').textContent = data.data.email[0];
        } else {
          strengthHint.textContent = `❌ ${data.message || "Registration failed."}`;
          strengthHint.style.color = 'var(--error)';
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      spinnerContainer.classList.add('hidden');
      registerButton.style.display = 'flex';
      strengthHint.textContent = '❌ Something went wrong. Please try again.';
      strengthHint.style.color = 'var(--error)';
    }
  });
});
