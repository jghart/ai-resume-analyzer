import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import ScoreCircle from '../components/ScoreCircle';
import { usePuterStore } from '~/lib/puter';

const ResumeCard = ({
  resume: { id, companyName, jobTitle, feedback, imagePath },
}: {
  resume: Resume;
}) => {
  const { fs } = usePuterStore();
  const [imgSrc, setImgSrc] = useState('/images/pdf.png');

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

  return (
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
  );
};

export default ResumeCard;