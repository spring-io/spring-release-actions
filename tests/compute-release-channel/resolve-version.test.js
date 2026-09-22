import { resolveVersion } from "../../src/compute-release-channel/resolve-version.js";

describe("resolveVersion", () => {
  it("resolves a hotfix-line branch as a four-digit version", () => {
    const resolved = resolveVersion({ ref: "4.1.1.x" });

    expect(resolved.version.major).toBe(4);
    expect(resolved.version.minor).toBe(1);
    expect(resolved.fourDigit).toBe(true);
  });

  it("resolves a four-digit release branch as a four-digit version", () => {
    const resolved = resolveVersion({ ref: "release/4.1.1.1" });

    expect(resolved.version.major).toBe(4);
    expect(resolved.version.minor).toBe(1);
    expect(resolved.fourDigit).toBe(true);
  });

  it("resolves a bare generation branch", () => {
    const resolved = resolveVersion({ ref: "5.7.x" });

    expect(resolved.version.major).toBe(5);
    expect(resolved.version.minor).toBe(7);
    expect(resolved.fourDigit).toBe(false);
    expect(resolved.unpublished).toBe(false);
  });

  it("resolves a three-digit release branch", () => {
    const resolved = resolveVersion({ ref: "release/5.7.29" });

    expect(resolved.version.major).toBe(5);
    expect(resolved.version.minor).toBe(7);
    expect(resolved.fourDigit).toBe(false);
    expect(resolved.unpublished).toBe(false);
  });

  it("resolves an -internal generation branch, ignoring the suffix", () => {
    const resolved = resolveVersion({ ref: "7.2.x-internal" });

    expect(resolved.version.major).toBe(7);
    expect(resolved.version.minor).toBe(2);
    expect(resolved.fourDigit).toBe(false);
    expect(resolved.unpublished).toBe(false);
  });

  it("resolves a bare generation branch with no -internal suffix the same way", () => {
    const resolved = resolveVersion({ ref: "7.2.x" });

    expect(resolved.version.major).toBe(7);
    expect(resolved.version.minor).toBe(2);
    expect(resolved.fourDigit).toBe(false);
    expect(resolved.unpublished).toBe(false);
  });

  it("resolves a plain GA release branch", () => {
    const resolved = resolveVersion({ ref: "release/7.2.3" });

    expect(resolved.version.major).toBe(7);
    expect(resolved.version.minor).toBe(2);
    expect(resolved.fourDigit).toBe(false);
    expect(resolved.unpublished).toBe(false);
  });

  it("marks a first-GA release branch (patch 0) as unpublished", () => {
    const resolved = resolveVersion({ ref: "release/7.0.0" });

    expect(resolved.version.major).toBe(7);
    expect(resolved.version.minor).toBe(0);
    expect(resolved.fourDigit).toBe(false);
    expect(resolved.unpublished).toBe(true);
  });

  it("resolves a milestone release branch, preserving prerelease status", () => {
    const resolved = resolveVersion({ ref: "release/7.2.0-M1" });

    expect(resolved.version.major).toBe(7);
    expect(resolved.version.minor).toBe(2);
    expect(resolved.version.prerelease).toBe(true);
    expect(resolved.fourDigit).toBe(false);
    expect(resolved.unpublished).toBe(true);
  });

  it("resolves an RC release branch", () => {
    const resolved = resolveVersion({ ref: "release/7.3.0-RC1" });

    expect(resolved.version.major).toBe(7);
    expect(resolved.version.minor).toBe(3);
    expect(resolved.fourDigit).toBe(false);
    expect(resolved.unpublished).toBe(true);
  });

  it("marks a milestone of a later patch as unpublished too, via prerelease rather than patch", () => {
    const resolved = resolveVersion({ ref: "release/7.2.5-M1" });

    expect(resolved.version.patch).toBe(5);
    expect(resolved.unpublished).toBe(true);
  });

  it("returns null for an unversioned ref with no fallback version", () => {
    expect(resolveVersion({ ref: "main" })).toBeNull();
  });

  it("returns null for an arbitrary feature branch with no fallback version", () => {
    expect(resolveVersion({ ref: "fix-thing-123" })).toBeNull();
  });

  it("falls back to the version input when the ref doesn't resolve", () => {
    const resolved = resolveVersion({
      ref: "main",
      version: "6.4.16-SNAPSHOT",
    });

    expect(resolved.version.major).toBe(6);
    expect(resolved.version.minor).toBe(4);
    expect(resolved.fourDigit).toBe(false);
    expect(resolved.unpublished).toBe(false);
  });

  it("marks a fallback milestone version for a brand-new generation as unpublished", () => {
    const resolved = resolveVersion({ ref: "main", version: "8.0.0-M1" });

    expect(resolved.version.major).toBe(8);
    expect(resolved.version.minor).toBe(0);
    expect(resolved.unpublished).toBe(true);
  });

  it("falls back to a four-digit version input when the ref doesn't resolve", () => {
    const resolved = resolveVersion({
      ref: "main",
      version: "6.4.3.1-SNAPSHOT",
    });

    expect(resolved.fourDigit).toBe(true);
  });

  it("prefers the ref over the fallback version when the ref resolves", () => {
    const resolved = resolveVersion({
      ref: "5.7.x",
      version: "9.9.9",
    });

    expect(resolved.version.major).toBe(5);
    expect(resolved.version.minor).toBe(7);
  });

  it("strips a refs/heads/ prefix before parsing", () => {
    const resolved = resolveVersion({ ref: "refs/heads/5.7.x" });

    expect(resolved.version.major).toBe(5);
    expect(resolved.version.minor).toBe(7);
  });

  it("returns null when neither the ref nor the fallback version is parseable", () => {
    expect(
      resolveVersion({ ref: "main", version: "not-a-version" }),
    ).toBeNull();
  });

  it("returns null for an empty ref and no fallback version", () => {
    expect(resolveVersion({ ref: "" })).toBeNull();
  });
});
