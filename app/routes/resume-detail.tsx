import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePuterStore } from '~/lib/puter';
import ScoreCircle from '~/components/ScoreCircle';

interface Tip {
  type: 'good' | 'improve';
  tip: string;
  explanation?: string;
}

interface FeedbackSection {
  score: number;
  tips: Tip[];
}

interface Feedback {
  overallScore: number;
  ATS: FeedbackSection;
  toneAndStyle: FeedbackSection;
  content: FeedbackSection;
  structure: FeedbackSection;
  skills: FeedbackSection;
}

interface ResumeData {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  resumePath: string;
  imagePath?: string;
  status: string;
  feedback: Feedback;
  createdAt: string;
  analyzedAt?: string;
}

const TipItem = ({ tip }: { tip: Tip }) => (
  <li className={`flex gap-3 p-3 rounded-lg ${tip.type === 'good' ? 'bg-green-50' : 'bg-amber-50'}`}>
    <span className="mt-0.5 text-lg">{tip.type === 'good' ? '✅' : '⚠️'}</span>
    <div>
      <p className={`font-medium text-sm ${tip.type === 'good' ? 'text-green-800' : 'text-amber-800'}`}>
        {tip.tip}
      </p>
      {tip.explanation && (
        <p className="text-sm text-gray-600 mt-1">{tip.explanation}</p>
      )}
    </div>
  </li>
);

const FeedbackSectionCard = ({
  title,
  section,
}: {
  title: string;
  section: FeedbackSection;
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <span
        className={`text-2xl font-bold ${
          section.score >= 75
            ? 'text-green-600'
            : section.score >= 50
            ? 'text-amber-500'
            : 'text-red-500'
        }`}
      >
        {section.score}
        <span className="text-sm font-normal text-gray-400">/100</span>
      </span>
    </div>
    <ul className="space-y-2">
      {section.tips?.map((tip, idx) => (
        <TipItem key={idx} tip={tip} />
      ))}
    </ul>
  </div>
);

const ResumeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { kv } = usePuterStore();
  const [data, setData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResume = async () => {
      if (!id) return;
      try {
        const json = await kv.get(`resume:${id}`);
        if (json) {
          setData(JSON.parse(json) as ResumeData);
        }
      } catch (err) {
        console.error('Failed to load resume:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, [id, kv]);

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-500 animate-pulse">Loading analysis...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-500">Resume analysis not found.</p>
      </div>
    );
  }

  const { feedback, status, jobTitle = 'Unknown Job', companyName = 'Unknown Company' } = data;

  return (
    <>
      {/* Print-only styles — hides nav buttons and background when printing */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          main { background: white !important; padding: 0 !important; }
        }
      `}</style>

      <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen py-12 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Top nav row: back button + export button */}
          <div className="no-print flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
            >
              <img src="/icons/back.svg" alt="back" className="w-4 h-4" />
              Back to resumes
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition text-sm"
            >
              Export as PDF
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold">
              Resume Analysis for{' '}
              <span className="text-blue-600">{jobTitle}</span>
              {' '}at{' '}
              <span className="text-blue-600">{companyName}</span>
            </h1>
            {data.analyzedAt && (
              <p className="text-sm text-gray-400 mt-2">
                Analyzed on {new Date(data.analyzedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {status !== 'analyzed' ? (
            <p className="text-center text-xl text-amber-600">
              Status: {status} — analysis may still be processing.
            </p>
          ) : (
            <div className="space-y-10">

              {/* Overall score */}
              <div className="flex justify-center">
                <ScoreCircle score={feedback.overallScore ?? 0} label="Overall Score" />
              </div>

              {/* Section scores row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                {(
                  [
                    { label: 'ATS', key: 'ATS' },
                    { label: 'Tone & Style', key: 'toneAndStyle' },
                    { label: 'Content', key: 'content' },
                    { label: 'Structure', key: 'structure' },
                    { label: 'Skills', key: 'skills' },
                  ] as { label: string; key: keyof Omit<Feedback, 'overallScore'> }[]
                ).map(({ label, key }) => (
                  <div key={key} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">{label}</p>
                    <p
                      className={`text-2xl font-bold ${
                        (feedback[key]?.score ?? 0) >= 75
                          ? 'text-green-600'
                          : (feedback[key]?.score ?? 0) >= 50
                          ? 'text-amber-500'
                          : 'text-red-500'
                      }`}
                    >
                      {feedback[key]?.score ?? '—'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Detailed section cards */}
              <div className="grid md:grid-cols-2 gap-6">
                <FeedbackSectionCard title="ATS Compatibility" section={feedback.ATS} />
                <FeedbackSectionCard title="Tone & Style" section={feedback.toneAndStyle} />
                <FeedbackSectionCard title="Content" section={feedback.content} />
                <FeedbackSectionCard title="Structure" section={feedback.structure} />
                <FeedbackSectionCard title="Skills" section={feedback.skills} />
              </div>

            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default ResumeDetail;