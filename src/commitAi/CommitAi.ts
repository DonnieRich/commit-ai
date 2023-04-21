/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { API as GitApi, Repository } from '../@types/git';
import { ApiService } from '../services/ApiService';

export class CommitAi {

    constructor(
        private context: vscode.ExtensionContext,
        private enabled: Boolean = false,
        private apiService?: ApiService,
    ) { }

    public async writeApiKey() {
        await this.apiService?.writeApiKey();
    }

    public async clearApiKey() {
        await this.apiService?.clearApiKey();
    }

    public async apiRequest() {

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'API Request...',
            cancellable: true
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                console.log('User canceled the API request');
            });

            progress.report({ message: 'Getting data from API...' });

            await this.apiService?.apiRequest();
        });
    }

    public disable() {
        this.enabled = false;
    }

    public async init() {

        if (!this.enabled) {

            this.apiService = new ApiService(this.context);
            await this.apiService.init();

            this.enabled = true;
        }
    }

}