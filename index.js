const core = require("@actions/core");
const { exec } = require("child_process");

// most @actions toolkit packages have async methods
async function run() {
  try {
    const targetBranch = core.getInput("target-branch");
    const change = await new Promise((resolve, reject) => {
      exec(
        `git --no-pager diff --shortstat origin/${targetBranch}`,
        (err, stdout, stderr) => {
          if (!!err) {
            reject(err);
            return;
          }
          if (!!stderr) {
            reject(stderr);
            return;
          }
          resolve(stdout);
        }
      );
    });

    if (!change) {
      return;
    }
    const idx = change.indexOf("files changed");
    if (idx <= 0) {
      return;
    }
    const changeCount = Number(change.substring(0, idx).replace(/ |\n/g, ""));
    const maxFile = Number(core.getInput("max-file"));
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);

    const [owner, repo] = core.getInput("repository").split("/");

    if (changeCount > maxFile) {
      const msg = `PR contains has more than ${maxFile} files changed, pls explain`;
      octokit.rest.issues.createComment({
        body: msg,
        repo,
        owner,
        issue_number: Number(core.getInput("issue-number")),
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
