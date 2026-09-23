# compute-release-channel

Determines which release channel is underway for a given project version: **`lts`**, **`hotfix`**, **`internal`**, or **`oss`**.

- **`hotfix`** — a four-digit patch off of an already-released version (e.g. `4.1.1.1`).
- **`lts`** — a release of a Long-Term Support generation that is currently in its commercial support window (per the [Projects API](https://api.spring.io/projects) support calendar), running in a private repository.
- **`internal`** — a release of an OSS generation (still in its OSS support window), but running in a private repository, for example an internal CI mirror of an OSS branch.
- **`oss`** — a release of an OSS generation running in a public repository.

The action errors if none of the above apply — for example, a generation that is end-of-life, or a public repository hosting a commercial-phase-only or otherwise private-only version.

## How it decides

The project `version` is the sole signal, not the branch/tag name. Some projects (for example, spring-session) use branch names that don't match the version they build, so deriving the channel from the branch name can silently produce the wrong answer. Deciding from the version alone also keeps this action aligned with build tooling (such as Gradle plugins) that classifies the same way, purely from the version.

| Version shape                                  | Example                                | Meaning                                                                            |
| ------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------ |
| Four-digit (`<major>.<minor>.<patch>.<build>`) | `4.1.1.1`                               | A hotfix line &rarr; `hotfix` in a private repository, error if public              |
| `-INTERNAL` classifier                          | `7.2.1-INTERNAL-SNAPSHOT`               | An internal-only build &rarr; `internal` in a private repository, error if public   |
| anything else                                   | `5.7.29`, `7.2.0-M1`, `6.4.16-SNAPSHOT` | Looked up against the support calendar, below                                       |

Once a version is known to be neither four-digit nor `-INTERNAL`, the action looks up the generation's current support-calendar phase (`oss`, `commercial`, or `eol`) and combines it with repository visibility:

| Support phase | Private repository | Public repository |
| ------------- | ------------------- | ------------------ |
| `oss`         | `internal`          | `oss`              |
| `commercial`  | `lts`                | _(error)_          |
| `eol`         | _(error)_            | _(error)_          |

If the support calendar has no data yet for the version's generation (for example, a brand-new milestone), the action falls back to deciding purely from repository visibility: `private` &rarr; `internal`, public &rarr; `oss`. This is what lets the same workflow file run unmodified in both a project's public OSS repository and a private internal mirror, even before that generation's dates are published.

## Inputs

| Input               | Required | Default                                            | Description                                          |
| -------------------- | --------- | ---------------------------------------------------- | ------------------------------------------------------ |
| `version`           | Yes      | —                                                   | The project version to classify.                     |
| `private`           | No       | `${{ github.event.repository.private }}`           | Whether the current repository is private.           |
| `repository`        | No       | `${{ github.repository }}`                         | The repository to use for project-slug derivation.  |
| `project-slug`      | No       | derived from `repository` (`-commercial` stripped) | The project slug for the Projects API.               |
| `projects-api-base` | No       | `https://api.spring.io`                            | The base URL or filesystem path for the Projects API. |

## Outputs

| Output    | Description                                                                         |
| --------- | ------------------------------------------------------------------------------------ |
| `channel` | The release channel underway for this version: `lts`, `hotfix`, `internal`, or `oss`. |

## Example usage

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Compute version
        id: version
        uses: ./compute-version

      - name: Compute release channel
        id: release-channel
        uses: ./compute-release-channel
        with:
          version: ${{ steps.version.outputs.version }}

      - name: Build
        uses: spring-io/spring-security-actions/build
        with:
          build-type: ${{ steps.release-channel.outputs.channel }}
```
