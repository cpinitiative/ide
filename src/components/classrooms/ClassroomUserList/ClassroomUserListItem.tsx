export default {};
// import React from 'react';
// import Link from 'next/link';
// import {
//   ClassroomStudent,
//   useClassroomContext,
// } from '../../../context/ClassroomContext';

// const isUserOnline = (user: ClassroomStudent) => {
//   return Object.keys(user.connections || {}).length > 0;
// };

// const ClassroomUserListItem = ({
//   user,
//   isInstructor,
// }: {
//   user: ClassroomStudent;
//   isInstructor: boolean;
// }): JSX.Element | null => {
//   const { classroomID } = useClassroomContext();

//   return (
//     <li key={user.studentID}>
//       <Link
//         href={
//           isInstructor
//             ? `/classrooms/${classroomID}/instructor`
//             : `/classrooms/${classroomID}/${user.studentID}`
//         }
//       >
//         <a className="px-4 py-2 flex group hover:bg-gray-800">
//           <span className="relative h-5 w-5">
//             <span
//               className="inline-block h-5 w-5 rounded"
//               style={{ backgroundColor: user.color }}
//             />
//             <span className="absolute bottom-0 right-0 transform translate-y-1/3 translate-x-1/3 block rounded-full">
//               <span
//                 className={`block h-3 w-3 rounded-full ${
//                   isUserOnline(user) ? 'bg-green-400' : 'bg-gray-400'
//                 }`}
//               />
//             </span>
//           </span>
//           <div className="ml-3 flex-1">
//             <p
//               className={`text-sm font-medium ${
//                 isUserOnline(user) ? 'text-gray-300' : 'text-gray-400'
//               }`}
//             >
//               {user.name}
//               {isInstructor && ' (Instructor)'}
//             </p>
//           </div>
//         </a>
//       </Link>
//     </li>
//   );
// };

// export default ClassroomUserListItem;
