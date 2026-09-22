import { classifySupportPhase } from "../src/support-phase.js";

describe("classifySupportPhase", () => {
  const ossEnd = { year: 2026, month: 11, day: 24 };
  const commercialEnd = { year: 2027, month: 2, day: 24 };

  it("returns oss when today is before the OSS end date", () => {
    const today = { year: 2026, month: 5, day: 15 };

    expect(classifySupportPhase(today, ossEnd, commercialEnd)).toBe("oss");
  });

  it("treats the OSS end day itself as still in the OSS window", () => {
    const today = { year: 2026, month: 11, day: 24 };

    expect(classifySupportPhase(today, ossEnd, commercialEnd)).toBe("oss");
  });

  it("transitions to commercial the day after the OSS end date", () => {
    const today = { year: 2026, month: 11, day: 25 };

    expect(classifySupportPhase(today, ossEnd, commercialEnd)).toBe(
      "commercial",
    );
  });

  it("treats the commercial end day itself as still in the commercial window", () => {
    const today = { year: 2027, month: 2, day: 24 };

    expect(classifySupportPhase(today, ossEnd, commercialEnd)).toBe(
      "commercial",
    );
  });

  it("returns eol the day after the commercial end date", () => {
    const today = { year: 2027, month: 2, day: 25 };

    expect(classifySupportPhase(today, ossEnd, commercialEnd)).toBe("eol");
  });
});
