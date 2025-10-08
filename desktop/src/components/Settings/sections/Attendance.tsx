import type { AttendanceGroup } from '../../../types/recognition';

interface AttendanceProps {
  attendanceGroup: AttendanceGroup;
  onUpdate: (key: string, value: string | number) => void;
}

export function Attendance({ attendanceGroup, onUpdate }: AttendanceProps) {
  return (
    <div className="space-y-4 px-1">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/60 text-sm">Start Time</span>
          <span className="text-white font-mono text-sm">{attendanceGroup.settings?.class_start_time ?? '08:00'}</span>
        </div>
        <input
          type="time"
          value={attendanceGroup.settings?.class_start_time ?? '08:00'}
          onChange={(e) => onUpdate('class_start_time', e.target.value)}
          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500/60"
        />
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/60 text-sm">Late Threshold</span>
          <span className="text-white font-medium text-sm">{attendanceGroup.settings?.late_threshold_minutes ?? 15}min</span>
        </div>
        <input
          type="range"
          min="5"
          max="60"
          step="5"
          value={attendanceGroup.settings?.late_threshold_minutes ?? 15}
          onChange={(e) => onUpdate('late_threshold_minutes', parseInt(e.target.value))}
          className="w-full accent-amber-500"
        />
      </div>
    </div>
  );
}

