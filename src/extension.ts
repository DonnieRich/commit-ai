import * as vscode from 'vscode';
import { CommitAi } from './commitAi/CommitAi';


export async function activate(context: vscode.ExtensionContext) {

    try {
        const openAi = new CommitAi(context);
        await openAi.checkApiKey();

        context.subscriptions.push(
            vscode.commands.registerCommand('commit-ai.setOpenAiApiKey', async () => {
                await openAi.writeApiKey();
            }));

        context.subscriptions.push(
            vscode.commands.registerCommand('commit-ai.clearOpenAiApiKey', async () => {
                await openAi.clearApiKey();
            }));

        context.subscriptions.push(
            vscode.commands.registerCommand('commit-ai.requestCommitSuggestion', async () => {
                await openAi.checkApiKey();
                await openAi.apiRequest();
            }));
    } catch (error: unknown) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(error.message);
        }
    }

}