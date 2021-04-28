import classNames from 'classnames';
import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { useFirebaseRef, useUserRef } from '../hooks/useFirebaseRef';
import firebase from 'firebase/app';
import firebaseType from 'firebase';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { ChatMessageItem } from './ChatMessageItem';

export interface ChatMessage {
  timestamp: number;
  userId: string;
  message: string;
  key: string;
}

export const Chat = ({ className }: { className?: string }): JSX.Element => {
  const firebaseRef = useFirebaseRef();
  const userRef = useUserRef();
  const onlineUsers = useOnlineUsers();
  const [message, setMessage] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (message.trim() === '') return;

    if (!firebaseRef || !userRef) {
      alert('Firebase not loaded, please wait');
    } else {
      firebaseRef.child('chat').push({
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        userId: userRef.key,
        message: message.trim(),
      });
      setMessage('');
      chatInputRef.current?.focus();
    }
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[] | null>(null);

  useEffect(() => {
    if (firebaseRef) {
      const handleChange = (snap: firebaseType.database.DataSnapshot) => {
        setChatMessages(
          Object.keys(snap.val() || {}).map(key => ({
            key,
            ...snap.val()[key],
          }))
        );
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      };
      firebaseRef.child('chat').on('value', handleChange);
      return () => firebaseRef.child('chat').off('value', handleChange);
    }
  }, [firebaseRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      handleSubmit();
    }
  };

  return (
    <div className={classNames(className, 'flex flex-col')}>
      <div className="font-medium">Chat</div>
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
            <p className="text-gray-400">No chat messages.</p>
          ))}
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          className="mt-1 block w-full bg-[#1E1E1E] border-0 px-0 focus:ring-0 focus:placeholder-gray-400 text-sm"
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
    </div>
  );
};
