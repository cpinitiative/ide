export default {};
// import firebase from 'firebase/app';
// import { useAtomValue, useUpdateAtom } from 'jotai/utils';
// import { useRouter } from 'next/router';
// import { createContext, ReactNode, useContext, useMemo } from 'react';
// import invariant from 'tiny-invariant';
// import { firebaseUserAtom } from '../atoms/firebaseUserAtoms';
// import { layoutEditorsAtom } from '../atoms/workspace';
// import { MessagePage } from '../components/MessagePage';
// import useFirebaseRefValue from '../hooks/useFirebaseRefValue';

// export interface ClassroomStudent {
//   color: string;
//   studentID: string;
//   studentFileID: string;
//   name: string;
//   connections: { [key: string]: number };
// }

// export interface ClassroomInfo {
//   students?: {
//     [userID: string]: ClassroomStudent;
//   };
//   users: {
//     [userID: string]: {
//       name: string;
//       color: string;
//       permission: 'OWNER' | 'READ_WRITE' | 'READ';
//     };
//   };
//   settings: {
//     workspaceName: string;
//     defaultPermission: 'PRIVATE' | 'READ_WRITE' | 'READ';
//     creationTime: typeof firebase.database.ServerValue.TIMESTAMP;
//   };
//   instructorFileID: string;
// }

// const ClassroomContext = createContext<{
//   classroomID: string;
//   activeStudentID: string;
//   classroomInfo: ClassroomInfo;
// } | null>(null);

// export const ClassroomProvider = ({ children }: { children: ReactNode }) => {
//   const router = useRouter();
//   const firebaseUser = useAtomValue(firebaseUserAtom);
//   const classroomID = router.query.classroomID;
//   const fileID = router.query.fileID;

//   const classroomRef = useMemo(() => {
//     if (!classroomID) return undefined;
//     invariant(
//       typeof classroomID === 'string',
//       'expceted classroom ID to be a string'
//     );
//     return firebase
//       .database()
//       .ref()
//       .child('classrooms')
//       .child('-' + classroomID);
//   }, [classroomID]);
//   const classroomDataListener = useFirebaseRefValue<ClassroomInfo>(
//     classroomRef
//   );

//   const value = useMemo(() => {
//     return {
//       classroomID: classroomID,
//       activeStudentID: fileID,
//       classroomInfo: classroomDataListener.value,
//     };
//   }, [classroomID, fileID, classroomDataListener.value]);

//   if (classroomDataListener.isLoading || !firebaseUser || !router.isReady) {
//     return <MessagePage message="Loading..." showHomeButton={false} />;
//   }

//   if (!classroomDataListener.value) {
//     return <MessagePage message="Classroom not found" />;
//   }
//   const classroomInfo: ClassroomInfo = classroomDataListener.value;
//   if (classroomInfo.users[firebaseUser.uid]?.permission !== 'OWNER') {
//     return (
//       <MessagePage message="You must be the owner of the classroom to access this page" />
//     );
//   }

//   invariant(
//     typeof value.classroomID === 'string',
//     'expected classroom ID to be a string'
//   );
//   invariant(
//     typeof value.activeStudentID === 'string',
//     'expected file ID to be a string'
//   );
//   invariant(value.classroomInfo);

//   let value2: any = value; // dumb ts error?

//   return (
//     <ClassroomContext.Provider value={value2}>
//       {children}
//     </ClassroomContext.Provider>
//   );
// };

// export const useClassroomContext = (): {
//   classroomID: string;
//   activeStudentID: string;
//   classroomInfo: ClassroomInfo;
// } => {
//   const context = useContext(ClassroomContext);
//   invariant(
//     context,
//     'useClassroomContext() must be called within a classroom context'
//   );
//   return context;
// };
