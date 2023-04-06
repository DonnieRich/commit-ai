import * as vscode from 'vscode';

export class CommitAiSourceControlInputBox implements vscode.SourceControlInputBox {

    constructor(
        public readonly value: string,
        public readonly placeholder: string,
        public readonly enabled: boolean,
        public readonly visible: boolean
    ) { }
}