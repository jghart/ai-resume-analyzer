import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import ResumeCard, { ResumeCardSkeleton } from "../components/ResumeCard";
import { usePuterStore } from "~/lib/puter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job" },
  ];
}

export default function Home() {
  const { auth, kv, puterReady, init } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

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
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track your applications & Resume Ratings</h1>
          <h2>Review your submissions and check AI-powered feedback.</h2>
        </div>

        {loading ? (
          // Skeleton cards — same grid layout as real cards
          <div className="resumes-section">
            {[...Array(4)].map((_, i) => (
              <ResumeCardSkeleton key={i} />
            ))}
          </div>
        ) : resumes.length > 0 ? (
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