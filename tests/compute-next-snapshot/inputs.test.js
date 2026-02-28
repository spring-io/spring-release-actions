import { jest } from "@jest/globals";
import * as core from "../../__fixtures__/core.js";

jest.unstable_mockModule("@actions/core", () => core);

const { Inputs } = await import("../../src/compute-next-snapshot/inputs.js");

function setupGetInput(map) {
  core.getInput.mockImplementation((name) => map[name] ?? "");
}

describe("compute-next-snapshot Inputs constructor", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("settles version and freezes", () => {
    setupGetInput({ version: "6.2.0" });

    const inputs = new Inputs();

    expect(inputs.version).toBe("6.2.0");
    expect(Object.isFrozen(inputs)).toBe(true);
  });
});
