import { spawn } from "node:child_process";
import path from "node:path";

const cwd = process.cwd();
const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");

function launch(name, command, args) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(`[dev] ${name} failed to start.`, error);
    shutdown(1);
  });

  return child;
}

const children = [
  launch("frontend", process.execPath, [nextBin, "dev"]),
  launch("backend", process.execPath, [path.join("scripts", "run-backend.mjs")]),
];

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 200);
}

children.forEach((child, index) => {
  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.error(`[dev] ${index === 0 ? "frontend" : "backend"} exited with signal ${signal}.`);
      shutdown(1);
      return;
    }

    if ((code ?? 0) !== 0) {
      console.error(`[dev] ${index === 0 ? "frontend" : "backend"} exited with code ${code}.`);
      shutdown(code ?? 1);
    }
  });
});

for (const eventName of ["SIGINT", "SIGTERM"]) {
  process.on(eventName, () => shutdown(0));
}
