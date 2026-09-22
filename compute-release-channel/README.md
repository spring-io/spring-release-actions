# compute-release-channel

Determines which release channel is underway on the current branch: **`lts`**, **`hotfix`**, **`internal`**, or **`oss`**.

- **`hotfix`** — a four-digit patch off of an already-released version (e.g. branch `4.1.1.x` or `release/4.1.1.1`).
- **`lts`** — a release of a Long-Term Support generation that is currently in its commercial support window (per the [Projects API](https://api.spring.io/projects) support calendar), running in a private repository.
- **`internal`** — a release of an OSS generation (still in its OSS support window), but running in a private repository, for example an internal CI mirror of an OSS branch.
- **`oss`** — a release of an OSS generation running in a public repository.

The action errors if none of the above apply — for example, a generation that is end-of-life, or a public repository hosting a commercial-phase-only branch.

## How it decides

The branch/tag ref name is the primary signal, since every caller has one regardless of build tool:

| Ref shape                                           | Example                                | Meaning                                                |
| --------------------------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| `<major>.<minor>.<patch>.x`                         | `4.1.1.x`                              | A hotfix line &rarr; always `hotfix`                   |
| `<major>.<minor>.x` or `<major>.<minor>.x-internal` | `5.7.x`, `7.2.x-internal`              | A generation branch                                    |
| `release/<version>`                                 | `release/4.1.1.1`, `release/7.3.0-RC1` | A release branch; a four-digit version &rarr; `hotfix` |
| anything else                                       | `main`, a feature branch               | No version to derive; see fallback below               |

If the ref doesn't match one of the version-shaped patterns above, the action falls back to the `version` input if one was provided (typically sourced from the [`compute-version`](../compute-version) action). If there's still no version to work with, the action skips the support-calendar lookup entirely and decides purely from repository visibility: `private` &rarr; `internal`, public &rarr; `oss`. This is intentional — it's what lets the same workflow file run unmodified in both a project's public OSS repository and a private internal mirror.

A milestone or RC version (`-M[0-9]+`, `-RC[0-9]+`) or a first-GA release of a generation (patch `0`, e.g. `release/7.0.0`) is classified the same way — purely from repository visibility, with **no support-calendar lookup at all**. This is deliberate: the calendar frequently hasn't been updated yet for a brand-new generation at that point in its lifecycle, so its data can't be trusted either way. A plain generation branch like `5.7.x` is not affected by this and always goes through the real calendar lookup below, since that branch is used across the generation's entire lifecycle, not just its first release.

Once a major/minor version is known, it isn't a four-digit hotfix version, and it isn't an early/unpublished release as described above, the action looks up the generation's current support-calendar phase (`oss`, `commercial`, or `eol`) and combines it with repository visibility:

| Support phase | Private repository | Public repository |
| ------------- | ------------------ | ----------------- |
| `oss`         | `internal`         | `oss`             |
| `commercial`  | `lts`              | _(error)_         |
| `eol`         | _(error)_          | _(error)_         |

## Inputs

| Input               | Required | Default                                            | Description                                                                                      |
| ------------------- | -------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `ref`               | No       | `${{ github.ref_name }}`                           | The branch or tag name to classify.                                                              |
| `version`           | No       | —                                                  | A fallback version string, used only when `ref` isn't a recognizable version-shaped branch name. |
| `private`           | No       | `${{ github.event.repository.private }}`           | Whether the current repository is private.                                                       |
| `repository`        | No       | `${{ github.repository }}`                         | The repository to use for project-slug derivation.                                               |
| `project-slug`      | No       | derived from `repository` (`-commercial` stripped) | The project slug for the Projects API.                                                           |
| `projects-api-base` | No       | `https://api.spring.io`                            | The base URL or filesystem path for the Projects API.                                            |

## Outputs

| Output    | Description                                                                         |
| --------- | ------------------------------------------------------------------------------------ |
| `channel` | The release channel underway on this branch: `lts`, `hotfix`, `internal`, or `oss`. |

## Example usage

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Compute release channel
        id: release-channel
        uses: ./compute-release-channel

      - name: Build
        uses: spring-io/spring-security-actions/build
        with:
          build-type: ${{ steps.release-channel.outputs.channel }}
```
