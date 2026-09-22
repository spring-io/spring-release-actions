import { Act } from "@kie/act-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("compute-release-channel", () => {
  it("classifies a commercial-phase generation branch in a private repository as lts", async () => {
    const act = new Act(repoRoot);

    const steps = await act.runEvent("push", {
      workflowFile: path.join(__dirname, "compute-release-channel.test.yml"),
      bind: true,
    });

    expect(steps.some((s) => s.name === "Main Compute release channel")).toBe(
      true,
    );
    expect(steps.filter((s) => s.status === 1)).toHaveLength(0);
  }, 120_000);
});
