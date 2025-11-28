import { supabase, isConfigured } from './supabase-client.js';

// DOM Elements
const toggleBtns = document.querySelectorAll('.toggle-btn');
const loginFormContainer = document.getElementById('login-form-container');
const signupFormContainer = document.getElementById('signup-form-container');
const forgotPasswordFormContainer = document.getElementById('forgot-password-form-container');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');

const loginMessage = document.getElementById('login-message');
const signupMessage = document.getElementById('signup-message');
const forgotMessage = document.getElementById('forgot-message');

const forgotPasswordLink = document.getElementById('forgot-password-link');
const backToLoginLink = document.getElementById('back-to-login-link');

// Helper functions
function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.className = isError ? 'message error' : 'message success';
  element.style.display = 'block';
}

function clearMessage(element) {
  if (element) {
    element.textContent = '';
    element.style.display = 'none';
  }
}

function setLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
  } else {
    button.disabled = false;
    if(button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
  }
}

// Check if user is already logged in
async function checkAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}

// Function to initialize all event listeners for the auth page
function initializeAuthPage() {
    // Check if Supabase is configured
    if (!isConfigured()) {
        const configError = 'Supabase is not configured. Please check supabase-client.js';
        showMessage(loginMessage, configError, true);
        showMessage(signupMessage, configError, true);
        showMessage(forgotMessage, configError, true);
        return; // Stop execution if not configured
    }

    // Toggle between login and signup
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const formType = btn.dataset.form;
        
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        forgotPasswordFormContainer.classList.remove('active');

        if (formType === 'login') {
          signupFormContainer.classList.remove('active');
          loginFormContainer.classList.add('active');
        } else {
          loginFormContainer.classList.remove('active');
          signupFormContainer.classList.add('active');
        }

        clearMessage(loginMessage);
        clearMessage(signupMessage);
      });
    });

    // Show forgot password form
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.classList.remove('active');
        signupFormContainer.classList.remove('active');
        forgotPasswordFormContainer.classList.add('active');
        clearMessage(loginMessage);
    });

    // Return to login form
    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordFormContainer.classList.remove('active');
        loginFormContainer.classList.add('active');
        clearMessage(forgotMessage);
    });

    // Login handler
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!isConfigured()) return;

      const submitBtn = e.target.querySelector('button[type="submit"]');
      setLoading(submitBtn, true);
      clearMessage(loginMessage);

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // The onAuthStateChange listener will handle the redirect.
      } catch (error) {
        showMessage(loginMessage, error.message, true);
      } finally {
        setLoading(submitBtn, false);
      }
    });

    // Signup handler
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!isConfigured()) return;

      const submitBtn = e.target.querySelector('button[type="submit"]');
      setLoading(submitBtn, true);
      clearMessage(signupMessage);

      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;

      if (password !== confirmPassword) {
        showMessage(signupMessage, 'Passwords do not match', true);
        setLoading(submitBtn, false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;

        if (data.user && data.user.identities && data.user.identities.length === 0) {
            showMessage(signupMessage, 'This email is already registered. Please login or reset your password.', true);
        } else {
            showMessage(signupMessage, 'Account created! Please check your email to verify your account.', false);
            signupForm.reset();
        }
      } catch (error) {
        showMessage(signupMessage, error.message, true);
      } finally {
        setLoading(submitBtn, false);
      }
    });
    
    // Forgot Password handler
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isConfigured()) return;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        setLoading(submitBtn, true);
        clearMessage(forgotMessage);

        const email = document.getElementById('forgot-email').value;

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin, // URL to redirect to after password reset
            });

            if (error) throw error;

            showMessage(forgotMessage, 'Password reset link sent! Please check your email.', false);
            forgotPasswordForm.reset();

        } catch (error) {
            showMessage(forgotMessage, error.message, true);
        } finally {
            setLoading(submitBtn, false);
        }
    });

    // Social auth handlers (placeholder)
    document.querySelectorAll('.social-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        alert('Social authentication coming soon!');
      });
    });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        window.location.href = '/';
      }
    });

    // Check auth on load
    checkAuth();
}

// Run the initialization function only if we are on the auth page
if (document.getElementById('auth-page')) {
    initializeAuthPage();
}
