import { vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import * as core from "../__fixtures__/core.js";
import { run } from "../src/distribute-release-bundle/index.js";

vi.mock("@actions/core", async () => await import("../__fixtures__/core.js"));

const BASE_URL = "http://test.artifactory";

const server = setupServer(
	http.post(`${BASE_URL}/lifecycle/api/v2/release_bundle`, () => {
		return HttpResponse.json({}, { status: 200 });
	}),
	http.post(
		`${BASE_URL}/lifecycle/api/v2/distribution/distribute/:bundleName/:version`,
		() => {
			return HttpResponse.json({}, { status: 200 });
		},
	),
);

const defaultInputs = {
	artifactoryUrl: BASE_URL,
	bundleName: "TNZ-spring-ldap",
	version: "3.5.0",
	buildName: "spring-ldap-3.5.x",
	buildNumber: "42",
	username: "user",
	password: "pass",
};

describe("distribute-release-bundle integration", () => {
	beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
	afterAll(() => server.close());
	afterEach(() => server.resetHandlers());

	it("creates and distributes successfully", async () => {
		await run(defaultInputs);

		expect(core.setFailed).not.toHaveBeenCalled();
	});

	it("sets failed when create returns a server error", async () => {
		server.use(
			http.post(`${BASE_URL}/lifecycle/api/v2/release_bundle`, () => {
				return new HttpResponse(null, { status: 500 });
			}),
		);

		await run(defaultInputs);

		expect(core.setFailed).toHaveBeenCalled();
	});

	it("sets failed when distribute returns a server error", async () => {
		server.use(
			http.post(
				`${BASE_URL}/lifecycle/api/v2/distribution/distribute/:bundleName/:version`,
				() => {
					return new HttpResponse(null, { status: 500 });
				},
			),
		);

		await run(defaultInputs);

		expect(core.setFailed).toHaveBeenCalled();
	});
});
