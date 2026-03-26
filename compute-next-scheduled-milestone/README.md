# compute-next-scheduled-milestone

Looks up the next open GitHub milestone for the given version's major/minor generation and reports the release version and how many days away it is.

The action accepts snapshot-style versions (`6.2.0-SNAPSHOT` or `6.2.x`). For GA or pre-release versions (e.g. `6.2.0`, `6.2.0-RC1`) both outputs are left empty.

## Inputs

| Input                  | Required | Default                    | Description |
|------------------------|----------|----------------------------|-------------|
| `snapshot-version`     | Yes      | —                          | The current project snapshot version (e.g. `6.2.0-SNAPSHOT` or `6.2.x`). |
| `milestone-token`      | No       | `$GITHUB_TOKEN`            | Token used to query GitHub milestone information. |
| `milestone-repository` | No       | `$GITHUB_REPOSITORY`       | Repository (e.g. `owner/repo`) whose milestones are queried. |

## Outputs

| Output            | Description |
|-------------------|-------------|
| `release-version` | The name of the next scheduled milestone (e.g. `6.2.0-RC1`). Empty if the version is not a snapshot or no open milestone exists. |
| `days-til-release`| Days until the milestone due date; `0` if due today. Empty if the version is not a snapshot or no open milestone exists. |

## Example usage

### Check upcoming milestone and act on it

```yaml
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Compute next scheduled milestone
        id: milestone
        uses: ./.github/actions/compute-next-scheduled-milestone
        with:
          snapshot-version: ${{ env.PROJECT_VERSION }}   # e.g. 6.2.0-SNAPSHOT

      - name: Notify if release is soon
        if: steps.milestone.outputs.release-version != ''
        run: |
          echo "Next release: ${{ steps.milestone.outputs.release-version }}"
          echo "Days away:    ${{ steps.milestone.outputs.days-til-release }}"
```

### Query milestones from a different repository

```yaml
      - name: Compute next scheduled milestone
        id: milestone
        uses: ./.github/actions/compute-next-scheduled-milestone
        with:
          snapshot-version: 6.3.0-SNAPSHOT
          milestone-repository: spring-projects/spring-security
          milestone-token: ${{ secrets.GH_ACTIONS_REPO_TOKEN }}
```

## Version behavior summary

| Version input      | Snapshot? | `release-version`  | `days-til-release` |
|--------------------|-----------|--------------------|--------------------|
| `6.2.0-SNAPSHOT`   | Yes       | next open milestone (e.g. `6.2.0-RC1`) | days until due date |
| `6.2.x`            | Yes       | next open milestone (e.g. `6.2.1`)     | days until due date |
| `6.2.0-RC1`        | No        | *(empty)*          | *(empty)*          |
| `6.2.0`            | No        | *(empty)*          | *(empty)*          |
| Any (no milestone) | Yes       | *(empty)*          | *(empty)*          |
