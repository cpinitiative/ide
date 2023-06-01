export default {};
// import { useMemo, useState } from 'react';
// import firebase from 'firebase/app';
// import useFirebaseRefValue from '../../hooks/useFirebaseRefValue';
// import { useSettings } from '../SettingsContext';
// import { ClassroomInfo } from '../../context/ClassroomContext';
// import { useRouter } from 'next/router';
// import { useUpdateAtom } from 'jotai/utils';
// import { fileIdAtom } from '../../atoms/firebaseAtoms';

// export default function ClassroomToolbar() {
//   const { settings } = useSettings();
//   const classroomRef = useMemo(() => {
//     if (!settings?.classroomID) return undefined;
//     return firebase.database().ref(`/classrooms/-${settings.classroomID}`);
//   }, [settings?.classroomID]);
//   const [isInstructorCode, setIsInstructorCode] = useState(false);
//   const router = useRouter();
//   const setFileID = useUpdateAtom(fileIdAtom);

//   const classroomData = useFirebaseRefValue<ClassroomInfo>(classroomRef).value;

//   const toggleCode = () => {
//     if (isInstructorCode) {
//       setFileID({
//         newId: router.query.id as string,
//       });
//     } else {
//       setFileID({
//         newId: classroomData!.instructorFileID,
//       });
//     }
//     setIsInstructorCode(!isInstructorCode);
//   };

//   if (!classroomData) {
//     return null;
//   }
//   return (
//     <div className="text-white border-t border-gray-700 px-1 text-sm">
//       <span className="mr-2 py-1">{classroomData.settings.workspaceName}</span>
//       <button
//         className="px-2 focus:outline-none hover:bg-gray-700 py-1"
//         onClick={toggleCode}
//       >
//         View {isInstructorCode ? 'Your' : 'Instructor'} Code
//       </button>
//     </div>
//   );
// }
