import React from 'react';
import { Link } from '@reach/router';

export type File = {
  id: string;
  lastAccessTime: number;
  title: string;
};

export interface FilesGridProps {
  files: File[];
}

export default function FilesGrid(props: FilesGridProps): JSX.Element {
  return (
    <div className="mt-4 -mx-2">
      {props.files.map(file => (
        <Link
          key={file.id}
          to={`/${file.id.substring(1)}`}
          className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg inline-block w-full max-w-sm m-2"
        >
          <div className="text-gray-200">
            {file.title || 'Unnamed File'} (
            {new Date(file.lastAccessTime).toString().substring(0, 24)})
          </div>
        </Link>
      ))}
    </div>
  );
}
