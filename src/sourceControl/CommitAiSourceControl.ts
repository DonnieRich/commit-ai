import * as vscode from 'vscode';

export class CommitAiSourceControl implements vscode.SourceControl {

    constructor(
        public readonly id: string,
        public readonly label: string,
        public readonly rootUri: vscode.Uri,
        public readonly inputBox: vscode.SourceControlInputBox
    ) { }

    createResourceGroup(id: string, label: string): vscode.SourceControlResourceGroup {
        throw new Error('Method not implemented.');
    }
    dispose(): void {
        throw new Error('Method not implemented.');
    }



}