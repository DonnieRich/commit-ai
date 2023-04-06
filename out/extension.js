"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const CommitAi_1 = require("./commitAi/CommitAi");
const CommitAiViewProvider_1 = require("./viewProvider/CommitAiViewProvider");
function activate(context) {
    const openAi = new CommitAi_1.CommitAi(context);
    openAi.checkApiKey();
    const provider = new CommitAiViewProvider_1.CommitAiViewProvider(context.extensionUri, context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(CommitAiViewProvider_1.CommitAiViewProvider.viewType, provider));
    context.subscriptions.push(vscode.commands.registerCommand('commit-ai.setOpenAiApiKey', () => {
        openAi.setApiKey();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('commit-ai.clearOpenAiApiKey', () => {
        openAi.clearApiKey();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('commit-ai.getCommitSuggestions', async () => {
        await provider.getCommitSuggestions();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('commit-ai.clearCommitSuggestions', () => {
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
exports.activate = activate;
//# sourceMappingURL=extension.js.map