import { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { StudyPhase } from '../types/result';

interface StudyPlanViewProps {
  studyPlan: StudyPhase[];
  totalEstimatedMinutes: number;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({
  studyPlan,
  totalEstimatedMinutes,
}) => {
  // Track completed task IDs
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});

  const allTasks = studyPlan.flatMap((p) => p.tasks);
  const totalTasks = allTasks.length;
  const completedCount = allTasks.filter((t) => completedTaskIds[t.id]).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const toggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const togglePhaseCollapse = (phaseId: string) => {
    setCollapsedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Header Overview Card */}
      <div
        style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Calendar size={20} style={{ color: 'var(--emerald-400)' }} />
              Milestone Study Roadmap & Schedule
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              Structured chronological learning phases with checkable action items.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={13} />
              Est. {totalEstimatedMinutes} mins
            </span>
            <span className="badge badge-slate">
              {completedCount}/{totalTasks} Tasks Done
            </span>
          </div>
        </div>

        {/* Overall Completion Progress */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-faint)', marginBottom: '0.35rem' }}>
            <span>Plan Progress</span>
            <span style={{ fontWeight: 600, color: 'var(--emerald-400)' }}>{progressPercent}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--emerald-500), var(--emerald-400))',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Phased Roadmap Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {studyPlan.map((phase, pIdx) => {
          const isCollapsed = Boolean(collapsedPhases[phase.id]);
          const phaseTasks = phase.tasks;
          const phaseCompletedCount = phaseTasks.filter((t) => completedTaskIds[t.id]).length;
          const isPhaseFullyDone = phaseTasks.length > 0 && phaseCompletedCount === phaseTasks.length;

          return (
            <div
              key={phase.id}
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)',
                border: `1px solid ${isPhaseFullyDone ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                overflow: 'hidden',
                transition: 'border-color 0.2s ease',
              }}
            >
              {/* Phase Header */}
              <div
                onClick={() => togglePhaseCollapse(phase.id)}
                style={{
                  padding: '1.25rem 1.5rem',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isPhaseFullyDone ? 'var(--emerald-600)' : 'var(--bg-card)',
                      border: `1px solid ${isPhaseFullyDone ? 'var(--emerald-500)' : 'var(--border-medium)'}`,
                      color: isPhaseFullyDone ? '#ffffff' : 'var(--emerald-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {isPhaseFullyDone ? '✓' : pIdx + 1}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {phase.phase}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', display: 'flex', gap: '0.6rem' }}>
                      <span>⏱ ~{phase.durationMinutes} mins</span>
                      <span>•</span>
                      <span>{phaseCompletedCount} of {phaseTasks.length} check items completed</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isPhaseFullyDone && (
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                      Phase Completed
                    </span>
                  )}
                  {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </div>
              </div>

              {/* Tasks List */}
              {!isCollapsed && (
                <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {phaseTasks.map((task) => {
                    const isDone = Boolean(completedTaskIds[task.id]);

                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.85rem',
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          background: isDone ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-input)',
                          border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ marginTop: '2px', color: isDone ? 'var(--emerald-400)' : 'var(--text-faint)' }}>
                          {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: '0.92rem',
                              fontWeight: 600,
                              color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                              textDecoration: isDone ? 'line-through' : 'none',
                            }}
                          >
                            {task.task}
                          </div>
                          {task.description && (
                            <div
                              style={{
                                fontSize: '0.82rem',
                                color: 'var(--text-faint)',
                                marginTop: '0.2rem',
                                lineHeight: '1.4',
                              }}
                            >
                              {task.description}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
