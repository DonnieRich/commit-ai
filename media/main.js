//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    // @ts-ignore
    const vscode = acquireVsCodeApi();

    const oldState = vscode.getState() || { colors: [] };

    /** @type {Array<{ value: string }>} */
    let colors = oldState.colors;

    updateColorList(colors);

    document.querySelector('.request-suggestions-button')?.addEventListener('click', () => {
        requestCommitSuggestions();
    });

    document.querySelector('.setup-api-key')?.addEventListener('click', () => {
        setupApiKey();
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'writeCommitSuggestions':
                {
                    writeCommitSuggestions(message.value);
                    console.log("writeCommitSuggestions");
                    break;
                }
            case 'clearCommitSuggestions':
                {
                    colors = [];
                    /*updateColorList(colors);*/
                    clearCommitSuggestions(colors);
                    console.log("clearCommitSuggestions");
                    break;
                }

        }
    });

    /**
     * @param {Array<{ value: string }>} colors
     */
    function updateColorList(colors) {
        const ul = document.querySelector('.suggestions-list');
        if (ul) {
            ul.textContent = '';
            for (const color of colors) {
                const li = document.createElement('li');
                li.className = 'color-entry';

                const colorPreview = document.createElement('div');
                colorPreview.className = 'color-preview';
                // colorPreview.style.backgroundColor = `#${color.value}`;
                colorPreview.style.height = '50px';
                colorPreview.style.width = '50px';
                colorPreview.style.backgroundColor = 'white';
                colorPreview.addEventListener('click', () => {
                    onColorClicked(color.value);
                });
                li.appendChild(colorPreview);

                const input = document.createElement('input');
                input.className = 'color-input';
                input.type = 'text';
                input.value = color.value;
                input.addEventListener('change', (e) => {
                    // @ts-ignore
                    const value = e.target.value;
                    if (!value) {
                        // Treat empty value as delete
                        colors.splice(colors.indexOf(color), 1);
                    } else {
                        color.value = value;
                    }
                    updateColorList(colors);
                });
                li.appendChild(input);

                ul.appendChild(li);
            }

        }

        // Update the saved state
        vscode.setState({ colors: colors });
    }

    /** 
     * @param {string} color 
     */
    function onColorClicked(color) {
        vscode.postMessage({ type: 'commitSuggestionSelected', value: color });
    }

    /**
     * @returns string
     */
    function getNewCalicoColor() {
        const colors = ['020202', 'f1eeee', 'a85b20', 'daab70', 'efcb99'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function writeCommitSuggestions(suggestions) {
        //const color = { value: getNewCalicoColor() };
        //colors.push(color);
        const list = suggestions.split('\n').map((suggestion) => { return { value: suggestion }; });
        colors.push(...list);
        updateColorList(colors);
    }

    function clearCommitSuggestions(colors) {
        updateColorList(colors);
    }

    function setupApiKey() {
        vscode.postMessage({ type: 'setupApiKey' });
    }

    function requestCommitSuggestions() {
        vscode.postMessage({ type: 'requestCommitSuggestions' });
    }
}());

