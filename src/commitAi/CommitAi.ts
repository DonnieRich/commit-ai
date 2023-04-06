/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const { encode } = require('gpt-3-encoder');
const { Configuration, OpenAIApi } = require('openai');

export class CommitAi {

    constructor(
        public context: vscode.ExtensionContext
    ) { }

    public async checkApiKey() {
        let apiKey = await this.context.secrets.get('openai-api-key') || "";

        if (apiKey.length <= 0) {
            //vscode.commands.executeCommand('setContext', 'commit-ai.isOpenAiApiKeySet', false);
            this.context.workspaceState.update('isOpenAiApiKeySet', undefined);
        } else {
            //vscode.commands.executeCommand('setContext', 'commit-ai.isOpenAiApiKeySet', true);
            this.context.workspaceState.update('isOpenAiApiKeySet', true);
        }
    }

    public async setApiKey() {
        const apiKey = await vscode.window.showInputBox({
            prompt: "Please insert API Key",
            title: "API Key"
        });
        await this.context.secrets.store('openai-api-key', apiKey || "");
        vscode.commands.executeCommand('setContext', 'commit-ai.isOpenAiApiKeySet', true);

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
            //vscode.commands.executeCommand('setContext', 'commit-ai.isOpenAiApiKeySet', false);
            this.context.workspaceState.update('isOpenAiApiKeySet', false);

            // Display a message box to the user
            vscode.window.showInformationMessage('commit-ai API key cleared!');
        }
    }

    public async apiRequest() {

        let apiKey = await this.context.secrets.get('openai-api-key') || "";

        if (apiKey.length <= 0) {
            console.log('API Key undefined');
            vscode.window.showErrorMessage('API Key undefined');
            return;
        }

        const configuration = new Configuration({
            apiKey: apiKey,
        });

        // get extension config
        const config = vscode.workspace.getConfiguration('commit-ai');
        let cwd = vscode.Uri.parse('./');
        if (vscode.workspace.workspaceFolders) {
            cwd = vscode.workspace.workspaceFolders[0].uri;
        }
        if (cwd) {
            const { stdout, stderr } = await exec('git diff --staged --minimal', { cwd: cwd.fsPath });

            if (stderr.length > 0) {
                console.log(stderr);
                vscode.window.showErrorMessage('Error during diff command execution');
                return;
            }

            if (stdout.length <= 0) {
                console.warn('Diff not available...');
                vscode.window.showErrorMessage('Diff output not available. Please add files to the stage.');
                return;
            }

            // console.log(stdout);


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

                // console.log(response);
                vscode.window.showInformationMessage('Data retrieved!');
                const suggestions = response.data.choices[0].message.content;
                return suggestions;
            } else {
                vscode.window.showErrorMessage('Git diff too long... cannot make request to OpenAI Api');
            }
        }
    }
}