import type { FileData } from './types';

/**
 * Checks whether the given string is a valid Firebase ID.
 *
 * The string must begin with a dash.
 *
 * @param str The string to check
 * @returns true if the string is a valid Firebase ID
 */
export function isFirebaseId(str: string): boolean {
	return /^-(?!\.\.?$)(?!.*__.*__)([^/]{1,1500})$/.test(str) && str.length === 20;
}

export function computePermission(
	fileData: FileData,
	userId: string | undefined
): 'OWNER' | 'READ' | 'READ_WRITE' | 'PRIVATE' {
	if (!userId) {
		return fileData.settings.defaultPermission;
	}
	return fileData.users[userId]?.permission ?? fileData.settings.defaultPermission;
}
