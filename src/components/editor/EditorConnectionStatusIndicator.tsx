export default function EditorConnectionStatusIndicator({
  connectionStatus,
  isSynced,
}: {
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  isSynced: boolean;
}) {
  let connectionText;
  if (connectionStatus === 'disconnected') connectionText = 'Disconnected';
  else if (connectionStatus === 'connecting') connectionText = 'Connecting...';
  else if (connectionStatus === 'connected') {
    if (isSynced) connectionText = 'Synced';
    else connectionText = 'Syncing...';
  } else
    connectionText = 'Error: Unknown Connection Status ' + connectionStatus;

  return (
    <div className="absolute z-10 bg-black rounded-md py-1.5 px-2 right-[1.25rem] top-[0.25rem] flex items-center opacity-80 hover:opacity-0 transition">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
      <span className="text-xs">{connectionText}</span>
    </div>
  );
}
