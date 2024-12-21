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
