import classNames from 'classnames';
import firebase from 'firebase/app';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import Split from 'react-split-grid';
import invariant from 'tiny-invariant';
import { firebaseUserAtom } from '../../src/atoms/firebaseUserAtoms';
import { layoutEditorsAtom } from '../../src/atoms/workspace';
import ClassroomUserList from '../../src/components/classrooms/ClassroomUserList/ClassroomUserList';
import ClassroomUserListItem from '../../src/components/classrooms/ClassroomUserList/ClassroomUserListItem';
import { MessagePage } from '../../src/components/MessagePage';
import useFirebaseRefValue from '../../src/hooks/useFirebaseRefValue';

export interface ClassroomStudent {
  color: string;
  studentID: string;
  studentFileID: string;
  name: string;
  connections: { [key: string]: number };
}

export interface ClassroomInfo {
  students?: {
    [userID: string]: ClassroomStudent;
  };
  users: {
    [userID: string]: {
      name: string;
      color: string;
      permission: 'OWNER' | 'READ_WRITE' | 'READ';
    };
  };
  settings: {
    workspaceName: string;
    defaultPermission: 'PRIVATE' | 'READ_WRITE' | 'READ';
    creationTime: typeof firebase.database.ServerValue.TIMESTAMP;
  };
}

export default function ClassroomPage() {
  const router = useRouter();
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const classroomID = router.query.id;
  const classroomRef = useMemo(() => {
    if (!classroomID) return undefined;
    invariant(
      typeof classroomID === 'string',
      'expceted classroom ID to be a string'
    );
    return firebase
      .database()
      .ref()
      .child('classrooms')
      .child('-' + classroomID);
  }, [classroomID]);
  const classroomDataListener = useFirebaseRefValue<ClassroomInfo>(
    classroomRef
  );

  const layoutEditors = useUpdateAtom(layoutEditorsAtom);

  if (classroomDataListener.isLoading || !firebaseUser) {
    return <MessagePage message="Loading..." showHomeButton={false} />;
  }
  if (!classroomDataListener.value) {
    return <MessagePage message="Classroom not found" />;
  }
  const classroomInfo: ClassroomInfo = classroomDataListener.value;
  if (classroomInfo.users[firebaseUser.uid]?.permission !== 'OWNER') {
    return (
      <MessagePage message="You must be the owner of the classroom to access this page" />
    );
  }

  return (
    <Split
      onDragEnd={() => layoutEditors()}
      render={({ getGridProps, getGutterProps }) => (
        <div
          className={`grid grid-cols-[300px,3px,1fr,3px,300px] grid-rows-[1fr] h-full overflow-hidden`}
          {...getGridProps()}
        >
          <div>
            <h3 className="text-white font-medium text-lg p-4">
              {classroomInfo.settings.workspaceName}
            </h3>
            <div>Join Link: /c/{classroomID}</div>
            <ClassroomUserList>
              <ClassroomUserListItem
                user={{
                  studentID: firebaseUser.uid,
                  studentFileID: '',
                  ...classroomInfo.users[firebaseUser.uid],
                  connections: { 'instructor is always online': 1234 },
                }}
                isInstructor={true}
              />
              {Object.values(classroomInfo.students || {}).map(student => (
                <ClassroomUserListItem
                  user={student}
                  isInstructor={false}
                  key={student.studentID}
                />
              ))}
            </ClassroomUserList>
          </div>
          <div
            className={classNames(
              'col-start-2 cursor-[col-resize] mx-[-6px] group relative z-10'
            )}
            {...getGutterProps('column', 1)}
          >
            <div className="absolute h-full left-[6px] right-[6px] bg-black group-hover:bg-gray-600 group-active:bg-gray-600 pointer-events-none transition" />
          </div>
          <div>Code Interface</div>
          <div
            className={classNames(
              'col-start-4 cursor-[col-resize] mx-[-6px] group relative z-10'
            )}
            {...getGutterProps('column', 3)}
          >
            <div className="absolute h-full left-[6px] right-[6px] bg-black group-hover:bg-gray-600 group-active:bg-gray-600 pointer-events-none transition" />
          </div>
          <div>Chat</div>
        </div>
      )}
    />
    // <div>
    //   <div>Classroom Info</div>
    //   <div>Main Code Editor</div>
    //   <div>Chat Interface</div>
    // </div>
  );
}
