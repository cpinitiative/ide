import type { Language } from '$lib/types';

const download = (filename: string, text: string): void => {
	const element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
};

export const downloadFile = (code: string, language: Language, workspaceName: string) => {
	let javaFilename = 'Main.java';
	const matches = Array.from(code.matchAll(/public\s+class\s+(\w+)/g));
	if (matches.length > 0) {
		javaFilename = matches[0][1] + '.java';
	}

	const fileNames = {
		cpp: `${workspaceName}.cpp`,
		java: javaFilename,
		py: `${workspaceName}.py`
	};

	download(fileNames[language], code);
};
