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
