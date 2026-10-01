import {
  humanizeProjectName,
  buildTemplateData,
  loadTemplate,
  renderPost,
} from '../../src/propose-release-blog-post/template.js';

describe('humanizeProjectName', () => {
  it('title-cases hyphenated words', () => {
    expect(humanizeProjectName('spring-boot')).toBe('Spring Boot');
  });

  it('uppercases known acronyms', () => {
    expect(humanizeProjectName('spring-data-jpa')).toBe('Spring Data JPA');
    expect(humanizeProjectName('spring-amqp')).toBe('Spring AMQP');
  });
});

describe('buildTemplateData', () => {
  it('builds a single-version view model', () => {
    const data = buildTemplateData(
      'spring-boot',
      [{ name: '4.0.8', number: 42, tag: 'v4.0.8' }],
      { repository: 'spring-projects/spring-boot', author: 'octocat' },
    );

    expect(data.projectName).toBe('Spring Boot');
    expect(data.projectSlug).toBe('spring-boot');
    expect(data.versions).toEqual([
      {
        version: '4.0.8',
        releaseNotesUrl: 'https://github.com/spring-projects/spring-boot/releases/tag/v4.0.8',
        milestoneUrl: 'https://github.com/spring-projects/spring-boot/milestone/42',
      },
    ]);
    expect(data.multipleVersions).toBe(false);
    expect(data.author).toBe('octocat');
    expect(data.githubUrl).toBe('https://github.com/spring-projects/spring-boot');
    expect(data.projectPageUrl).toBe('https://spring.io/projects/spring-boot');
    expect(data.docsUrl).toBe('https://docs.spring.io/spring-boot/reference/');
    expect(data.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('uses the tag as given, without assuming a v prefix', () => {
    const data = buildTemplateData(
      'spring-security',
      [{ name: '7.0.0', number: 7, tag: '7.0.0' }],
      { repository: 'spring-projects/spring-security', author: 'octocat' },
    );

    expect(data.versions[0].releaseNotesUrl).toBe(
      'https://github.com/spring-projects/spring-security/releases/tag/7.0.0',
    );
  });

  it('flags multiple versions', () => {
    const data = buildTemplateData(
      'spring-data',
      [
        { name: '2026.1.0-M1', number: 1 },
        { name: '2026.0.1', number: 2 },
      ],
      { repository: 'spring-projects/spring-data', author: 'octocat' },
    );

    expect(data.multipleVersions).toBe(true);
    expect(data.versions).toHaveLength(2);
  });
});

describe('renderPost', () => {
  it('renders single-version wording without the plural section', () => {
    const data = buildTemplateData(
      'spring-boot',
      [{ name: '4.0.8', number: 42 }],
      { repository: 'spring-projects/spring-boot', author: 'octocat' },
    );
    const output = renderPost(loadTemplate(), data);

    expect(output).toContain('title: "Spring Boot 4.0.8 Available Now"');
    expect(output).toContain('`Spring Boot 4.0.8` has');
    expect(output).toContain('## 4.0.8');
    expect(output).toContain('author: octocat');
  });

  it('renders multi-version wording with one section per version', () => {
    const data = buildTemplateData(
      'spring-data',
      [
        { name: '2026.1.0-M1', number: 1 },
        { name: '2026.0.1', number: 2 },
      ],
      { repository: 'spring-projects/spring-data', author: 'octocat' },
    );
    const output = renderPost(loadTemplate(), data);

    expect(output).toContain('title: "Spring Data Releases Available Now"');
    expect(output).toContain('the following releases of `Spring Data` have');
    expect(output).toContain('## 2026.1.0-M1');
    expect(output).toContain('## 2026.0.1');
  });
});
