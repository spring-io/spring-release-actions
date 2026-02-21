import axios from "axios";

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
  ) {
    this.repositoryUrl = repositoryUrl.replace(/\/$/, "");
    this.artifactPath = artifactPath.replace(/^\//, "").replace(/\/$/, "");
    this.version = version;
    this.username = username;
    this.password = password;
  }

  get url() {
    return `${this.repositoryUrl}/${this.artifactPath}/${this.version}/`;
  }

  /**
   * Check whether the artifact version directory exists in the repository.
   * @returns {Promise<boolean>} true if found, false if not found (404)
   * @throws if the server returns an unexpected error
   */
  async exists() {
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
    while (true) {
      if (await this.exists()) {
        return true;
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        return false;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(intervalSeconds * 1000, remaining)),
      );
    }
  }
}

export { MavenArtifact };
