import classNames from 'classnames';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import { useEffect } from 'react';
import Split from 'react-split-grid';
import invariant from 'tiny-invariant';
import { fileIdAtom } from '../../../src/atoms/firebaseAtoms';
import { firebaseUserAtom } from '../../../src/atoms/firebaseUserAtoms';
import { layoutEditorsAtom } from '../../../src/atoms/workspace';
import ClassroomCodeInterface from '../../../src/components/classrooms/ClassroomCodeInterface';
import ClassroomSidebar from '../../../src/components/classrooms/ClassroomLeftSidebar';
import ClassroomRightSidebar from '../../../src/components/classrooms/ClassroomRightSidebar';
import {
  ClassroomProvider,
  useClassroomContext,
} from '../../../src/context/ClassroomContext';

function Classroom() {
  const layoutEditors = useUpdateAtom(layoutEditorsAtom);
  const { classroomInfo, activeStudentID: studentID } = useClassroomContext();
  const setCodeInterfaceFileID = useUpdateAtom(fileIdAtom);

  useEffect(() => {
    const newFileID =
      studentID === 'instructor'
        ? classroomInfo.instructorFileID
        : classroomInfo.students?.[studentID].studentFileID;
    invariant(
      newFileID,
      "couldn't find the file ID associated with student " + studentID
    );
    setCodeInterfaceFileID({
      newId: newFileID,
    });
  }, [studentID]);

  return (
    <Split
      onDragEnd={() => layoutEditors()}
      render={({ getGridProps, getGutterProps }) => (
        <div
          className={`grid grid-cols-[300px,3px,1fr,3px,300px] grid-rows-[1fr] h-full overflow-hidden`}
          {...getGridProps()}
        >
          <div>
            <ClassroomSidebar />
          </div>
          <div
            className={classNames(
              'col-start-2 cursor-[col-resize] mx-[-6px] group relative z-10'
            )}
            {...getGutterProps('column', 1)}
          >
            <div className="absolute h-full left-[6px] right-[6px] bg-black group-hover:bg-gray-600 group-active:bg-gray-600 pointer-events-none transition" />
          </div>
          <div>
            <ClassroomCodeInterface />
          </div>
          <div
            className={classNames(
              'col-start-4 cursor-[col-resize] mx-[-6px] group relative z-10'
            )}
            {...getGutterProps('column', 3)}
          >
            <div className="absolute h-full left-[6px] right-[6px] bg-black group-hover:bg-gray-600 group-active:bg-gray-600 pointer-events-none transition" />
          </div>
          <div>
            <ClassroomRightSidebar />
          </div>
        </div>
      )}
    />
  );
}

export default function ClassroomPage() {
  return (
    <ClassroomProvider>
      <Classroom />
    </ClassroomProvider>
  );
}
