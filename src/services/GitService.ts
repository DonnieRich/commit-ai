import * as vscode from 'vscode';
import { API, Repository } from '../@types/git';
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

export class GitService {

    constructor(
        private cwd?: vscode.Uri,
        private api?: API,
        private repository?: Repository,
    ) { }

    public async getDiff() {
        return { ...await exec('git diff --staged --minimal', { cwd: this.cwd?.fsPath }) };
    }

    public setCommitSuggestion(suggestion: string) {
        if (this.repository) {
            this.repository.inputBox.value = suggestion;
        }
    }

    public getCurrentRepository() {
        return this.repository;
    }

    public setCurrentRepository() {
        const repository = this.api?.repositories[0];
        if (repository === undefined) {
            throw new Error('No repository found!');
        }
        this.repository = repository;
    }

    private setCwd() {
        // get current working directory
        let cwd = vscode.Uri.parse('./');
        if (vscode.workspace.workspaceFolders) {
            cwd = vscode.workspace.workspaceFolders[0].uri;
        }

        if (cwd.toString().length <= 0) {
            throw new Error('Invalid workspace directory!');
        }

        this.cwd = cwd;
    }

    public async init() {
        try {
            const extension = vscode.extensions.getExtension("vscode.git");
            let gitExtension = undefined;

            if (extension !== undefined && extension.isActive) {
                gitExtension = extension.exports;
            } else {
                gitExtension = await extension?.activate();
            }

            this.api = gitExtension.getAPI(1);
            this.setCurrentRepository();
            this.setCwd();
        } catch (e) {
            throw new Error('Problem with git repo and/or with scm plugin');
        }
    }

}