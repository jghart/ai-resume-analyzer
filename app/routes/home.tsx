import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import ResumeCard, { ResumeCardSkeleton } from "../components/ResumeCard";
import KanbanBoard from "../components/KanbanBoard";
import { usePuterStore } from "~/lib/puter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job" },
  ];
}

type ViewMode = "grid" | "kanban";

export default function Home() {
  const { auth, kv, puterReady, init } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    if (!puterReady) init();
  }, [puterReady, init]);

  useEffect(() => {
    if (!auth.isAuthenticated) navigate("/auth?next=/");
  }, [auth.isAuthenticated]);

  useEffect(() => {
    const fetchResumes = async () => {
      if (!auth.isAuthenticated || !puterReady) return;

      try {
        const keys = await kv.list("resume:*");
        if (!keys || keys.length === 0) {
          setResumes([]);
          setLoading(false);
          return;
        }

        const results = await Promise.all(
          (keys as string[]).map(async (key) => {
            const json = await kv.get(key);
            if (!json) return null;
            try {
              return JSON.parse(json) as Resume;
            } catch {
              return null;
            }
          })
        );

        const valid = results
          .filter((r): r is Resume => r !== null && r.status === "analyzed")
          .sort(
            (a, b) =>
              new Date(b.createdAt ?? 0).getTime() -
              new Date(a.createdAt ?? 0).getTime()
          );

        setResumes(valid);
      } catch (err) {
        console.error("Failed to fetch resumes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, [auth.isAuthenticated, puterReady, kv]);

  const handleDelete = (id: string) => {
    setResumes((prev) => prev.filter((r) => r.id !== id));
  };

  // Called when a card is dragged to a new Kanban column
  const handleStageChange = async (id: string, stage: KanbanStage) => {
    // Optimistically update UI first
    setResumes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, stage } : r))
    );

    // Persist the new stage to KV
    try {
      const json = await kv.get(`resume:${id}`);
      if (json) {
        const updated = { ...JSON.parse(json), stage };
        await kv.set(`resume:${id}`, JSON.stringify(updated));
        toast.success(`Moved to ${stage.charAt(0).toUpperCase() + stage.slice(1)}`);
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
      toast.error("Failed to update stage");
      // Revert optimistic update on failure
      setResumes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, stage: r.stage } : r))
      );
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track your applications & Resume Ratings</h1>
          <h2>Review your submissions and check AI-powered feedback.</h2>
        </div>

        {/* View toggle — only show when there are resumes */}
        {!loading && resumes.length > 0 && (
          <div className="flex justify-end mb-6 px-4">
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                  ${viewMode === "grid"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Grid
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                  ${viewMode === "kanban"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
                Kanban
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="resumes-section">
            {[...Array(4)].map((_, i) => (
              <ResumeCardSkeleton key={i} />
            ))}
          </div>
        ) : resumes.length > 0 ? (
          viewMode === "grid" ? (
            <div className="resumes-section">
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <KanbanBoard
              resumes={resumes}
              onStageChange={handleStageChange}
              onDelete={handleDelete}
            />
          )
        ) : (
          <div className="flex flex-col items-center py-20 gap-4">
            <img
              src="/images/resume-scan-2.gif"
              alt="No resumes"
              className="w-48 opacity-60"
            />
            <p className="text-xl text-gray-500">No resumes analyzed yet.</p>
            <button
              onClick={() => navigate("/upload")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Analyze your first resume
            </button>
          </div>
        )}
      </section>
    </main>
  );
}