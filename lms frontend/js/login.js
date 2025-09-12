document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const feedback = document.getElementById('feedback');
  const spinner = document.getElementById('spinner');
  const loginButton = document.getElementById('loginButton');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  
  // Toggle password visibility - EYE BUTTON FUNCTIONALITY
  togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle eye icon
    const eyeIcon = this.querySelector('i');
    if (type === 'text') {
      eyeIcon.classList.remove('fa-eye');
      eyeIcon.classList.add('fa-eye-slash');
    } else {
      eyeIcon.classList.remove('fa-eye-slash');
      eyeIcon.classList.add('fa-eye');
    }
  });
  
  // Handle form submission - LOGIN FUNCTIONALITY
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = passwordInput.value.trim();
    
    // Show loading state
    loginButton.querySelector('span').textContent = 'Logging in...';
    spinner.style.display = 'block';
    loginButton.disabled = true;
    feedback.style.display = 'none';
    
    try {
      const response = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      // Reset button state
      loginButton.querySelector('span').textContent = 'Login';
      spinner.style.display = 'none';
      loginButton.disabled = false;
      
      if (response.ok && data.data && data.data.access && data.data.refresh) {
        // Store tokens in localStorage
        localStorage.setItem("access", data.data.access);
        localStorage.setItem("refresh", data.data.refresh);
        
        // Show success message
        showFeedback('✅ Login successful! Redirecting...', 'success');
        
        // Redirect to dashboard after successful login
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } else {
        // Show error message
        showFeedback(data.message || '❌ Login failed. Please check your credentials.', 'error');
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Reset button state
      loginButton.querySelector('span').textContent = 'Login';
      spinner.style.display = 'none';
      loginButton.disabled = false;
      
      // Show network error message
      showFeedback('⚠️ Network error. Please try again.', 'error');
    }
  });
  
  // Show feedback message
  function showFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = 'feedback ' + type;
    feedback.style.display = 'block';
    
    // Hide feedback after 5 seconds for errors, but keep success visible during redirect
    if (type === 'error') {
      setTimeout(() => {
        feedback.style.display = 'none';
      }, 5000);
    }
  }
});