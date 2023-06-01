export default {};
// import { useAtomValue, useUpdateAtom } from 'jotai/utils';
// import { useEffect } from 'react';
// import { setFirebaseErrorAtom, userRefAtom } from '../atoms/firebaseAtoms';
// import type firebaseType from 'firebase';
// import { userPermissionAtom } from '../atoms/workspace';

// export default function useUpdateUserFilePermissions() {
//   const setUserPermission = useUpdateAtom(userPermissionAtom);
//   const setFirebaseError = useUpdateAtom(setFirebaseErrorAtom);
//   const potentiallyUnauthenticatedUserRef = useAtomValue(userRefAtom);
//   useEffect(() => {
//     if (potentiallyUnauthenticatedUserRef) {
//       const handleChange = (snap: firebaseType.database.DataSnapshot) => {
//         if (!snap.exists()) return;
//         const permission = snap.val().permission;
//         setUserPermission(permission);
//       };
//       potentiallyUnauthenticatedUserRef.on('value', handleChange, e => {
//         setFirebaseError(e);
//       });
//       return () => {
//         potentiallyUnauthenticatedUserRef.off('value', handleChange);
//       };
//     }
//   }, [potentiallyUnauthenticatedUserRef, setUserPermission, setFirebaseError]);
// }
