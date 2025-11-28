const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = Supabase.createClient(supabaseUrl, supabaseKey);

document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const errorMessage = document.getElementById('signup-error');

  if (password !== confirmPassword) {
    errorMessage.textContent = 'Passwords do not match!';
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      errorMessage.textContent = error.message;
    } else {
      errorMessage.textContent = 'Sign-up successful! Check your email to verify.';
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  } catch (err) {
    errorMessage.textContent = 'An unexpected error occurred. Please try again.';
  }
});