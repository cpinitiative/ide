/**
 * Represents a file shown on the Dashboard page.
 *
 * Stored in /users/{uid}/files in Firebase.
 */
export type UserFile = {
	id: string;
	lastAccessTime: number;
	title: string;
	creationTime?: number;
	lastPermission?: string;
	lastDefaultPermission?: string;
	hidden?: boolean;
	version: number;

	// deprecated
	// language: string;

	owner?: {
		name: string;
		id: string;
	}; // added in v2
};

export type Language = 'cpp' | 'java' | 'py';

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
	classroomID: string | null;
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
			color: string; // hex format
			permission: 'OWNER' | 'READ' | 'READ_WRITE' | 'PRIVATE' | null;
		};
	};
	settings: FileSettings;
};
