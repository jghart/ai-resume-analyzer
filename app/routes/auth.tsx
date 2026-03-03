import { usePuterStore } from "~/lib/puter";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

export const meta = () => [
  { title: "Resumind | Sign In" },
  { name: "description", content: "Sign in to analyze your resume with AI" },
];

const Auth = () => {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Safely extract ?next= param, default to home if missing
  const params = new URLSearchParams(location.search);
  const next = params.get("next") || "/";

  useEffect(() => {
    if (auth.isAuthenticated) navigate(next);
  }, [auth.isAuthenticated, next]);

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center px-4">
      <div className="gradient-border shadow-lg w-full max-w-md">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">

          {/* Logo / branding */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h1>Welcome to Resumind</h1>
            <h2>AI-powered resume feedback for your dream job</h2>
          </div>

          {/* What is Puter explanation */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 text-center leading-relaxed">
            Resumind uses{" "}
            <a
              href="https://puter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 hover:text-blue-600"
            >
              Puter
            </a>{" "}
            to securely store your resumes and run AI analysis.
            Your data lives in <span className="font-semibold">your own free Puter account</span> — not shared with anyone.
          </div>

          {/* Auth button */}
          <div className="flex flex-col gap-3">
            {isLoading ? (
              <button className="auth-button animate-pulse" disabled>
                <p>Signing you in...</p>
              </button>
            ) : auth.isAuthenticated ? (
              <>
                <p className="text-center text-sm text-gray-500">
                  Signed in as{" "}
                  <span className="font-semibold text-gray-700">
                    {auth.getUser()?.username}
                  </span>
                </p>
                <button className="auth-button" onClick={auth.signOut}>
                  <p>Sign Out</p>
                </button>
              </>
            ) : (
              <button className="auth-button" onClick={auth.signIn}>
                <p>Sign in with Puter</p>
              </button>
            )}
          </div>

          {/* New user hint */}
          {!auth.isAuthenticated && !isLoading && (
            <p className="text-center text-xs text-gray-400">
              Don't have a Puter account?{" "}
              <a
                href="https://puter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                It's free — sign up in seconds
              </a>
            </p>
          )}

        </section>
      </div>
    </main>
  );
};

export default Auth;