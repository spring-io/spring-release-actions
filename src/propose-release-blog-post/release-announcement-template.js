// Mustache template for the release announcement blog post (Markdown).
// Kept as a JS module so that it is inlined into the ncc bundle.
const releaseAnnouncementTemplate = `---
title: "{{projectName}} {{#multipleVersions}}Releases{{/multipleVersions}}{{^multipleVersions}}{{versions.0.version}}{{/multipleVersions}} Available Now"
category: Releases
publishedAt: {{publishedAt}}
author: {{author}}
---

On behalf of the team and everyone who has contributed, I'm happy to announce that {{^multipleVersions}}\`{{projectName}} {{versions.0.version}}\` has{{/multipleVersions}}{{#multipleVersions}}the following releases of \`{{projectName}}\` have{{/multipleVersions}} been released and {{^multipleVersions}}is{{/multipleVersions}}{{#multipleVersions}}are{{/multipleVersions}} now available from Maven Central.

{{#versions}}
## {{version}}

* [Release Notes]({{releaseNotesUrl}})
* [Milestone]({{milestoneUrl}})

{{/versions}}
Thanks to all who contributed with issue reports and pull requests.

As always, we welcome your feedback on [GitHub]({{githubUrl}}/issues).

[Project Page]({{projectPageUrl}}) | [GitHub]({{githubUrl}}) | [Issues]({{githubUrl}}/issues) | [Documentation]({{docsUrl}})
`;

export { releaseAnnouncementTemplate };
