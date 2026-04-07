# compute-build-name

Computes the Artifactory **build name** and **build number** from the project version and repository name.

- For SNAPSHOT versions, the branch version is derived as `MAJOR.MINOR.x`.
- For release versions (GA, milestone, RC), the version is used directly.

## Inputs

| Input        | Required | Default                     | Description                                                              |
|-------------|----------|-----------------------------|--------------------------------------------------------------------------|
| `version`   | Yes      | —                           | The project version (e.g. `6.5.0-SNAPSHOT`, `6.5.0`, `6.5.0-M1`).       |
| `repository`| No       | `${{ github.repository }}`  | Repository identifier (e.g. `owner/repo`). The repo name is extracted.   |

## Outputs

| Output         | Description                        |
|----------------|------------------------------------|
| `build-name`   | The Artifactory build name.        |

## Example usage

### Snapshot build

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Compute version
        id: version
        uses: spring-io/spring-release-actions/compute-version@main

      - name: Compute build name
        id: build-name
        uses: spring-io/spring-release-actions/compute-build-name@main
        with:
          version: ${{ steps.version.outputs.version }}

      - name: Deploy
        run: |
          echo "Build: ${{ steps.build-name.outputs.build-name }}"
```

## Version behavior summary

| Version pattern  | Build name          |
|------------------|---------------------|
| `6.5.0-SNAPSHOT` | `{repo}-6.5.x`     |
| `6.5.0`          | `{repo}-6.5.0`     |
| `6.5.0-M1`       | `{repo}-6.5.0-M1`  |
| `6.5.0-RC1`      | `{repo}-6.5.0-RC1` |
