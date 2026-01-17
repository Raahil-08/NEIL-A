interface DemoControlsProps {
  autoResponse: boolean;
  onAutoResponseToggle: () => void;
  onDemoAction: (action: string) => void;
  currentState: 'normal' | 'credential-stuffing' | 'data-exfiltration';
}

export function DemoControls({ autoResponse, onAutoResponseToggle, onDemoAction, currentState }: DemoControlsProps) {
  return (
    <section className="p-5 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
      <h2 className="text-sm font-medium text-neutral-300 mb-4 uppercase tracking-wide">
        Demo Controls
      </h2>

      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => onDemoAction('normal')}
          disabled={currentState === 'normal'}
          className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
            currentState === 'normal'
              ? 'bg-primary text-white border-primary'
              : 'bg-secondary text-white border-border hover:border-primary/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Normal Traffic
        </button>

        <button
          onClick={() => onDemoAction('credential-stuffing')}
          disabled={currentState === 'credential-stuffing'}
          className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
            currentState === 'credential-stuffing'
              ? 'bg-primary text-white border-primary'
              : 'bg-secondary text-white border-border hover:border-primary/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Credential Stuffing
        </button>

        <button
          onClick={() => onDemoAction('data-exfiltration')}
          disabled={currentState === 'data-exfiltration'}
          className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
            currentState === 'data-exfiltration'
              ? 'bg-primary text-white border-primary'
              : 'bg-secondary text-white border-border hover:border-primary/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Data Exfiltration
        </button>

        <button
          onClick={() => onDemoAction('reset')}
          className="px-4 py-2 text-sm font-medium rounded-md border bg-secondary text-white border-border hover:border-primary/50 transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-400 leading-none">Auto Response</span>
          <button
            type="button"
            aria-pressed={autoResponse}
            onClick={onAutoResponseToggle}
            className={`relative inline-flex items-center w-11 h-6 shrink-0 rounded-full border transition-colors ${
              autoResponse
                ? 'bg-neutral-500/30 border-neutral-400/50'
                : 'bg-neutral-600/20 border-neutral-500/30'
            }`}
          >
            <div
              className={`absolute left-0.5 w-5 h-5 rounded-full bg-neutral-400 transition-transform ${
                autoResponse ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium leading-none ${
              autoResponse ? 'text-white' : 'text-neutral-400'
            }`}
          >
            {autoResponse ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
    </section>
  );
}