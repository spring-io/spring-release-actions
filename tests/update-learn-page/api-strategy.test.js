import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { updateViaApi } from '../../src/update-learn-page/api-strategy.js';

vi.mock('@actions/core', async () => await import('../../__fixtures__/core.js'));

const API_BASE = 'http://localhost:9999';

const defaultInputs = {
  version: '1.2.3',
  projectSlug: 'spring-boot',
  isAntora: true,
  resolvedRefDocUrl: 'https://docs.spring.io/spring-boot/reference/{version}/index.html',
  resolvedApiDocUrl: 'https://docs.spring.io/spring-boot/site/docs/{version}/api/',
  token: 'test-token',
  projectsApiBase: API_BASE,
};

describe('api-strategy', () => {
  let releases;
  let deletedVersions;
  let createdReleases;

  const server = setupServer(
    http.get(`${API_BASE}/projects/:slug/releases`, () => {
      return HttpResponse.json({
        _embedded: { releases },
      });
    }),
    http.delete(`${API_BASE}/projects/:slug/releases/:version`, ({ params }) => {
      deletedVersions.push(decodeURIComponent(params.version));
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${API_BASE}/projects/:slug/releases`, async ({ request }) => {
      const body = await request.json();
      createdReleases.push(body);
      return new HttpResponse(null, { status: 201 });
    }),
  );

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => server.close());

  beforeEach(() => {
    releases = [];
    deletedVersions = [];
    createdReleases = [];
    server.resetHandlers();
  });

  it('creates GA and snapshot releases when none exist', async () => {
    await updateViaApi(defaultInputs);

    expect(deletedVersions).toHaveLength(0);
    expect(createdReleases).toHaveLength(2);
    expect(createdReleases[0].version).toBe('1.2.3');
    expect(createdReleases[1].version).toBe('1.2.4-SNAPSHOT');
  });

  it('deletes same-generation releases before creating new ones', async () => {
    releases = [
      { version: '1.2.2', status: 'GENERAL_AVAILABILITY' },
      { version: '1.2.3-SNAPSHOT', status: 'SNAPSHOT' },
      { version: '1.1.0', status: 'GENERAL_AVAILABILITY' },
    ];

    await updateViaApi(defaultInputs);

    expect(deletedVersions).toContain('1.2.2');
    expect(deletedVersions).toContain('1.2.3-SNAPSHOT');
    expect(deletedVersions).not.toContain('1.1.0');
    expect(createdReleases).toHaveLength(2);
    expect(createdReleases[0].version).toBe('1.2.3');
    expect(createdReleases[1].version).toBe('1.2.4-SNAPSHOT');
  });

  it('sends correct fields in POST body', async () => {
    await updateViaApi(defaultInputs);

    const ga = createdReleases.find((r) => r.version === '1.2.3');
    expect(ga.isAntora).toBe(true);
    expect(ga.referenceDocUrl).toBe(defaultInputs.resolvedRefDocUrl);
    expect(ga.apiDocUrl).toBe(defaultInputs.resolvedApiDocUrl);
  });

  it('sends HTTP Basic auth with project slug as username', async () => {
    const receivedAuth = [];
    server.use(
      http.post(`${API_BASE}/projects/:slug/releases`, ({ request }) => {
        receivedAuth.push(request.headers.get('Authorization'));
        return new HttpResponse(null, { status: 201 });
      }),
    );

    await updateViaApi(defaultInputs);

    const expected = `Basic ${Buffer.from('spring-boot:test-token').toString('base64')}`;
    expect(receivedAuth[0]).toBe(expected);
  });

  it('throws when the releases list request fails', async () => {
    server.use(
      http.get(`${API_BASE}/projects/:slug/releases`, () => {
        return new HttpResponse(null, { status: 503 });
      }),
    );

    await expect(updateViaApi(defaultInputs)).rejects.toThrow('503');
  });

  it('throws when a release creation fails', async () => {
    server.use(
      http.post(`${API_BASE}/projects/:slug/releases`, () => {
        return new HttpResponse(null, { status: 422 });
      }),
    );

    await expect(updateViaApi(defaultInputs)).rejects.toThrow('422');
  });
});
