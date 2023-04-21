import * as vscode from 'vscode';
import { CommitAi } from './commitAi/CommitAi';


export async function activate(context: vscode.ExtensionContext) {

    const commitAi = new CommitAi(context);
    await commitAi.init();

    context.subscriptions.push(
        vscode.commands.registerCommand('commit-ai.setOpenAiApiKey', async () => {
            try {
                await commitAi.writeApiKey();
            } catch (error: unknown) {
                if (error instanceof Error) {
                    vscode.window.showErrorMessage(error.message);
                }
            }

        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('commit-ai.clearOpenAiApiKey', async () => {
            try {
                await commitAi.clearApiKey();
            } catch (error: unknown) {
                if (error instanceof Error) {
                    vscode.window.showErrorMessage(error.message);
                }
            }
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('commit-ai.requestCommitSuggestion', async () => {
            try {
                await commitAi.apiRequest();
            } catch (error: unknown) {
                if (error instanceof Error) {
                    vscode.window.showErrorMessage(error.message);
                }
            }
        }));
}