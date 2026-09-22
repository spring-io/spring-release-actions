import { Version } from "../versions.js";

const REF_PREFIX = /^refs\/(heads|tags)\//;
const HOTFIX_LINE = /^(\d+)\.(\d+)\.(\d+)\.x$/;
const GENERATION = /^(\d+)\.(\d+)\.x(?:-internal)?$/;
const RELEASE = /^release\/(.+)$/;

/**
 * Resolve a major/minor version (and whether it's a four-digit hotfix
 * version) from a branch/tag ref, falling back to an explicit version
 * string when the ref isn't a recognizable version-shaped branch (for
 * example, 'main' or a feature branch).
 *
 * @param ref a branch or tag name, e.g. '5.7.x', 'release/4.1.1.1', 'main'
 * @param version a fallback version string, e.g. '6.4.16-SNAPSHOT'
 * @returns {{version: Version, fourDigit: boolean, unpublished: boolean}|null}
 *   null when neither the ref nor the fallback version yields a parseable
 *   major.minor. `unpublished` is true for a milestone/RC or a first-GA
 *   ('z.y.0') release, where the support-calendar generation may not exist
 *   or may not yet be accurate, and so should not be consulted.
 */
function resolveVersion({ ref, version }) {
  const bareRef = (ref || "").replace(REF_PREFIX, "");

  const hotfixLine = HOTFIX_LINE.exec(bareRef);
  if (hotfixLine) {
    return _fromString(
      `${hotfixLine[1]}.${hotfixLine[2]}.${hotfixLine[3]}.0`,
      false,
    );
  }

  const generation = GENERATION.exec(bareRef);
  if (generation) {
    return _fromString(`${generation[1]}.${generation[2]}.0`, false);
  }

  const release = RELEASE.exec(bareRef);
  if (release) {
    const resolved = _fromString(release[1], true);
    if (resolved) {
      return resolved;
    }
  }

  if (version) {
    return _fromString(version, true);
  }

  return null;
}

function _fromString(value, canBeUnpublished) {
  const v = new Version(value);
  if (Number.isNaN(v.major) || Number.isNaN(v.minor)) {
    return null;
  }
  const fourDigit = !Number.isNaN(v.build);
  const unpublished =
    canBeUnpublished && !fourDigit && (v.prerelease || v.patch === 0);
  return { version: v, fourDigit, unpublished };
}

export { resolveVersion };
