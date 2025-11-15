import './GitStatusIndicator.css';

interface GitStatusIndicatorProps {
  changedFilesCount: number;
}

const GitStatusIndicator = ({ changedFilesCount }: GitStatusIndicatorProps) => {
  const hasChanges = changedFilesCount > 0;

  return (
    <div className="git-status-indicator">
      <span className={hasChanges ? 'status-dot yellow' : 'status-dot green'}></span>
      {hasChanges && <span className="change-count">{changedFilesCount}</span>}
    </div>
  );
};

export default GitStatusIndicator;
