import { compareVersions } from "compare-versions";
import { Version } from "./versions.js";

// replaces the {major.minor} placeholder with the version's exact values, for
// websites that can't redirect a {version} placeholder
function _forVersion(url, version) {
  return url?.replace(/{major\.minor}/g, `${version.major}.${version.minor}`);
}

class Entry {
  constructor(version, isAntora, referenceDocUrl, apiDocUrl, current = false) {
    this.version = version;
    this.isAntora = isAntora;
    this.referenceDocUrl = _forVersion(referenceDocUrl, version);
    this.apiDocUrl = _forVersion(apiDocUrl, version);
    this.current = current;
  }

  get status() {
    if (this.version.ga) {
      return "GENERAL_AVAILABILITY";
    }
    if (this.version.prerelease) {
      return "PRERELEASE";
    }
    return "SNAPSHOT";
  }

  // the keys are those of the website's documentation.json, which differ from
  // the Projects API's (isAntora, referenceDocUrl and apiDocUrl)
  toJSON() {
    return {
      version: this.version.version,
      antora: this.isAntora,
      api: this.apiDocUrl,
      ref: this.referenceDocUrl,
      status: this.status,
      current: this.current,
    };
  }
}

const ENTERPRISE = "https://docs.enterprise.spring.io/";

// The enterprise website has no redirect from a generation's directory to the
// latest one, so the entries of the newest generation are linked without the
// {major}.{minor} directory (/reference/index.html), and every older one with
// it (/reference/7.0/index.html). Other URLs, which a project may have set by
// hand (/docs/{version}/api/index.html), are left as they are.
function _inGeneration(url, version, inDirectory) {
  if (!url?.startsWith(ENTERPRISE)) {
    return url;
  }
  const directory = `${version.major}.${version.minor}/`;
  return inDirectory
    ? url.replace(
        /\/reference\/(?=index\.html|api\/)/,
        `/reference/${directory}`,
      )
    : url.replace(`/reference/${directory}`, "/reference/");
}

/**
 * Links the entries of a commercial page the way its website needs: the newest
 * generation without the directory of its generation, the others with it.
 * Calling it again changes nothing.
 */
function linkGenerations(entries) {
  const newest = entries.reduce(
    (latest, { version }) =>
      !latest ||
      version.major > latest.major ||
      (version.major === latest.major && version.minor > latest.minor)
        ? version
        : latest,
    undefined,
  );
  for (const entry of entries) {
    const inDirectory = !entry.version.isSameMajorMinor(newest);
    entry.referenceDocUrl = _inGeneration(
      entry.referenceDocUrl,
      entry.version,
      inDirectory,
    );
    entry.apiDocUrl = _inGeneration(
      entry.apiDocUrl,
      entry.version,
      inDirectory,
    );
  }
  return entries;
}

class LearnPage {
  constructor(jsonContent = "[]") {
    this._entries = JSON.parse(jsonContent).map((entry) => {
      const version = new Version(entry.version);
      return new Entry(
        version,
        entry.antora,
        entry.ref,
        entry.api,
        entry.current,
      );
    });
  }

  get entries() {
    return this._entries;
  }

  set entries(entries) {
    this._entries = entries;
    this._sortAndMarkCurrent();
  }

  _sortAndMarkCurrent() {
    this._entries.sort((a, b) =>
      compareVersions(b.version.version, a.version.version),
    );
    let foundCurrent = false;
    for (const entry of this._entries) {
      if (entry.status === "GENERAL_AVAILABILITY" && !foundCurrent) {
        entry.current = true;
        foundCurrent = true;
      } else {
        entry.current = false;
      }
    }
  }

  toString() {
    return JSON.stringify(this._entries, null, 2) + "\n";
  }
}

export { Entry, LearnPage, linkGenerations };
