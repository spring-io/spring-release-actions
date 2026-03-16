import { Act } from "@kie/act-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

describe("distribute-release-bundle", () => {
	it(
		"creates and distributes a release bundle",
		async () => {
			const act = new Act(repoRoot);
			act.setSecret("GITHUB_TOKEN", "test-token");

			const steps = await act.runEvent("push", {
				workflowFile: path.join(
					__dirname,
					"distribute-release-bundle.test.yml",
				),
				bind: true,
			});

			expect(
				steps.some((s) => s.name === "Main Distribute release bundle"),
			).toBe(true);
			expect(steps.filter((s) => s.status === 1)).toHaveLength(0);
		},
		120_000,
	);
});
