import Mustache from "mustache";
import { releaseAnnouncementTemplate } from "./release-announcement-template.js";

// The template renders Markdown, not HTML, so turn off Mustache's default
// HTML-entity escaping (it would otherwise mangle URLs like "/" -> "&#x2F;").
Mustache.escape = (value) => value;

const _ACRONYMS = {
  ai: "AI",
  amqp: "AMQP",
  jdbc: "JDBC",
  jpa: "JPA",
  ldap: "LDAP",
  r2dbc: "R2DBC",
  graphql: "GraphQL",
};

/**
 * Turn a project slug (for example, {@code spring-data-jpa}) into a
 * human-friendly display name (for example, {@code Spring Data JPA}).
 *
 * This is a best-effort guess meant for a draft blog post; a human reviews
 * and corrects it before publishing.
 *
 * @param {string} slug
 * @returns {string}
 */
function humanizeProjectName(slug) {
  return slug
    .split("-")
    .map((word) => _ACRONYMS[word.toLowerCase()] ?? _capitalize(word))
    .join(" ");
}

function _capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Build the view model consumed by the release announcement template.
 *
 * @param {string} projectSlug
 * @param {Array<{ name: string, number: number, tag: string }>} milestones closed milestones, one per released version, with the git tag each was released under
 * @param {{ repository: string, author: string }} options
 * @returns {object}
 */
function buildTemplateData(projectSlug, milestones, { repository, author }) {
  const githubUrl = `https://github.com/${repository}`;
  const versions = milestones.map((milestone) => ({
    version: milestone.name,
    releaseNotesUrl: `${githubUrl}/releases/tag/${milestone.tag}`,
    milestoneUrl: `${githubUrl}/milestone/${milestone.number}`,
  }));

  return {
    projectName: humanizeProjectName(projectSlug),
    projectSlug,
    versions,
    multipleVersions: versions.length > 1,
    publishedAt: new Date().toISOString().substring(0, 10),
    author,
    githubUrl,
    projectPageUrl: `https://spring.io/projects/${projectSlug}`,
    docsUrl: `https://docs.spring.io/${projectSlug}/reference/`,
  };
}

/**
 * Load the release announcement template.
 *
 * @returns {string}
 */
function loadTemplate() {
  return releaseAnnouncementTemplate;
}

/**
 * Render the release announcement template with the given view model.
 *
 * @param {string} template
 * @param {object} data
 * @returns {string}
 */
function renderPost(template, data) {
  return Mustache.render(template, data);
}

export { humanizeProjectName, buildTemplateData, loadTemplate, renderPost };
