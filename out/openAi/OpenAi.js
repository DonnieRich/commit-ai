"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAi = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const { encode } = require('gpt-3-encoder');
const { Configuration, OpenAIApi } = require('openai');
class OpenAi {
    constructor(context) {
        this.context = context;
    }
    async checkApiKey() {
        let apiKey = await this.context.secrets.get('openai-api-key') || "";
        if (apiKey.length <= 0) {
            //vscode.commands.executeCommand('setContext', 'commit-ai.isOpenAiApiKeySet', false);
            this.context.workspaceState.update('isOpenAiApiKeySet', undefined);
        }
        else {
            //vscode.commands.executeCommand('setContext', 'commit-ai.isOpenAiApiKeySet', true);
            this.context.workspaceState.update('isOpenAiApiKeySet', true);
        }
    }
    async setApiKey() {
        const apiKey = await vscode.window.showInputBox({
            prompt: "Please insert API Key",
            title: "API Key"
        });
        await this.context.secrets.store('openai-api-key', apiKey || "");
        vscode.commands.executeCommand('setContext', 'commit-ai.isOpenAiApiKeySet', true);
        // Display a message box to the user
        vscode.window.showInformationMessage('commit-ai API key set!');
    }
    async clearApiKey() {
        const resp = await vscode.window.showInformationMessage("Clear OpenAi Api key?", "Clear");
        if (resp === "Clear") {
            await this.context.secrets.store('openai-api-key', "");
            //vscode.commands.executeCommand('setContext', 'commit-ai.isOpenAiApiKeySet', false);
            this.context.workspaceState.update('isOpenAiApiKeySet', false);
            // Display a message box to the user
            vscode.window.showInformationMessage('commit-ai API key cleared!');
        }
    }
    async apiRequest() {
        let apiKey = await this.context.secrets.get('openai-api-key') || "";
        if (apiKey.length <= 0) {
            console.log('API Key undefined');
            // add error message
            return;
        }
        const configuration = new Configuration({
            apiKey: apiKey,
        });
        // get extension config
        const config = vscode.workspace.getConfiguration('commit-ai');
        const cwd = vscode.workspace.workspaceFolders[0].uri;
        if (cwd) {
            const { stdout, stderr } = await exec('git diff --staged --minimal', { cwd: cwd.fsPath });
            if (stderr.length > 0) {
                console.log(stderr);
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
                const suggestions = response.data.choices[0].message.content;
                return suggestions;
            }
            else {
                vscode.window.showInformationMessage('Git diff too long... cannot make request to OpenAI Api');
            }
        }
    }
}
exports.OpenAi = OpenAi;
//# sourceMappingURL=OpenAi.js.map