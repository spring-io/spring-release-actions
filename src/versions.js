import { getReleaseDate, mod } from "./lib.js";

const releaseTrainMonths = {
  M1: [0, 6],
  M2: [1, 7],
  M3: [2, 8],
  RC1: [3, 9],
  "": [4, 10],
};

/**
 * A class representing a version of the project.
 *
 * @author Josh Cummings
 */
class Version {
  constructor(version, dueDate = new Date(), type = "oss") {
    this._version = version;
    this._dueDate = dueDate;
    this._type = type;
    const parts = version.split(/[.-]/);
    this._major = parseInt(parts[0], 10);
    this._minor = parseInt(parts[1], 10);
    this._patch = parseInt(parts[2], 10);
    this._classifier = parts.length === 3 ? "" : parts[3];
    this._snapshot =
      this._classifier === "SNAPSHOT" || Number.isNaN(this._patch);
  }

  /**
   * Construct a {@linkcode Version} instance based on a {@linkcode Milestones}
   * value.
   *
   * @param milestone a milestone acquired from {@linkcode Milestones}
   * @returns {Version}
   */
  static fromMilestone(milestone) {
    return new Version(milestone.name, milestone.dueDate, milestone.type);
  }

  get version() {
    return this._version;
  }

  get major() {
    return this._major;
  }

  get minor() {
    return this._minor;
  }

  get patch() {
    return this._patch;
  }

  get classifier() {
    return this._classifier;
  }

  get dueDate() {
    return this._dueDate;
  }

  get type() {
    return this._type;
  }

  /**
   * Whether this version is a snapshot version
   * @returns {boolean}
   */
  get snapshot() {
    return this._snapshot;
  }

  /**
   * Whether this version is a pre-release version, like RC1 or M2
   * @returns {boolean}
   */
  get prerelease() {
    return !!(this._classifier && !this._snapshot);
  }

  /**
   * Whether this version is a GA version
   * @returns {boolean}
   */
  get ga() {
    return !this._snapshot && !this.prerelease;
  }

  /**
   * Get the next milestone that follows after this version;
   * returns {@code null} if given a snapshot version
   *
   * @param generation generation detail from {@linkcode Website}
   * @returns {Version|null}
   */
  nextMilestone(generation) {
    if (this.snapshot) {
      console.log(`returning null since version ${this} is a snapshot version`);
      return null;
    }
    if (this.ga) {
      return _nextGa(this, generation);
    }
    return _nextMilestone(this, generation);
  }

  /**
   * Get the next snapshot that follows after this version.
   *
   * @returns {Version}
   */
  nextSnapshot() {
    return _nextSnapshot(this);
  }

  /**
   * Check if this version is the same major/minor generation as
   * {@code other}
   * @param other the version to compare to
   * @returns {boolean}
   */
  isSameMajorMinor(other) {
    return this.major === other.major && this.minor === other.minor;
  }
}

function _nextGa(v, generation) {
  const next = _nextGaDate(v, generation);
  if (!next) {
    return null;
  }
  return new Version(_nextGaVersion(v), next.dueDate, next.type);
}

function _nextGaVersion(version) {
  return `${version.major}.${version.minor}.${version.patch + 1}`;
}

function _nextGaDate(version, generation) {
  const currentMonth = version.dueDate.getMonth();
  const currentYear = version.dueDate.getFullYear();
  const oss = generation.oss;
  const enterprise = generation.enterprise;

  let releaseMonth =
    currentMonth +
    oss.frequency -
    ((currentMonth - oss.offset) % oss.frequency);
  let releaseYear = currentYear + Math.floor(releaseMonth / 12);
  releaseMonth = mod(releaseMonth, 12);

  if (
    releaseYear < oss.end.year ||
    (releaseYear === oss.end.year && releaseMonth <= oss.end.month)
  ) {
    const dueDate = getReleaseDate(
      releaseMonth,
      releaseYear,
      generation.dayOfWeek,
      generation.weekOfMonth,
    );
    return { dueDate, type: "oss" };
  }

  releaseMonth =
    currentMonth +
    enterprise.frequency -
    ((currentMonth - enterprise.offset) % enterprise.frequency);
  releaseYear = currentYear + Math.floor(releaseMonth / 12);
  releaseMonth = mod(releaseMonth, 12);

  if (
    releaseYear < enterprise.end.year ||
    (releaseYear === enterprise.end.year &&
      releaseMonth <= enterprise.end.month)
  ) {
    const dueDate = getReleaseDate(
      releaseMonth,
      releaseYear,
      generation.dayOfWeek,
      generation.weekOfMonth,
    );
    return { dueDate, type: "enterprise" };
  }

  return null;
}

function _nextMilestone(v, generation) {
  const nextVersion = new Version(_nextMilestoneVersion(v), v.dueDate, v.type);
  const nextDate = _nextMilestoneDate(nextVersion, generation);
  return new Version(nextVersion.version, nextDate, v.type);
}

function _nextMilestoneVersion(version) {
  if (version.classifier === "M1") {
    return `${version.major}.${version.minor}.${version.patch}-M2`;
  }
  if (version.classifier === "M2") {
    return `${version.major}.${version.minor}.${version.patch}-M3`;
  }
  if (version.classifier.startsWith("M")) {
    return `${version.major}.${version.minor}.${version.patch}-RC1`;
  }
  return `${version.major}.${version.minor}.${version.patch}`;
}

function _nextMilestoneDate(version, generation) {
  const currentMonth = version.dueDate.getMonth();
  const candidateMonths = releaseTrainMonths[version.classifier];
  const index =
    mod(candidateMonths[0] - currentMonth, 12) <
    mod(candidateMonths[1] - currentMonth, 12)
      ? 0
      : 1;
  const month = candidateMonths[index];
  const year = version.dueDate.getFullYear() + (month < currentMonth);
  return getReleaseDate(
    month,
    year,
    generation.dayOfWeek,
    generation.weekOfMonth,
  );
}

function _nextSnapshot(version) {
  if (version.ga) {
    return new Version(
      `${version.major}.${version.minor}.${version.patch + 1}-SNAPSHOT`,
    );
  }
  return new Version(
    `${version.major}.${version.minor}.${version.patch}-SNAPSHOT`,
  );
}

export { Version };
