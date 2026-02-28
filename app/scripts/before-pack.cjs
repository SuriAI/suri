const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

async function beforePack(context) {
  console.log("Running before-pack script...");

  const platform = context.electronPlatformName;
  const backendDir = path.join(__dirname, "..", "..", "server");
  const distDir = path.join(backendDir, "dist");

  console.log(`Building for platform: ${platform}`);
  console.log(`Backend directory: ${backendDir}`);

  if (!fs.existsSync(backendDir)) {
    throw new Error(`Backend directory not found: ${backendDir}`);
  }

  const executableName = platform === "win32" ? "server.exe" : "server";
  const executablePath = path.join(distDir, executableName);

  if (fs.existsSync(executablePath)) {
    console.log(`Backend executable already exists: ${executablePath}`);
    return;
  }

  console.log(`Building backend executable for ${platform}...`);

  try {
    process.chdir(backendDir);

    if (
      !fs.existsSync(path.join(backendDir, "node_modules")) &&
      fs.existsSync(path.join(backendDir, "package.json"))
    ) {
      console.log("Installing backend dependencies...");
      execSync("npm install", { stdio: "inherit" });
    }

    console.log("Installing Python dependencies...");
    execSync("python -m pip install -r requirements.txt", { stdio: "inherit" });

    try {
      execSync('python -c "import PyInstaller"', { stdio: "pipe" });
      console.log("PyInstaller is available");
    } catch (error) {
      console.log("Installing PyInstaller...");
      execSync("python -m pip install pyinstaller", { stdio: "inherit" });
    }

    console.log("Building backend with PyInstaller...");
    execSync("python build_backend.py", { stdio: "inherit" });

    if (!fs.existsSync(executablePath)) {
      throw new Error(`Backend executable was not created: ${executablePath}`);
    }

    console.log(`Backend executable created successfully: ${executablePath}`);

    if (platform !== "win32") {
      try {
        fs.chmodSync(executablePath, 0o755); // rwxr-xr-x
        console.log(`Set execute permissions on ${executablePath}`);
      } catch (err) {
        console.warn(`Failed to set execute permissions: ${err.message}`);
      }
    }

    const stats = fs.statSync(executablePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`Executable size: ${fileSizeMB} MB`);
  } catch (error) {
    console.error("Failed to build backend:", error.message);
    throw error;
  }
}

module.exports = beforePack;
