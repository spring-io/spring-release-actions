import * as core from "@actions/core";
import { Version } from "../versions.js";

const PROJECTS_API_BASE = "https://api.spring.io";

async function updateViaApi(inputs) {
  const apiBase = inputs.projectsApiBase ?? PROJECTS_API_BASE;
  const slug = inputs.projectSlug;
  const version = new Version(inputs.version);
  const snapshot = version.nextSnapshot();

  const credentials = Buffer.from(`${slug}:${inputs.token}`).toString("base64");
  const auth = `Basic ${credentials}`;

  const existing = await _fetchReleases(apiBase, slug);
  for (const r of existing) {
    if (version.isSameMajorMinor(new Version(r.version))) {
      core.info(`Deleting release ${r.version} from ${slug}`);
      await _deleteRelease(apiBase, slug, r.version, auth);
    }
  }

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
