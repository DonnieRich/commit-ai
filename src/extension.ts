import * as vscode from 'vscode';
import { CommitAi } from './commitAi/CommitAi';
import { CommitAiViewProvider } from './viewProvider/CommitAiViewProvider';


export function activate(context: vscode.ExtensionContext) {

    const openAi = new CommitAi(context);
    openAi.checkApiKey();

    const provider = new CommitAiViewProvider(context.extensionUri, context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CommitAiViewProvider.viewType, provider));

    context.subscriptions.push(
        vscode.commands.registerCommand('commit-ai.setOpenAiApiKey', () => {
            openAi.setApiKey();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('commit-ai.clearOpenAiApiKey', () => {
            openAi.clearApiKey();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('commit-ai.getCommitSuggestions', async () => {
            await provider.getCommitSuggestions();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('commit-ai.clearCommitSuggestions', () => {
            provider.clearCommitSuggestions();
        }));

    /*context.subscriptions.push(
        vscode.commands.registerCommand('commit-ai.requestCommitMessages', () => {
            openAi.apiRequest();
        }));*/

    /*context.subscriptions.push(
        vscode.commands.registerCommand('calicoColors.addColor', () => {
            provider.addColor();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('calicoColors.clearColors', () => {
            provider.clearColors();
        }));*/
}