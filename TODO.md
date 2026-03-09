<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HR Planner | Login</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body class="login-body">
  <div class="login-container">
    <h1>HR Planner</h1>
    <form id="loginForm">
      <input type="text" id="username" placeholder="Enter Username" required />
      <input type="password" id="password" placeholder="Enter Password" required />
      <button type="submit">Login</button>
      <p class="error" id="errorMsg"></p>
    </form>
    <a href="#" class="forgot">Forgot Password?</a>
    <p class="demo-note">Demo credentials: <strong>hr</strong> / <strong>1234</strong></p>
  </div>

  <script src="script.js"></script>
</body>
</html>
