import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import { CommitAi } from '../../commitAi/CommitAi';

suite('Extension Test Suite', async () => {
    vscode.window.showInformationMessage('Start all tests.');
    // const extension = vscode.extensions.getExtension('donnierich.commit-ai');
    // const extensionContext = await extension?.activate();

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });

    // test('Set API key', () => {
    //     const commitAi = new CommitAi(extensionContext);
    //     commitAi.setApiKey();
    // });
});
