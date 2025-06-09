import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '$lib/firebase'; // Adjust import path as needed

/**
 * Generates a random uppercase alphanumeric string
 */
function generateShortCode(length: number = 6): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Creates a shortened URL using Firebase Firestore
 */
export async function shortenUrl(url: string): Promise<string> {
	// Check if URL is already shortened
	if (url.includes('/s/')) {
		return url;
	}

	let shortCode: string;
	let attempts = 0;
	const maxAttempts = 10;

	// Try to find an unused short code
	do {
		shortCode = generateShortCode();
		attempts++;
		
		if (attempts > maxAttempts) {
			throw new Error('Unable to generate unique short code');
		}

		// Check if this short code already exists
		const docRef = doc(db, 'shortUrls', shortCode);
		const docSnap = await getDoc(docRef);
		
		if (!docSnap.exists()) {
			// Short code is available, store the mapping
			await setDoc(docRef, {
				originalUrl: url,
				createdAt: new Date(),
				clicks: 0
			});
			break;
		}
	} while (true);

	// Return the shortened URL
	const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
	return `${baseUrl}/s/${shortCode}`;
}

/**
 * Resolves a short URL back to the original URL
 */
export async function resolveShortUrl(shortCode: string): Promise<string | null> {
	try {
		const docRef = doc(db, 'shortUrls', shortCode);
		const docSnap = await getDoc(docRef);
		
		if (docSnap.exists()) {
			const data = docSnap.data();
			
			// Optionally increment click counter
			await setDoc(docRef, {
				...data,
				clicks: (data.clicks || 0) + 1,
				lastAccessed: new Date()
			});
			
			return data.originalUrl;
		}
		
		return null;
	} catch (error) {
		console.error('Error resolving short URL:', error);
		return null;
	}
}