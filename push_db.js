const { spawn } = require("child_process");

const child = spawn("npx", ["drizzle-kit", "push"], {
  stdio: ["pipe", "inherit", "inherit"],
  shell: true,
});

const interval = setInterval(() => {
  try {
    child.stdin.write("\r\n");
  } catch(e) {}
}, 2000);

child.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
  clearInterval(interval);
  process.exit(code);
});
