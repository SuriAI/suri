import { execSync } from "child_process";

const ports = [3000, 8700]; // React and Backend ports

function clearPort(port) {
  try {
    let pid;
    if (process.platform === "win32") {
      // Windows: Find PID using netstat
      const output = execSync(`netstat -ano | findstr :${port}`).toString();
      // Lines look like: TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       1234
      const lines = output.trim().split("\n");
      if (lines.length > 0) {
        // Get the last column (PID)
        pid = lines[0].trim().split(/\s+/).pop();
      }
    } else {
      // Linux/Mac: Find PID using lsof
      pid = execSync(`lsof -t -i:${port}`).toString().trim();
    }

    if (pid) {
      console.log(
        `[Port Cleaner] Found process ${pid} on port ${port}. Killing...`,
      );
      if (process.platform === "win32") {
        execSync(`taskkill /F /PID ${pid}`);
      } else {
        execSync(`kill -9 ${pid}`);
      }
    }
  } catch (e) {
    // console.log(`[Port Cleaner] Port ${port} is clear.`);
  }
}

console.log("[Port Cleaner] Checking for zombie processes...");
ports.forEach(clearPort);
console.log("[Port Cleaner] Done.");
