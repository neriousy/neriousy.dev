'use client';



type ControlMode = 'follow' | 'sleep' | 'stop';

interface Props {
  currentMode: ControlMode;
  onModeChange: (mode: ControlMode) => void;
}

export default function CatControls({ currentMode, onModeChange }: Props) {
  const buttons = [
    { mode: 'follow' as ControlMode, label: 'FOLLOW' },
    { mode: 'sleep' as ControlMode, label: 'SLEEP' },
    { mode: 'stop' as ControlMode, label: 'STOP' },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="flex gap-2">
        {buttons.map((button) => (
          <button
            key={button.mode}
            onClick={() => onModeChange(button.mode)}
            className={`px-4 py-2 font-mono text-sm font-bold border-2 transition-colors duration-200 ${
              currentMode === button.mode
                ? 'bg-white text-black border-white'
                : 'bg-black text-white border-white hover:bg-white hover:text-black'
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}