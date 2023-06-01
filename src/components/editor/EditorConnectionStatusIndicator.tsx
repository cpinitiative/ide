// Note: yjs sync is kind of weird.
// isSynced = false means the file is still loading for the first time
// afterwards, even if there are pending changes, synced will
// always be true...

// future todo: somehow communicate ^ to the user?
// can probably listen to doc transactions to learn about this

export default function EditorConnectionStatusIndicator({
  connectionStatus,
  isSynced,
}: {
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  isSynced: boolean;
}) {
  let connectionText;
  let statusIndicatorClass;

  // for now, our editors are either connecting or connected.
  if (connectionStatus === 'connected' && isSynced) {
    connectionText = 'Connected';
    statusIndicatorClass = 'bg-green-500';
  } else {
    connectionText = 'Connecting...';
    statusIndicatorClass = 'bg-yellow-500';
  }

  return (
    <div className="absolute z-10 bg-black rounded-md py-1.5 px-2 right-[1.25rem] top-[0.25rem] flex items-center opacity-80 hover:opacity-0 transition">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full mr-1 ${statusIndicatorClass}`}
      ></span>
      <span className="text-xs">{connectionText}</span>
    </div>
  );
}
