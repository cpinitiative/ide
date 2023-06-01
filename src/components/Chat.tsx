import classNames from 'classnames';
import React, { FormEvent, useLayoutEffect, useRef, useState } from 'react';
import firebase from 'firebase/app';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { ChatMessageItem } from './ChatMessageItem';
import useUserPermission from '../hooks/useUserPermission';
import { useEditorContext } from '../context/EditorContext';
import { useUserContext } from '../context/UserContext';

export interface ChatMessage {
  timestamp: number;
  userId: string;
  message: string;
  key: string;
}

export const Chat = ({ className }: { className?: string }): JSX.Element => {
  const onlineUsers = useOnlineUsers();
  const userPermission = useUserPermission();
  const chatRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState('');
  const { fileData } = useEditorContext();
  const { userData } = useUserContext();

  const chatMessages = Object.entries(fileData.chat || {}).map(
    ([key, message]) => ({
      key,
      ...message,
    })
  );

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (message.trim() === '') return;

    firebase.database().ref(`files/${fileData.id}`).child('chat').push({
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      userId: userData.id,
      message: message.trim(),
    });
    setMessage('');
    chatInputRef.current?.focus();
  };

  useLayoutEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={classNames(className, 'flex flex-col')}>
      <div className="font-medium text-white">Chat</div>
      <div
        className="flex-1 space-y-1 mt-1 min-h-0 overflow-y-auto"
        ref={chatRef}
      >
        {chatMessages &&
          (chatMessages.length > 0 ? (
            chatMessages.map(message => (
              <ChatMessageItem
                user={
                  onlineUsers?.find(user => user.id === message.userId) || null
                }
                chatMessage={message}
                key={message.key}
              />
            ))
          ) : (
            <p className="text-gray-400 text-sm">No chat messages.</p>
          ))}
      </div>
      {(userPermission === 'OWNER' || userPermission === 'READ_WRITE') && (
        <form onSubmit={handleSubmit}>
          <textarea
            className="text-white mt-1 block w-full bg-[#1E1E1E] border-0 px-0 focus:ring-0 focus:placeholder-gray-400 text-sm"
            placeholder="Send a message"
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={chatInputRef}
          />
          <button className="mt-1 block w-full py-2 text-sm uppercase font-bold text-indigo-300 hover:text-indigo-100 bg-indigo-900 bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-600">
            Send
          </button>
        </form>
      )}
    </div>
  );
};
