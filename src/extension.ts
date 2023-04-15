import * as vscode from 'vscode';
import { CommitAi } from './commitAi/CommitAi';


export function activate(context: vscode.ExtensionContext) {

    const openAi = new CommitAi(context);
    openAi.checkApiKey();

    context.subscriptions.push(
        vscode.commands.registerCommand('commit-ai.setOpenAiApiKey', () => {
            openAi.setApiKey();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('commit-ai.clearOpenAiApiKey', () => {
            openAi.clearApiKey();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('commit-ai.requestCommitSuggestion', () => {
            openAi.apiRequest();
        }));

    return context;
}