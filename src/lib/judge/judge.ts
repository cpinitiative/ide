import { PUBLIC_JUDGE_URL } from '$env/static/public';
import type { JudgeResponse, Language } from '$lib/types';

export const submitToJudge = async (
	language: Language,
	code: string,
	input: string,
	compilerOptions: string,
	fileIOName?: string
): Promise<JudgeResponse> => {
	const payload = {
		compile: {
			source_code: code,
			compiler_options: compilerOptions,
			language: language === 'java' ? 'java21' : language === 'py' ? 'py12' : 'cpp'
		},
		execute: {
			timeout_ms: 5000,
			stdin: input,
			file_io_name: fileIOName
		}
	};
	const resp = await fetch(PUBLIC_JUDGE_URL, {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify(payload)
	});
	if (!resp.ok) {
		const msg = await resp.text();
		throw new Error(msg);
	}
	return (await resp.json()) as JudgeResponse;
};
