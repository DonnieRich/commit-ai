/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { GitService } from './GitService';
const { encode } = require('gpt-3-encoder');
const { Configuration, OpenAIApi } = require('openai');

export class ApiService {

    constructor(
        public context: vscode.ExtensionContext,
        private gitApi?: GitService,
        private apiKey: string = '',
    ) { }

    public async checkApiKey() {
        if (!this.context.workspaceState.get('isOpenAiApiKeySet', false) || this.apiKey.length <= 0) {
            await this.writeApiKey();
        }
    }

    public async setApiKey(apiKey: string = '') {
        if (this.apiKey.length <= 0) {
            if (apiKey.length <= 0) {
                apiKey = await this.readApiKey();
            }
            this.apiKey = apiKey;
        }
    }

    public async writeApiKey() {
        const apiKey = await vscode.window.showInputBox({
            prompt: "Please insert API Key",
            title: "API Key"
        });

        if (apiKey) {
            await this.context.secrets.store('openai-api-key', apiKey || "");
            vscode.commands.executeCommand('setContext', 'commit-ai.isOpenAiApiKeySet', true);
            this.context.workspaceState.update('isOpenAiApiKeySet', true);

            await this.setApiKey(apiKey);

            vscode.window.showInformationMessage('commit-ai API key set!');
        } else {
            vscode.window.showErrorMessage('commit-ai cannot set empty apikey!');
            throw new Error('commit-ai cannot set empty apikey!');
        }
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

    private checkConfiguration() {
        const config = vscode.workspace.getConfiguration('commit-ai');

        const modelsCompatibility = {
            'createChatCompletion': [
                'gpt-3.5-turbo', 'gpt-4', 'gpt-4-32k'
            ],
            'createCompletion': [
                'text-davinci-003', 'text-davinci-002', 'text-curie-001', 'text-babbage-001', 'text-ada-001'
            ]
        };

        const apiEndpoint: keyof typeof modelsCompatibility | undefined = config.get('gptApiEndpoint');
        const gptModel: string | undefined = config.get('gptModel');

        if (apiEndpoint && gptModel) {
            if (!modelsCompatibility[apiEndpoint].includes(gptModel)) {
                throw new Error(`API endpoint ${apiEndpoint} does not support the current selected model ${gptModel}`);
            }
        } else {
            vscode.window.showErrorMessage('commit-ai API endpoint or gptModel missing!');
            throw new Error(`commit-ai API endpoint or gptModel missing!`);
        }
    }

    public async apiRequest() {

        await this.checkApiKey();

        // get extension config
        const config = vscode.workspace.getConfiguration('commit-ai');

        if (this.apiKey.length <= 0) {
            vscode.window.showErrorMessage('commit-ai missing OpenAI api key!');
            throw new Error('commit-ai missing OpenAI api key!');
        }

        const { stdout, stderr } = await this.gitApi?.getDiff();

        if (stderr.length > 0) {
            vscode.window.showErrorMessage('commit-ai error during diff command execution');
            throw new Error('commit-ai error during diff command execution');
        }

        if (stdout.length <= 0) {
            vscode.window.showErrorMessage('commit-ai diff output not available. Please add files to the stage.');
            throw new Error('commit-ai diff output not available. Please add files to the stage.');
        }

        this.checkConfiguration();

        // checking if exceeding context length for AI model
        const encoded = encode(stdout);
        if (encoded.length < 4000) {

            const configuration = new Configuration({
                apiKey: this.apiKey,
            });

            const openai = new OpenAIApi(configuration);
            await this.routingRequest(openai, config, stdout);

        } else {
            vscode.window.showErrorMessage('commit-ai git diff too long. Cannot make request to OpenAI Api');
            throw new Error('commit-ai git diff too long. Cannot make request to OpenAI Api');
        }
    }

    private async routingRequest(openai: typeof OpenAIApi, config: vscode.WorkspaceConfiguration, diff: string) {

        const apiEndpoint = config.get('gptApiEndpoint');
        const model = config.get('gptModel') as string;
        const prompt = config.get('commitMessagePrompt') as string;
        const temperature = config.get('temperature') as number;
        const maxTokens = config.get('maxTokens') as number;

        let suggestion = '';

        switch (apiEndpoint) {
            case 'createChatCompletion':
                suggestion = await this.apiRequestChatCompletion(openai, model, prompt, diff, temperature, maxTokens);
                break;

            case 'createCompletion':
                suggestion = await this.apiRequestCompletion(openai, model, prompt, diff, temperature, maxTokens);
                break;
            default:
                break;
        }

        this.gitApi?.setCommitSuggestion(suggestion);
    }

    private async apiRequestChatCompletion(openai: typeof OpenAIApi, model: string, prompt: string, diff: string, temperature: number, maxTokens: number) {
        try {
            const response = await openai.createChatCompletion({
                model: model,
                messages: [
                    {
                        "role": "user",
                        "content": prompt
                    },
                    {
                        "role": "user",
                        "content": diff
                    }
                ],
                temperature: temperature,
                max_tokens: maxTokens,
            });

            return response.data.choices[0].message?.content || 'No suggestion available';
        } catch (error: unknown) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(error.message);
            }
        }
    }

    private async apiRequestCompletion(openai: typeof OpenAIApi, model: string, prompt: string, diff: string, temperature: number, maxTokens: number) {
        try {
            const response = await openai.createCompletion({
                model,
                prompt: `${prompt} ${diff}`,
                max_tokens: maxTokens,
                temperature: temperature,
            });

            return response.data.choices[0].text || 'No suggestion available';
        } catch (error: unknown) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(error.message);
            }
        }
    }

    public async init() {
        await this.checkApiKey();

        this.gitApi = new GitService();
        await this.gitApi?.init();

    }

    private async readApiKey() {
        const apiKey = await this.context.secrets.get('openai-api-key') || "";
        return apiKey;
    }

}