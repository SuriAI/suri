interface ControlBarProps {
  cameraDevices: MediaDeviceInfo[];
  selectedCamera: string;
  setSelectedCamera: (deviceId: string) => void;
  isStreaming: boolean;
  startCamera: () => void;
  stopCamera: () => void;
}

export function ControlBar({
  cameraDevices,
  selectedCamera,
  setSelectedCamera,
  isStreaming,
  startCamera,
  stopCamera,
}: ControlBarProps) {
  return (
    <div>
      <div className="rounded-lg p-6 flex items-center justify-between min-h-[4rem]">
        <div className="flex items-center space-x-6">
          {/* Camera Selection */}
          {cameraDevices.length > 0 && (
            <div className="flex flex-col items-start space-y-1">
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                disabled={isStreaming || cameraDevices.length <= 1}
                className="bg-white/[0.05] text-white text-base border border-white/[0.1] rounded-lg px-4 py-3 focus:border-white/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] transition-all duration-300 ease-in-out hover:bg-white/[0.08]"
              >
                {cameraDevices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId} className="bg-black text-white">
                    {device.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-green-400' : 'bg-red-400'}`}></div>
          </div>
        </div>

        {/* Start/Stop Button */}
        <button
          onClick={isStreaming ? stopCamera : startCamera}
          className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 ease-in-out ${
            isStreaming ? 'btn-error' : 'btn-success'
          }`}
        >
          {isStreaming ? 'Stop Scan' : 'Start Scan'}
        </button>
      </div>
    </div>
  );
}

