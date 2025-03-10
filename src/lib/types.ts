/**
 * Represents a file shown on the Dashboard page.
 *
 * Stored in /users/{uid}/files/{fileID} in Firebase.
 */
export type UserFile = {
	id: string; // not stored in database; injected by client
	lastAccessTime: number;
	title: string;
	creationTime?: number;
	hidden?: boolean;
	version: number;
	language: string;

	// deprecated
	// lastPermission?: string;
	// lastDefaultPermission?: string;

	owner?: {
		name: string;
		id: string;
	}; // added in v2
};

export type Language = 'cpp' | 'java' | 'py';
export const LANGUAGES = {
	cpp: 'C++',
	java: 'Java',
	py: 'Python 3.12.3'
} as const;

/**
 * User data stored in /users/{uid}/data.
 */
export type UserData = {
	editorMode: 'normal' | 'vim';
	tabSize: 2 | 4 | 8;
	theme: 'light' | 'dark';
	defaultPermission: 'READ_WRITE' | 'READ' | 'PRIVATE';
	defaultLanguage: Language;
	inlayHints: 'on' | 'off';
	showHiddenFiles: 'yes' | 'no';
};

/**
 * Settings for a file that's being edited.
 */
export interface FileSettings {
	compilerOptions: { [key in Language]: string };
	defaultPermission: 'READ_WRITE' | 'READ' | 'PRIVATE';
	workspaceName: string | null;
	fileIOName: string | null; // if this has a value, it will put the input and output in a .in / .out file
	creationTime: string | null; // firebase timetsamp?
	language: Language;

	problem: ProblemData | null;
}

/**
 * Information for a file that's being edited.
 *
 * Stored in /files/{fileID} in Firebase (other than id, which is manually injected).
 */
export type FileData = {
	id: string;
	users: {
		[userID: string]: {
			name: string;
			permission: 'OWNER' | 'READ' | 'READ_WRITE' | 'PRIVATE' | null;
		};
	};
	settings: FileSettings;
};

/*
 * Judge types are taken from
 * https://github.com/cpinitiative/online-judge-rust
 */

export enum Verdict {
	Accepted = 'accepted',
	WrongAnswer = 'wrong_answer',
	TimeLimitExceeded = 'time_limit_exceeded',
	RuntimeError = 'runtime_error'
}

export interface ExecuteResponse {
	stdout: string;

	// Only if `file_io_name`.out exists.
	file_output: string | null;

	stderr: string;
	wall_time: string; // time format is 0:00.00
	memory_usage: string;

	// The underlying raw wait status. Note that this is different from an exit status.
	exit_code: number;
	exit_signal: string | null;
	verdict: Verdict;
}

export interface JudgeTestCaseResponse extends ExecuteResponse {
	test_case: number;
	total_test_cases: number;
}

export interface USACOJudgeSubmissionResult {
	test_cases: (JudgeTestCaseResponse | null)[];
	// undefined if pending
	verdict?: Verdict;
}

// Yikes, there must be a better way to do this
export function isExecuteResponse(
	result: ExecuteResponse | USACOJudgeSubmissionResult
): result is ExecuteResponse {
	return 'wall_time' in result;
}

export interface CommandOptions {
	stdin: string;
	timeout_ms: number;
}

export interface CommandOutput {
	stdout: string;
	stderr: string;
	wall_time: string; // time format is 0:00.00
	memory_usage: string;

	// The underlying raw wait status. Note that this is different from an exit status.
	exit_code: number;
	exit_signal: string | null;
}

export interface JudgeResponse {
	compile: CommandOutput;

	// null if the program failed to compile
	execute: ExecuteResponse | null;
}

/* USACO Problem Data */
export type ProblemData = {
	id: number;
	submittable: boolean;
	url: string;
	source: string;
	title: string;
	input: string;
	output: string;
	samples: Sample[];
};

export interface Sample {
	input: string;
	output: string;
}

export interface TestCase {
	title: string;
	trialNum: string;
	symbol: string;
	memory: string;
	time: string;
}

export interface StatusData {
	statusText?: string;
	message?: string;
	statusCode: number;
	testCases?: TestCase[];
	output?: string;
}
