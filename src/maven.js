import axios from "axios";

const _noOpCore = {
  debug: () => {},
  info: () => {},
  warning: () => {},
  error: () => {},
};

/**
 * A class for checking Maven artifact availability in a repository
 * @author Josh Cummings
 */
class MavenArtifact {
  constructor(
    repositoryUrl,
    artifactPath,
    version,
    username = "",
    password = "",
    core = _noOpCore,
  ) {
    this.repositoryUrl = repositoryUrl.replace(/\/$/, "");
    this.artifactPath = artifactPath.replace(/^\//, "").replace(/\/$/, "");
    this.version = version;
    this.username = username;
    this.password = password;
    this.core = core;
  }

  get url() {
    const artifactName = this.artifactPath.split("/").pop();
    return `${this.repositoryUrl}/${this.artifactPath}/${this.version}/${artifactName}-${this.version}.jar`;
  }

  /**
   * Check whether the artifact jar exists in the repository.
   * @returns {Promise<boolean>} true if found, false if not found (404)
   * @throws if the server returns an unexpected error
   */
  async exists() {
    this.core.debug(`Checking for artifact at ${this.url}`);
    const config = {};
    if (this.username && this.password) {
      config.auth = { username: this.username, password: this.password };
    }
    try {
      const response = await axios.head(this.url, config);
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Poll for the artifact until it is found or the timeout expires.
   * @param {number} timeoutMinutes - the maximum number of minutes to wait
   * @param {number} intervalSeconds - how many seconds to wait between attempts (default 30)
   * @returns {Promise<boolean>} true if found within the timeout, false otherwise
   */
  async waitFor(timeoutMinutes, intervalSeconds = 30) {
    const deadline = Date.now() + timeoutMinutes * 60 * 1000;
    let attempt = 0;
    while (true) {
      attempt++;
      const remaining = deadline - Date.now();
      const remainingMinutes = Math.ceil(remaining / 60000);
      this.core.info(
        `Attempt ${attempt}: checking for artifact at ${this.url} (${remainingMinutes} minute(s) remaining)`,
      );
      if (await this.exists()) {
        this.core.info(`Artifact found at ${this.url}`);
        return true;
      }
      const remainingAfterCheck = deadline - Date.now();
      if (remainingAfterCheck <= 0) {
        this.core.info(`Artifact not found within ${timeoutMinutes} minute(s)`);
        return false;
      }
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          Math.min(intervalSeconds * 1000, remainingAfterCheck),
        ),
      );
    }
  }
}

export { MavenArtifact };
