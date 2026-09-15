#!/usr/bin/env bash
#
# Finds every SHA-pinned reference to spring-io/spring-release-actions in a
# project (e.g. `uses: spring-io/spring-release-actions/compute-version@<sha>  # 0.0.5`)
# and rewrites the SHA and trailing version comment to match a target release.
#
# By default the target release is whichever spring-io/spring-release-actions
# tag is newest, resolved from GitHub over the network. Pass a tag explicitly
# to pin to something else instead.
#
# If target-dir is inside a git work tree and any file was changed, the
# changed files are committed with the message "Update to spring-release-actions <tag>".
#
# Usage:
#   update-release-actions-refs.sh [target-dir] [tag]
#
#   target-dir  Directory to search. Defaults to the current directory.
#   tag         spring-release-actions tag to update to, e.g. 0.0.6.
#               Defaults to the latest tag on GitHub.

set -euo pipefail

REPO="spring-io/spring-release-actions"
REPO_URL="https://github.com/${REPO}.git"

TARGET_DIR="${1:-.}"
TAG="${2:-}"

if [[ ! -d "${TARGET_DIR}" ]]; then
  echo "error: target directory '${TARGET_DIR}' does not exist" >&2
  exit 1
fi

TARGET_DIR="$(cd "${TARGET_DIR}" && pwd)"

TAGS_REMOTE="$(git ls-remote --tags "${REPO_URL}")"

if [[ -z "${TAG}" ]]; then
  TAG="$(
    echo "${TAGS_REMOTE}" \
      | awk '{print $2}' | sed -E 's#^refs/tags/##' \
      | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' \
      | sort -t. -k1,1n -k2,2n -k3,3n \
      | tail -n1
  )"
fi

if [[ -z "${TAG}" ]]; then
  echo "error: could not determine a release tag for ${REPO}" >&2
  exit 1
fi

SHA="$(echo "${TAGS_REMOTE}" | awk -v ref="refs/tags/${TAG}" '$2 == ref {print $1}')"

if [[ -z "${SHA}" ]]; then
  echo "error: tag '${TAG}' not found on ${REPO}" >&2
  exit 1
fi

echo "Updating references to ${REPO} -> ${TAG} (${SHA})"

MATCH="${REPO}/[A-Za-z0-9._/-]+@[0-9a-f]{40}[[:space:]]*#[[:space:]]*[0-9]+\.[0-9]+\.[0-9]+"
UPDATED_FILES=()

while IFS= read -r -d '' file; do
  grep -qE "${MATCH}" "${file}" || continue

  backup="$(mktemp)"
  cp "${file}" "${backup}"

  perl -pi -e "s{(\Q${REPO}\E/[A-Za-z0-9._/-]+)\@[0-9a-f]{40}([ \t]*#[ \t]*)[0-9]+\.[0-9]+\.[0-9]+}{\${1}\@${SHA}\${2}${TAG}}g" "${file}"

  if ! cmp -s "${backup}" "${file}"; then
    echo "  updated: ${file}"
    UPDATED_FILES+=("${file}")
  fi
  rm -f "${backup}"
done < <(find "${TARGET_DIR}" \( -name '*.yml' -o -name '*.yaml' \) -type f -not -path '*/.git/*' -print0)

if [[ "${#UPDATED_FILES[@]}" -eq 0 ]]; then
  echo "No outdated references found; nothing to do."
elif git -C "${TARGET_DIR}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git -C "${TARGET_DIR}" add -- "${UPDATED_FILES[@]}"
  git -C "${TARGET_DIR}" commit -m "Update to spring-release-actions ${TAG}"
else
  echo "warning: ${TARGET_DIR} is not inside a git work tree; skipping commit" >&2
fi
