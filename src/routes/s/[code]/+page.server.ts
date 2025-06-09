// src/routes/s/[code]/+page.server.ts
import { redirect, error } from '@sveltejs/kit';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '$lib/firebase'; // Adjust import path
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const shortCode = params.code;
    
    try {
        const docRef = doc(db, 'shortUrls', shortCode);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Increment click counter
            await setDoc(docRef, {
                ...data,
                clicks: (data.clicks || 0) + 1,
                lastAccessed: new Date()
            });
            
            // Redirect to original URL
            throw redirect(302, data.originalUrl);
        } else {
            // Short URL not found
            throw error(404, 'Short URL not found');
        }
    } catch (e) {
        if (e && typeof e === 'object' && 'status' in e && e.status === 302) {
            throw e; // Re-throw redirect
        }
        console.error('Error resolving short URL:', e);
        throw error(500, 'Internal server error');
    }
};