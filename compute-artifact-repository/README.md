# compute-artifact-repository

Determines the deployment repository **URI** and **name** for publishing artifacts, based on the project version and whether the repository is commercial or OSS.

- **Commercial** repositories (repository name ending in `-commercial`) use Broadcom package repositories; the chosen repository depends on the version (snapshot, milestone/RC, or release).
- **OSS** repositories use Spring’s repo or Maven Central; snapshots go to `repo.spring.io`, releases to `central`.

## Inputs

| Input        | Required | Default                | Description                                                                 |
|-------------|----------|------------------------|-----------------------------------------------------------------------------|
| `version`   | Yes      | —                      | The version to deploy (e.g. `1.0.0`, `1.1.0-SNAPSHOT`, `2.0.0-M1`, `2.0.0-RC1`). |
| `repository`| No       | `${{ github.repository }}` | Repository identifier (e.g. `owner/repo`). Used to detect commercial by the `-commercial` suffix. |

## Outputs

| Output | Description |
|--------|-------------|
| `uri`  | The artifact repository base URI (e.g. `https://repo.spring.io`, `central`, or `https://usw1.packages.broadcom.com`). |
| `name` | The artifact repository name (e.g. `libs-snapshot-local`, `central`, or a commercial repo name). |

## Example usage

### Basic: use in a workflow and pass outputs to a later step

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Compute artifact repository
        id: repo
        uses: ./.github/actions/compute-artifact-repository
        with:
          version: ${{ github.ref_name }}   # or e.g. env.VERSION

      - name: Deploy
        run: |
          echo "Deploying to ${{ steps.repo.outputs.uri }} (${{ steps.repo.outputs.name }})"
```

## Version behavior summary

| Repository type | Version pattern   | URI                              | Name                              |
|-----------------|-------------------|-----------------------------------|-----------------------------------|
| OSS             | `*-SNAPSHOT`      | `https://repo.spring.io`          | `libs-snapshot-local`             |
| OSS             | release           | `central`                         | `central`                         |
| Commercial      | `*-SNAPSHOT`      | `https://usw1.packages.broadcom.com` | `spring-enterprise-maven-snapshot-local` |
| Commercial      | `*-RC*` or `*-M*` | `https://usw1.packages.broadcom.com` | `spring-enterprise-maven-milestone-local` |
| Commercial      | release           | `https://usw1.packages.broadcom.com` | `spring-enterprise-maven-prod-local`     |
