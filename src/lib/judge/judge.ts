import { PUBLIC_JUDGE_URL } from '$env/static/public';
import type { JudgeResponse, Language } from '$lib/types';

export const submitToJudge = async (
	language: Language,
	code: string,
	input: string,
	compilerOptions: string,
	fileIOName: string | null
): Promise<JudgeResponse> => {
	const payload = {
		compile: {
			source_code: code,
			compiler_options: compilerOptions,
			language: language === 'java' ? 'java21' : language === 'py' ? 'py12' : 'cpp'
		},
		execute: {
			timeout_ms: 5000,
			stdin: input as string | null,
			stdin_id: null,
			file_io_name: fileIOName || ''
		}
	};
	if (JSON.stringify(payload).length > 5_500_000) {
		// AWS lambda has a 6MB request limit
		const resp = await fetch(`${PUBLIC_JUDGE_URL}/large-input`, {
			method: 'POST'
		});
		const { presigned_url, input_id } = await resp.json();
		await fetch(presigned_url, {
			method: 'PUT',
			body: input
		});
		payload.execute.stdin = null;
		payload.execute.stdin_id = input_id;
	}
	const resp = await fetch(`${PUBLIC_JUDGE_URL}/compile-and-execute`, {
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
	const result = (await resp.json()) as JudgeResponse;
	if (result.execute?.full_output_url) {
		const url = result.execute.full_output_url;
		const fullOutputResp = await fetch(url);
		result.execute = await fullOutputResp.json();
		result.execute!.full_output_url = url;
	}
	return result;
};
