export default {};
// import { useAtomValue } from 'jotai/utils';
// import invariant from 'tiny-invariant';
// import { firebaseUserAtom } from '../../atoms/firebaseUserAtoms';
// import { useClassroomContext } from '../../context/ClassroomContext';
// import ClassroomUserList from './ClassroomUserList/ClassroomUserList';
// import ClassroomUserListItem from './ClassroomUserList/ClassroomUserListItem';
// import JoinLink from './JoinLink';

// export default function ClassroomLeftSidebar() {
//   const firebaseUser = useAtomValue(firebaseUserAtom);
//   invariant(
//     firebaseUser,
//     'classroom sidebar should only be rendered after firebase user is loaded'
//   );
//   const { classroomInfo, classroomID } = useClassroomContext();

//   return (
//     <>
//       <h3 className="text-white font-medium text-lg p-4">
//         {classroomInfo.settings.workspaceName}
//       </h3>
//       <JoinLink link={`/c/${classroomID}`} />
//       <div className="h-4"></div>
//       <ClassroomUserList>
//         <ClassroomUserListItem
//           user={{
//             studentID: firebaseUser.uid,
//             studentFileID: '',
//             ...classroomInfo.users[firebaseUser.uid],
//             connections: { 'instructor is always online': 1234 },
//           }}
//           isInstructor={true}
//         />
//         {Object.values(classroomInfo.students || {}).map(student => (
//           <ClassroomUserListItem
//             user={student}
//             isInstructor={false}
//             key={student.studentID}
//           />
//         ))}
//       </ClassroomUserList>
//     </>
//   );
// }
