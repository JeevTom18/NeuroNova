/** Top bar — page title, pipeline trigger controls, backend badge */
import PipelineControls from '../dashboard/PipelineControls';

const PAGE_TITLES = {
  dashboard: 'Overview',
  pipeline:  'Pipeline Runs',
  sources:   'Source Health',
  records:   'Record Explorer',
};

export default function Topbar({ activeTab, isRunning, status, onRun, simFailure, setSimFailure }) {
  return (
    <div className="topbar">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {PAGE_TITLES[activeTab] || 'Dashboard'}
        </h1>
        {isRunning && (
          <span className="stage-pill">
            <span className="spinner" style={{ width: 10, height: 10 }} />
            {status?.stage || 'Running'}
          </span>
        )}
      </div>
      <PipelineControls
        isRunning={isRunning}
        status={status}
        onRun={onRun}
        simFailure={simFailure}
        setSimFailure={setSimFailure}
      />
    </div>
  );
}
