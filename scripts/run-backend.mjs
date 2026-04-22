import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const cwd = process.cwd();
const isWindows = process.platform === "win32";

const venvPython = path.join(
  cwd,
  ".venv",
  isWindows ? path.join("Scripts", "python.exe") : path.join("bin", "python"),
);

const command = existsSync(venvPython) ? venvPython : isWindows ? "python" : "python3";
const args = ["-m", "uvicorn", "api.index:app", "--reload", "--port", "8000"];

console.log(`[backend] Starting FastAPI with ${command} ${args.join(" ")}`);

const child = spawn(command, args, {
  cwd,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("[backend] Failed to start the FastAPI server.", error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

for (const eventName of ["SIGINT", "SIGTERM"]) {
  process.on(eventName, () => {
    if (!child.killed) {
      child.kill(eventName);
    }
  });
}
