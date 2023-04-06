"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiViewProvider = void 0;
const vscode = require("vscode");
const OpenAi_1 = require("../openAi/OpenAi");
class OpenAiViewProvider {
    constructor(_extensionUri, _context) {
        this._extensionUri = _extensionUri;
        this._context = _context;
        this._openAi = new OpenAi_1.OpenAi(_context);
    }
    async resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };
        webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (data) => {
            console.log(data);
            switch (data.type) {
                case 'requestCommitSuggestions':
                    {
                        //vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`${data.value}`));
                        await this.getCommitSuggestions();
                        break;
                    }
                case 'setupApiKey':
                    {
                        this._openAi.setApiKey();
                        break;
                    }
                case 'commitSuggestionSelected':
                    {
                        vscode.scm.createSourceControl('commitSuggestionSelected', 'Commit Suggestion').inputBox.value = "CIAO";
                    }
            }
        });
    }
    async getCommitSuggestions() {
        if (this._view) {
            this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
            this._openAi.apiRequest().then(data => {
                const suggestions = data;
                this._view?.webview.postMessage({ type: 'writeCommitSuggestions', value: suggestions });
            });
        }
    }
    clearCommitSuggestions() {
        if (this._view) {
            this._view.webview.postMessage({ type: 'clearCommitSuggestions', value: [] });
        }
    }
    async _getHtmlForWebview(webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        // Do the same for the stylesheet.
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();
        // check for Api key
        const isApiKeySet = this._context.workspaceState.get('isOpenAiApiKeySet', false);
        let webviewContent = `
            <ul class="suggestions-list">
            </ul>

            <button class="request-suggestions-button">Request suggestions</button>

            <script nonce="${nonce}" src="${scriptUri}"></script>
        `;
        if (!isApiKeySet) {
            webviewContent = this._getApiRequestButton();
        }
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Commit Suggestions</title>
			</head>
			<body>
                ${webviewContent}
			</body>
			</html>`;
    }
    _getApiRequestButton() {
        return `
            <h3 class="set-api-button">Set API key</h3>
            <p>Pleas set-up the API key using this button or the command from the command palette</p>
            <button class="setup-api-key">Add API key</button>
        `;
    }
}
exports.OpenAiViewProvider = OpenAiViewProvider;
OpenAiViewProvider.viewType = 'commit-ai.commitSuggestionsView';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=OpenAiViewProvider.js.map