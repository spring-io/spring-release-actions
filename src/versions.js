import { getReleaseDate, mod } from "./lib.js";

const releaseTrainMonths = {
  M1: [0, 6],
  M2: [1, 7],
  M3: [2, 8],
  RC1: [3, 9],
  "": [4, 10],
};

const minimumDaysBetweenReleases = 14;

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
    const parts = version.replace(/^v/, "").split(/[.-]/);
    this._major = parseInt(parts[0], 10);
    this._minor = parseInt(parts[1], 10);
    this._patch = parseInt(parts[2], 10);
    const fourthAsInt = parseInt(parts[3], 10);
    const hasBuild = parts.length >= 4 && !Number.isNaN(fourthAsInt);
    this._build = hasBuild ? fourthAsInt : NaN;
    const classifierIndex = hasBuild ? 4 : 3;
    this._classifier =
      parts.length <= classifierIndex ? "" : parts[classifierIndex];
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

  get build() {
    return this._build;
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
  if (!Number.isNaN(version.build)) {
    return `${version.major}.${version.minor}.${version.patch}.${version.build + 1}`;
  }
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
  if (!Number.isNaN(v.build)) {
    throw new Error(
      `Cannot advance pre-release for four-digit version ${v.version}; only GA four-digit versions are supported`,
    );
  }
  const train = _releaseTrain(v);
  const { classifier, slot } = _nextRelease(v, train);
  const scheduled = getReleaseDate(
    mod(slot, 12),
    Math.floor(slot / 12),
    generation.dayOfWeek,
    generation.weekOfMonth,
  );
  // Always leave a minimum gap between releases, e.g. when a milestone has
  // slipped into the slot of the release that follows it
  const earliest = new Date(
    v.dueDate.getFullYear(),
    v.dueDate.getMonth(),
    v.dueDate.getDate() + minimumDaysBetweenReleases,
  );
  const nextVersion = _nextVersion(v, classifier);
  return new Version(
    nextVersion,
    scheduled < earliest ? earliest : scheduled,
    v.type,
  );
}

function _nextVersion(version, classifier) {
  const base = `${version.major}.${version.minor}.${version.patch}`;
  return classifier ? `${base}-${classifier}` : base;
}

/**
 * Decide which release follows the given pre-release, and in which month.
 *
 * GA and RC1 always happen, but M2 and M3 are optional. By default, there is one
 * milestone a month, so M2 or M3 goes in the later of its own slot and the month
 * after the current release. It is only scheduled if that is before RC1's slot.
 * Otherwise, the next release is RC1, regardless of how far the current release
 * has slipped.
 */
function _nextRelease(version, train) {
  const optional = { M1: "M2", M2: "M3" }[version.classifier];
  if (optional) {
    const slot = Math.max(
      train.slot(optional),
      _monthIndex(version.dueDate) + 1,
    );
    if (slot < train.slot("RC1")) {
      return { classifier: optional, slot };
    }
    return { classifier: "RC1", slot: train.slot("RC1") };
  }
  if (version.classifier.startsWith("M")) {
    return { classifier: "RC1", slot: train.slot("RC1") };
  }
  return { classifier: "", slot: train.slot("") };
}

/**
 * Find the release train that the given pre-release belongs to, which is the
 * one whose slot for that release is nearest to its due date (a tie goes to the
 * earlier train, since slipping is likelier than releasing early).
 *
 * @returns an object whose {@code slot(classifier)} gives the month index
 * that the train releases the given classifier
 */
function _releaseTrain(version) {
  // later milestones, like M4, are treated as M3
  const classifier = releaseTrainMonths[version.classifier]
    ? version.classifier
    : "M3";
  const current = _monthIndex(version.dueDate);
  const offsets = releaseTrainMonths[classifier].map(
    (month) => mod(month - current + 6, 12) - 6,
  );
  const nearest = offsets.reduce(
    (best, offset, i) =>
      Math.abs(offset) < Math.abs(offsets[best]) ||
      (Math.abs(offset) === Math.abs(offsets[best]) && offset < offsets[best])
        ? i
        : best,
    0,
  );
  const anchor = current + offsets[nearest];
  return {
    slot: (target) =>
      anchor +
      releaseTrainMonths[target][nearest] -
      releaseTrainMonths[classifier][nearest],
  };
}

function _monthIndex(date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function _nextSnapshot(version) {
  if (version.ga) {
    if (!Number.isNaN(version.build)) {
      return new Version(
        `${version.major}.${version.minor}.${version.patch}.${version.build + 1}-SNAPSHOT`,
      );
    }
    return new Version(
      `${version.major}.${version.minor}.${version.patch + 1}-SNAPSHOT`,
    );
  }
  return new Version(
    `${version.major}.${version.minor}.${version.patch}-SNAPSHOT`,
  );
}

export { Version };
