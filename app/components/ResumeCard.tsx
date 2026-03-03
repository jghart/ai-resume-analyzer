import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import ScoreCircle from '../components/ScoreCircle';
import { usePuterStore } from '~/lib/puter';

interface ResumeCardProps {
  resume: Resume;
  onDelete: (id: string) => void;
}

// Skeleton placeholder shown while the thumbnail is loading
export const ResumeCardSkeleton = () => (
  <div className="resume-card animate-pulse">
    <div className="resume-card-header">
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="w-[100px] h-[100px] rounded-full bg-gray-200 flex-shrink-0" />
    </div>
    <div className="gradient-border">
      <div className="w-full h-[350px] max-sm:h-[200px] bg-gray-200 rounded-lg" />
    </div>
  </div>
);

const ResumeCard = ({
  resume: { id, companyName, jobTitle, feedback, imagePath, resumePath },
  onDelete,
}: ResumeCardProps) => {
  const { fs, kv } = usePuterStore();
  const [imgSrc, setImgSrc] = useState('/images/pdf.png');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!imagePath) return;

    let objectUrl: string | null = null;

    const loadImage = async () => {
      try {
        const blob = await fs.read(imagePath);
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setImgSrc(objectUrl);
        }
      } catch {
        // Non-fatal — fallback stays as pdf.png
      }
    };

    loadImage();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imagePath, fs]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Delete the resume for "${jobTitle}" at "${companyName}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);

    const deleteToast = toast.loading('Deleting resume...');

    try {
      if (resumePath) {
        await fs.delete(resumePath).catch((err) =>
          console.warn('Could not delete PDF file:', err)
        );
      }

      if (imagePath) {
        await fs.delete(imagePath).catch((err) =>
          console.warn('Could not delete thumbnail:', err)
        );
      }

      await kv.del(`resume:${id}`);

      toast.success('Resume deleted successfully', { id: deleteToast });
      onDelete(id);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete resume. Please try again.', {
        id: deleteToast,
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative group">
      {/* Delete button — appears on card hover */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        title="Delete resume"
        className="absolute top-3 right-3 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-sm
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? (
          <svg className="w-4 h-4 text-red-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <img src="/icons/cross.svg" alt="delete" className="w-4 h-4" />
        )}
      </button>

      <Link
        to={`/resumes/${id}`}
        className="resume-card animate-in fade-in duration-1000"
      >
        <div className="resume-card-header">
          <div className="flex flex-col gap-2">
            <h2 className="!text-black font-bold break-words">{companyName}</h2>
            <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>
          </div>
          <div className="flex-shrink-0">
            <ScoreCircle score={feedback.overallScore} />
          </div>
        </div>
        <div className="gradient-border animate-in fade-in duration-1000">
          <div className="w-full h-full">
            <img
              src={imgSrc}
              alt="resume preview"
              className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
            />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ResumeCard;