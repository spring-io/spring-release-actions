import { createMockGithubServer } from "../github-server.js";
import { writeFileSync } from "fs";

const milestones = JSON.parse(process.env.MILESTONES || "[]");
const port = parseInt(process.env.PORT || "0");
const server = createMockGithubServer(milestones);
const actualPort = await server.start(port);

writeFileSync("/tmp/github-server.port", String(actualPort));
console.log(`Mock GitHub API server listening on port ${actualPort}`);

process.on("SIGTERM", async () => {
  await server.stop();
  process.exit(0);
});
