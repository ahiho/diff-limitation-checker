const core = require("@actions/core");
const { context, getOctokit } = require("@actions/github");

// most @actions toolkit packages have async methods
async function run() {
  try {
    const base = context.payload.pull_request.base.sha;
    const head = context.payload.pull_request.head.sha;

    const token = core.getInput("token");
    const octokit = getOctokit(token);
    // const client = new GitHub(core.getInput("token", { required: true }));
    // Use GitHub's compare two commits API.
    // https://developer.github.com/v3/repos/commits/#compare-two-commits
    const response = await octokit.rest.repos.compareCommits({
      base,
      head,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });

    // Ensure that the request was successful.
    if (response.status !== 200) {
      core.setFailed(
        `The GitHub API for comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200. ` +
          "Please submit an issue on this action's GitHub repo."
      );
    }

    const files = response.data.files;

    let changeCount = 0;
    for (const file of files) {
      if (file.status === "added" || file.status === "modified") {
        changeCount += 1;
      }
    }

    const maxFile = Number(core.getInput("max-file"));

    if (changeCount > maxFile) {
      const msg = `❌❌❌ PR contains has more than ${maxFile} files changed, pls explain ❗️❗️❗️`;
      octokit.rest.issues.createComment({
        body: msg,
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.pull_request.number,
      });
      core.setFailed(msg);
    } else {
      console.log("Done! PR seem fine");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
