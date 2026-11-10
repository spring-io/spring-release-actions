import * as core from "@actions/core";
import { Version } from "../versions.js";

const PROJECTS_API_BASE = "https://api.spring.io";

// The Projects API authenticates with the login of a member of the spring-io/spring-team
// GitHub team and that user's token, so the username cannot be the project slug.
const PROJECTS_API_USERNAME = "spring-builds";

// A DELETE commits to the project's documentation.json, and the API only drops the release
// from the list it answers with when GitHub's push webhook refreshes its cache. Until then
// a POST of the same version is refused as already present, so wait for the deletes to show.
const DELETE_POLL_INTERVAL_MS = 2000;
const DELETE_POLL_ATTEMPTS = 60;

async function updateViaApi(inputs) {
  const apiBase = inputs.projectsApiBase ?? PROJECTS_API_BASE;
  const slug = inputs.projectSlug;
  const version = new Version(inputs.version);
  const snapshot = version.nextSnapshot();

  const credentials = Buffer.from(
    `${PROJECTS_API_USERNAME}:${inputs.token}`,
  ).toString("base64");
  const auth = `Basic ${credentials}`;

  const existing = await _fetchReleases(apiBase, slug);
  const deleted = [];
  for (const r of existing) {
    if (version.isSameMajorMinor(new Version(r.version))) {
      core.info(`Deleting release ${r.version} from ${slug}`);
      await _deleteRelease(apiBase, slug, r.version, auth);
      deleted.push(r.version);
    }
  }
  await _awaitDeleted(
    apiBase,
    slug,
    deleted,
    inputs.deletePollIntervalMs ?? DELETE_POLL_INTERVAL_MS,
  );

  core.info(`Creating release ${inputs.version} for ${slug}`);
  await _createRelease(
    apiBase,
    slug,
    inputs.version,
    inputs.isAntora,
    inputs.resolvedRefDocUrl,
    inputs.resolvedApiDocUrl,
    auth,
  );

  core.info(`Creating release ${snapshot.version} for ${slug}`);
  await _createRelease(
    apiBase,
    slug,
    snapshot.version,
    inputs.isAntora,
    inputs.resolvedRefDocUrl,
    inputs.resolvedApiDocUrl,
    auth,
  );
}

async function _fetchReleases(apiBase, slug) {
  const url = `${apiBase}/projects/${slug}/releases`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to list releases for ${slug}: ${response.status} ${response.statusText}`,
    );
  }
  const body = await response.json();
  return body._embedded?.releases ?? [];
}

async function _awaitDeleted(apiBase, slug, versions, intervalMs) {
  if (versions.length === 0) {
    return;
  }
  for (let attempt = 1; attempt <= DELETE_POLL_ATTEMPTS; attempt++) {
    const remaining = (await _fetchReleases(apiBase, slug)).filter((r) =>
      versions.includes(r.version),
    );
    if (remaining.length === 0) {
      return;
    }
    core.info(
      `Waiting for the API to drop ${remaining.map((r) => r.version).join(", ")} (${attempt}/${DELETE_POLL_ATTEMPTS})`,
    );
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(
    `Timed out waiting for the API to drop the deleted releases of ${slug}: ${versions.join(", ")}`,
  );
}

async function _deleteRelease(apiBase, slug, version, auth) {
  const url = `${apiBase}/projects/${slug}/releases/${encodeURIComponent(version)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: auth },
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(
      `Failed to delete release ${version}: ${response.status} ${response.statusText}`,
    );
  }
}

async function _createRelease(
  apiBase,
  slug,
  version,
  isAntora,
  referenceDocUrl,
  apiDocUrl,
  auth,
) {
  const url = `${apiBase}/projects/${slug}/releases`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ version, isAntora, referenceDocUrl, apiDocUrl }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create release ${version}: ${response.status} ${response.statusText}`,
    );
  }
}

export { updateViaApi };
