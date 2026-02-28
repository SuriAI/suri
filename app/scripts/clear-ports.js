import { execSync } from "child_process";

const ports = [3000, 8700];

function clearPort(port) {
  try {
    let pid;
    if (process.platform === "win32") {
      let output = "";
      try {
        output = execSync(`netstat -ano | findstr :${port}`).toString();
      } catch {
        return;
      }

      const lines = output.trim().split("\n");
      for (const line of lines) {
        if (line.includes("LISTENING")) {
          const parts = line.trim().split(/\s+/);
          const potentialPid = parts.pop();
          if (potentialPid && potentialPid !== "0") {
            pid = potentialPid;
            break;
          }
        }
      }
    } else {
      pid = execSync(`lsof -t -i:${port}`).toString().trim();
    }

    if (pid) {
      console.log(`Found process ${pid} on port ${port}. Killing...`);
      if (process.platform === "win32") {
        execSync(`taskkill /F /PID ${pid}`);
      } else {
        execSync(`kill -9 ${pid}`);
      }
    }
  } catch (e) {}
}

console.log("Checking for zombie processes...");
ports.forEach(clearPort);
console.log("Done.");
