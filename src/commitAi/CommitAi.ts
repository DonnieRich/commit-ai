/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { API as GitApi, Repository } from '../@types/git';
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const { encode } = require('gpt-3-encoder');
const { Configuration, OpenAIApi } = require('openai');

export class CommitAi {

    constructor(
        public context: vscode.ExtensionContext,
        private enabled: Boolean = false,
        private apiKey: string = '',
        private gitApi?: GitApi,
        private repository?: Repository,
    ) {
        this.init();
    }

    public async checkApiKey() {
        if (!this.context.workspaceState.get('isOpenAiApiKeySet', false)) {
            await this.writeApiKey();
        }
    }

    public async setApiKey() {
        if (this.apiKey.length <= 0) {
            const apiKey = await this.readApiKey();
            this.apiKey = apiKey;
        }
    }

    public async writeApiKey() {
        const apiKey = await vscode.window.showInputBox({
            prompt: "Please insert API Key",
            title: "API Key"
        });
        await this.context.secrets.store('openai-api-key', apiKey || "");
        vscode.commands.executeCommand('setContext', 'commit-ai.isOpenAiApiKeySet', true);
        this.context.workspaceState.update('isOpenAiApiKeySet', true);

        await this.setApiKey();

        // Display a message box to the user
        vscode.window.showInformationMessage('commit-ai API key set!');
    }

    public async clearApiKey() {
        const resp = await vscode.window.showInformationMessage(
            "Clear OpenAi Api key?",
            "Clear",
        );

        if (resp === "Clear") {
            await this.context.secrets.store('openai-api-key', "");
            vscode.commands.executeCommand('setContext', 'commit-ai.isOpenAiApiKeySet', false);
            this.context.workspaceState.update('isOpenAiApiKeySet', undefined);

            // Display a message box to the user
            vscode.window.showInformationMessage('commit-ai API key cleared!');
        }
    }

    private async readApiKey() {
        return await this.context.secrets.get('openai-api-key') || "";
    }

    public disable() {
        this.enabled = false;
    }

    private async getDiff(cwd: vscode.Uri) {
        const { stdout, stderr } = await exec('git diff --staged --minimal', { cwd: cwd.fsPath });
        return { stdout, stderr };
    }

    public async apiRequest() {

        const configuration = new Configuration({
            apiKey: this.apiKey,
        });

        // get extension config
        const config = vscode.workspace.getConfiguration('commit-ai');

        // get current working folder
        let cwd = vscode.Uri.parse('./');
        if (vscode.workspace.workspaceFolders) {
            cwd = vscode.workspace.workspaceFolders[0].uri;
        }

        if (this.apiKey.length <= 0) {
            throw new Error('Missing OpenAI api key!');
        }

        if (cwd.toString().length <= 0) {
            throw new Error('Invalid workspace directory!');
        }

        const { stdout, stderr } = await this.getDiff(cwd);

        if (stderr.length > 0) {
            throw new Error('Error during diff command execution');
        }

        if (stdout.length <= 0) {
            throw new Error('Diff output not available. Please add files to the stage.');
        }

        // checking if exceeding context length for AI model
        const encoded = encode(stdout);
        if (encoded.length < 4000) {

            // Display a message box to the user
            vscode.window.showInformationMessage('Getting data from API...');

            const openai = new OpenAIApi(configuration);
            const response = await openai.createChatCompletion({
                model: config.get('gptModel'),
                messages: [
                    {
                        "role": "user",
                        "content": config.get('commitMessagePrompt')
                    },
                    {
                        "role": "user",
                        "content": stdout
                    }
                ],
                temperature: config.get('temperature'),
                max_tokens: config.get('maxTokens'),
            });

            vscode.window.showInformationMessage('Data retrieved!');
            const suggestions = response.data.choices[0].message.content;

            this.setCommitSuggestion(suggestions);
            return;
        } else {
            throw new Error('Git diff too long... cannot make request to OpenAI Api');
        }
    }

    private async init() {

        if (!this.enabled) {
            await this.setApiKey();
            await this.initGitApi();
            this.repository = this.getCurrentRepository();
            this.enabled = true;
        }
    }

    private async initGitApi() {
        if (this.gitApi === undefined) {

            try {
                const extension = vscode.extensions.getExtension("vscode.git");
                let gitExtension = undefined;

                if (extension !== undefined && extension.isActive) {
                    gitExtension = extension.exports;
                } else {
                    gitExtension = await extension?.activate();
                }

                this.gitApi = gitExtension.getAPI(1);
            } catch (e) {
                throw new Error('Problem with git repo and/or with scm plugin');
            }
        }
        return;
    }

    private setCommitSuggestion(suggestion: string) {
        if (this.repository) {
            this.repository.inputBox.value = suggestion;
        }
    }

    private getCurrentRepository() {
        const repository = this.gitApi?.repositories[0];
        if (repository === undefined) {
            throw new Error('No repository found!');
        }
        return repository;
    }
}