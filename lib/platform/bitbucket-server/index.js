const URL = require('url');
// const is = require('@sindresorhus/is');
// const addrs = require('email-addresses');
const _ = require('lodash');

const api = require('./bb-got-wrapper');
const utils = require('./utils');

const hostRules = require('../../util/host-rules');
const GitStorage = require('../git/storage');

const platform = 'bitbucket-server';

let config = {};

module.exports = {
  getRepos,
  cleanRepo,
  initRepo,
  getRepoStatus,
  getRepoForceRebase,
  setBaseBranch,
  // Search
  getFileList,
  // Branch
  branchExists,
  getAllRenovateBranches,
  isBranchStale,
  getBranchPr,
  getBranchStatus,
  getBranchStatusCheck,
  setBranchStatus,
  deleteBranch,
  mergeBranch,
  getBranchLastCommitTime,
  // issue
  findIssue,
  ensureIssue,
  ensureIssueClosing,
  addAssignees,
  addReviewers,
  deleteLabel,
  // Comments
  ensureComment,
  ensureCommentRemoval,
  // PR
  getPrList,
  findPr,
  createPr,
  getPr,
  getPrFiles,
  updatePr,
  mergePr,
  getPrBody,
  // file
  commitFilesToBranch,
  getFile,
  // commits
  getCommitMessages,
  // vulnerability alerts
  getVulnerabilityAlerts,
};

// Get all repositories that the user has access to
async function getRepos(token, endpoint) {
  logger.debug(`getRepos(token, endpoint)`);
  const opts = hostRules.find({ platform }, { token, endpoint });
  // istanbul ignore next
  if (!opts.token) {
    throw new Error('No token found for getRepos');
  }
  hostRules.update({ ...opts, platform, default: true });
  try {
    const projects = await utils.accumulateValues('/rest/api/1.0/projects');
    const repos = await Promise.all(
      projects.map(({ key }) =>
        // TODO: can we filter this by permission=REPO_WRITE?
        utils.accumulateValues(`/rest/api/1.0/projects/${key}/repos`)
      )
    );
    const result = _.flatten(repos).map(
      r => `${r.project.key.toLowerCase()}/${r.name}`
    );
    logger.debug({ result }, 'result of getRepos()');
    return result;
  } catch (err) /* istanbul ignore next */ {
    logger.error({ err }, `bitbucket getRepos error`);
    throw err;
  }
}

function cleanRepo() {
  logger.debug(`cleanRepo()`);
}

// Initialize GitLab by getting base branch
async function initRepo({
  repository,
  token,
  endpoint,
  gitAuthor,
  gitFs = 'http', // TODO
  localDir,
}) {
  logger.debug(
    `initRepo("${JSON.stringify(
      { repository, token, endpoint, gitAuthor, gitFs, localDir },
      null,
      2
    )}")`
  );
  const opts = hostRules.find(
    { platform: 'bitbucket-server' },
    { token, endpoint }
  );
  // istanbul ignore next
  if (!opts.token) {
    throw new Error(
      `No token found for Bitbucket Server repository ${repository}`
    );
  }
  logger.debug({ token: opts.token }, 'TOKEN');

  throw new Error('needs implementation');
}

function getRepoForceRebase() {
  logger.debug(`getRepoForceRebase()`);
  // TODO if applicable
  // This function should return true only if the user has enabled a setting on the repo that enforces PRs to be kept up to date with master
  // In such cases we rebase Renovate branches every time they fall behind
  // In GitHub this is part of "branch protection"
  return false;
}

async function setBaseBranch(branchName) {
  logger.debug(`setBaseBranch(${branchName})`);
  if (branchName) {
    logger.debug(`Setting baseBranch to ${branchName}`);
    config.baseBranch = branchName;
    await config.storage.setBaseBranch(branchName);
  }
}

// Search

// Get full file list
function getFileList(branchName = config.baseBranch) {
  logger.debug(`getFileList(${branchName})`);
  return config.storage.getFileList(branchName);
}

// Branch

// Returns true if branch exists, otherwise false
function branchExists(branchName) {
  logger.debug(`branchExists(${branchName})`);
  return config.storage.branchExists(branchName);
}

// Returns the Pull Request for a branch. Null if not exists.
async function getBranchPr(branchName) {
  logger.debug(`getBranchPr(${branchName})`);
  throw new Error('needs implementation');
}

function getAllRenovateBranches(branchPrefix) {
  logger.debug('getAllRenovateBranches');
  return config.storage.getAllRenovateBranches(branchPrefix);
}

function isBranchStale(branchName) {
  logger.debug(`isBranchStale(${branchName})`);
  return config.storage.isBranchStale(branchName);
}

async function commitFilesToBranch(
  branchName,
  files,
  message,
  parentBranch = config.baseBranch
) {
  logger.debug(
    `commitFilesToBranch(${JSON.stringify(
      { branchName, filesLength: files.length, message, parentBranch },
      null,
      2
    )})`
  );
  throw new Error('needs implementation');
}

function getFile(filePath, branchName) {
  logger.debug(`getFile(${filePath}, ${branchName})`);
  return config.storage.getFile(filePath, branchName);
}

async function deleteBranch(branchName, closePr = false) {
  logger.debug(`deleteBranch(${branchName}, closePr=${closePr})`);
  if (closePr) {
    throw new Error('needs implementation');
  }
  return config.storage.deleteBranch(branchName);
}

function mergeBranch(branchName) {
  logger.debug(`mergeBranch(${branchName})`);
  return config.storage.mergeBranch(branchName);
}

function getBranchLastCommitTime(branchName) {
  logger.debug(`getBranchLastCommitTime(${branchName})`);
  return config.storage.getBranchLastCommitTime(branchName);
}

// istanbul ignore next
function getRepoStatus() {
  return config.storage.getRepoStatus();
}

// Returns the combined status for a branch.
function getBranchStatus(branchName, requiredStatusChecks) {
  logger.debug(
    `getBranchStatus(${branchName}, requiredStatusChecks=${!!requiredStatusChecks})`
  );
  // TODO: Needs implementation
  // This is used by Renovate to determine if a branch can be automerged
  // Is also used if the user configures prCreation="not-pending"
  return 'pending';
}

async function getBranchStatusCheck(branchName, context) {
  logger.debug(`getBranchStatusCheck(${branchName}, context=${context})`);
  // TODO: Needs implementation
  // This used when Renovate is adding its own status checks, such as for lock file failure or for unpublishSafe=true
  return null;
}

async function setBranchStatus(
  branchName,
  context,
  description,
  state,
  targetUrl
) {
  logger.debug(`setBranchStatus(${branchName})`);
  // TODO: Needs implementation
  // This used when Renovate is adding its own status checks, such as for lock file failure or for unpublishSafe=true
}

// Issue

async function getIssueList() {
  logger.debug(`getIssueList()`);
  // TODO: Needs implementation
  // This is used by Renovate when creating its own issues, e.g. for deprecated package warnings, config error notifications, or "masterIssue"
  return [];
}

async function findIssue(title) {
  logger.debug(`findIssue(${title})`);
  // TODO: Needs implementation
  // This is used by Renovate when creating its own issues, e.g. for deprecated package warnings, config error notifications, or "masterIssue"
  return null;
}

async function ensureIssue(title, body) {
  logger.debug(`ensureIssue(${title}, body={${body}})`);
  // TODO: Needs implementation
  // This is used by Renovate when creating its own issues, e.g. for deprecated package warnings, config error notifications, or "masterIssue"
  return null;
}

async function ensureIssueClosing(title) {
  logger.debug(`ensureIssueClosing(${title})`);
  // TODO: Needs implementation
  // This is used by Renovate when creating its own issues, e.g. for deprecated package warnings, config error notifications, or "masterIssue"
}

async function addAssignees(iid, assignees) {
  logger.debug(`addAssignees(${iid})`);
  // TODO: Needs implementation
  // Currently Renovate does "Create PR" and then "Add assignee" as a two-step process, with this being the second step.
}

function addReviewers(iid, reviewers) {
  logger.debug(`addReviewers(${iid})`);
  // TODO: Needs implementation
  // Only applicable if Bitbucket supports the concept of "reviewers"
}

async function deleteLabel(issueNo, label) {
  logger.debug(`deleteLabel(${issueNo})`);
  // TODO: Needs implementation
  // Only used for the "request Renovate to rebase a PR using a label" feature
}

async function ensureComment(issueNo, topic, content) {
  logger.debug(`ensureComment(${issueNo})`);
  // TODO: Needs implementation
  // Used when Renovate needs to add comments to a PR, such as lock file errors, PR modified notifications, etc.
}

async function ensureCommentRemoval(issueNo, topic) {
  logger.debug(`ensureCommentRemoval(${issueNo})`);
  // TODO: Needs implementation
  // Used when Renovate needs to add comments to a PR, such as lock file errors, PR modified notifications, etc.
}

async function getPrList() {
  logger.debug(`getPrList()`);
  throw new Error('needs implementation');
}

async function findPr(branchName, prTitle, state = 'all') {
  logger.debug(`findPr(${branchName})`);
  throw new Error('needs implementation');
}

// Pull Request

async function createPr(
  branchName,
  title,
  description,
  labels,
  useDefaultBranch
) {
  logger.debug(`createPr(${branchName}, title=${title})`);
  throw new Error('needs implementation');
}

async function getPr(iid) {
  logger.debug(`getPr(${iid})`);
  throw new Error('needs implementation');
}

// Return a list of all modified files in a PR
async function getPrFiles(mrNo) {
  logger.debug(`getPrFiles(${mrNo})`);
  // TODO: Needs implementation
  // Used only by Renovate if you want it to validate user PRs that contain modifications of the Renovate config
  return [];
}

async function updatePr(iid, title, description) {
  logger.debug(`updatePr(${iid}, title=${title})`);
  throw new Error('needs implementation');
}

async function mergePr(iid) {
  logger.debug(`mergePr(${iid})`);
  // TODO: Needs implementation
  // Used for "automerge" feature
  return false;
}

function getPrBody(input) {
  logger.debug(`getPrBody(${input})`);
  throw new Error('needs implementation');
}

function getCommitMessages() {
  logger.debug(`getCommitMessages()`);
  return config.storage.getCommitMessages();
}

function getVulnerabilityAlerts() {
  logger.debug(`getVulnerabilityAlerts()`);
  return [];
}
