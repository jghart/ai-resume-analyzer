import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { usePuterStore } from "~/lib/puter";
import ScoreCircle from "./ScoreCircle";

const STAGES: { key: KanbanStage; label: string; color: string; bg: string }[] = [
  { key: "applied",   label: "Applied",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  { key: "interview", label: "Interview", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  { key: "offer",     label: "Offer",     color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  { key: "rejected",  label: "Rejected",  color: "text-red-700",    bg: "bg-red-50 border-red-200" },
];

interface KanbanBoardProps {
  resumes: Resume[];
  onStageChange: (id: string, stage: KanbanStage) => void;
  onDelete: (id: string) => void;
}

const KanbanCard = ({
  resume,
  onDelete,
  onDragStart,
}: {
  resume: Resume;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) => {
  const { fs, kv } = usePuterStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${resume.jobTitle}" at "${resume.companyName}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    const deleteToast = toast.loading("Deleting resume...");
    try {
      if (resume.resumePath) {
        await fs.delete(resume.resumePath).catch(() => {});
      }
      if (resume.imagePath) {
        await fs.delete(resume.imagePath).catch(() => {});
      }
      await kv.del(`resume:${resume.id}`);
      toast.success("Resume deleted", { id: deleteToast });
      onDelete(resume.id);
    } catch {
      toast.error("Failed to delete resume", { id: deleteToast });
      setIsDeleting(false);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, resume.id)}
      className="group relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm
                 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        title="Delete"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                   bg-white border border-gray-200 rounded-full p-1.5
                   hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
      >
        {isDeleting ? (
          <svg className="w-3 h-3 text-red-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <img src="/icons/cross.svg" alt="delete" className="w-3 h-3" />
        )}
      </button>

      <Link to={`/resumes/${resume.id}`} className="block">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{resume.companyName}</p>
            <p className="text-sm text-gray-500 truncate">{resume.jobTitle}</p>
          </div>
          <div className="flex-shrink-0 scale-75 origin-right">
            <ScoreCircle score={resume.feedback?.overallScore ?? 0} />
          </div>
        </div>
      </Link>
    </div>
  );
};

const KanbanColumn = ({
  stage,
  resumes,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  stage: typeof STAGES[number];
  resumes: Resume[];
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stage: KanbanStage) => void;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); onDragOver(e); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { setIsDragOver(false); onDrop(e, stage.key); }}
      className={`flex flex-col gap-3 min-h-[300px] rounded-2xl border-2 p-4 transition-colors
        ${stage.bg}
        ${isDragOver ? "border-dashed border-opacity-100 scale-[1.01]" : "border-transparent"}
      `}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className={`font-bold text-base ${stage.color}`}>{stage.label}</h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white border ${stage.color}`}>
          {resumes.length}
        </span>
      </div>

      {/* Cards */}
      {resumes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400 text-center">
            Drop a card here
          </p>
        </div>
      ) : (
        resumes.map((resume) => (
          <KanbanCard
            key={resume.id}
            resume={resume}
            onDelete={onDelete}
            onDragStart={onDragStart}
          />
        ))
      )}
    </div>
  );
};

const KanbanBoard = ({ resumes, onStageChange, onDelete }: KanbanBoardProps) => {
  const [dragId, setDragId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: KanbanStage) => {
    e.preventDefault();
    if (!dragId) return;

    const resume = resumes.find((r) => r.id === dragId);
    if (!resume || resume.stage === targetStage) {
      setDragId(null);
      return;
    }

    onStageChange(dragId, targetStage);
    setDragId(null);
  };

  const resumesByStage = (stage: KanbanStage) =>
    resumes.filter((r) => (r.stage ?? "applied") === stage);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      {STAGES.map((stage) => (
        <KanbanColumn
          key={stage.key}
          stage={stage}
          resumes={resumesByStage(stage.key)}
          onDelete={onDelete}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
};

export default KanbanBoard;