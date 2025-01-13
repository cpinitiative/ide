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
export const LANGUAGES: { label: string; value: Language }[] = [
	{
		label: 'C++',
		value: 'cpp'
	},
	{
		label: 'Java',
		value: 'java'
	},
	{
		label: 'Python 3.12.3',
		value: 'py'
	}
];

/**
 * User data stored in /users/{uid}/data.
 */
export type UserData = {
	editorMode: 'normal' | 'vim';
};

/**
 * Settings for a file that's being edited.
 */
export interface FileSettings {
	compilerOptions: { [key in Language]: string };
	defaultPermission: 'READ_WRITE' | 'READ' | 'PRIVATE';
	workspaceName: string | null;
	creationTime: string | null; // firebase timetsamp?

	// todo
	// problem: ProblemData | null;

	language: Language;
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
