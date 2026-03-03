import { type FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FileUploader from '~/components/FileUploader';
import { usePuterStore } from '~/lib/puter';
import { AIResponseFormat, prepareInstructions } from '../../constants';
import { convertPdfToImage } from '~/lib/pdf2img';

const Upload = () => {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');

  const { fs, ai, kv, puterReady, init } = usePuterStore();

  useEffect(() => {
    if (!puterReady) init();
  }, [puterReady, init]);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert('Please upload a resume PDF first');
      return;
    }
    if (!companyName.trim() || !jobTitle.trim() || !jobDescription.trim()) {
      alert('Please fill in all job details');
      return;
    }

    setIsProcessing(true);
    setStatusText('Uploading resume...');

    try {
      // 1. Upload the PDF to Puter.fs
      const uploadResult = await fs.upload([file]);
      if (!uploadResult || !uploadResult.path) {
        throw new Error('File upload failed - no path returned');
      }
      const resumePath = uploadResult.path;
      console.log('Upload successful - path:', resumePath);

      const resumeId = crypto.randomUUID();

      // 2. Generate a thumbnail image from page 1 of the PDF
      setStatusText('Generating preview image...');
      let imagePath = '';
      try {
        const { file: imageFile, error } = await convertPdfToImage(file);
        if (imageFile && !error) {
          const imageUpload = await fs.upload([imageFile]);
          if (imageUpload?.path) {
            imagePath = imageUpload.path;
            console.log('Thumbnail uploaded to:', imagePath);
          }
        } else {
          console.warn('PDF thumbnail generation failed:', error);
        }
      } catch (imgErr) {
        // Non-fatal — we continue without a thumbnail
        console.warn('Thumbnail generation error (non-fatal):', imgErr);
      }

      // 3. Save initial metadata to KV
      const resumeData = {
        id: resumeId,
        companyName,
        jobTitle,
        jobDescription,
        resumePath,
        imagePath,
        status: 'analyzing',
        createdAt: new Date().toISOString(),
      };
      await kv.set(`resume:${resumeId}`, JSON.stringify(resumeData));
      console.log('Initial metadata saved to KV for ID:', resumeId);

      setStatusText('Analyzing resume with AI...');

      // 4. Build the prompt using the shared helper + response format from constants
      const analysisMessage = prepareInstructions({
        jobTitle,
        jobDescription,
        AIResponseFormat,
      });

      // 5. Call ai.feedback() — reads PDF from Puter.fs, sends as base64 document to Claude
      const aiResult = await ai.feedback(resumePath, analysisMessage);
      if (!aiResult) throw new Error('AI analysis returned no result');
      console.log('Raw AI result:', aiResult);

      // 6. Parse the response
      let feedbackData: Record<string, unknown> = {};
      try {
        let rawText = '';

        if (aiResult.message?.content) {
          if (typeof aiResult.message.content === 'string') {
            rawText = aiResult.message.content.trim();
          } else if (Array.isArray(aiResult.message.content)) {
            for (const block of aiResult.message.content) {
              if (block.type === 'text' && typeof block.text === 'string') {
                rawText += block.text;
              }
            }
            rawText = rawText.trim();
          }
        } else if (typeof aiResult.content === 'string') {
          rawText = aiResult.content.trim();
        } else if (Array.isArray(aiResult.content)) {
          for (const block of aiResult.content) {
            if (block.type === 'text' && typeof block.text === 'string') {
              rawText += block.text;
            }
          }
          rawText = rawText.trim();
        }

        if (!rawText) throw new Error('No extractable text content in AI response');

        // Strip markdown code fences if present
        const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) rawText = fenceMatch[1].trim();

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON object found in AI response');

        feedbackData = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed feedback:', feedbackData);
      } catch (parseErr) {
        console.error('JSON parse failed:', parseErr);
        feedbackData = {
          parseError: true,
          rawContent:
            typeof aiResult.message?.content === 'string'
              ? aiResult.message.content
              : JSON.stringify(aiResult),
        };
      }

      // 7. Save final results back to KV
      const updatedData = {
        ...resumeData,
        status: 'analyzed',
        feedback: feedbackData,
        analyzedAt: new Date().toISOString(),
      };
      await kv.set(`resume:${resumeId}`, JSON.stringify(updatedData));
      console.log('Final results saved to KV for ID:', resumeId);

      setStatusText('Analysis complete! Redirecting...');
      setTimeout(() => {
        setIsProcessing(false);
        navigate(`/resumes/${resumeId}`);
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      console.error('Full analysis error:', err);
      setStatusText(`Error: ${message}`);
      setTimeout(() => setIsProcessing(false), 5000);
      alert('Failed to analyze resume. Check console for details.');
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section max-w-4xl mx-auto px-4 py-12">
        <div className="page-heading text-center py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Smart feedback for your dream job
          </h1>

          {isProcessing ? (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-blue-600 mb-6">
                {statusText}
              </h2>
              <img
                src="/images/resume-scan.gif"
                alt="Scanning resume"
                className="w-full max-w-md mx-auto"
              />
            </div>
          ) : (
            <h2 className="text-xl md:text-2xl text-gray-700 mt-4">
              Drop your resume for an ATS score and improvement tips
            </h2>
          )}
        </div>

        {!isProcessing && (
          <form
            id="upload-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 mt-8 bg-white/90 backdrop-blur-sm p-8 md:p-10 rounded-2xl shadow-xl border border-gray-200"
          >
            <div className="form-div">
              <label htmlFor="company-name" className="block text-sm font-medium mb-2">
                Company Name
              </label>
              <input
                type="text"
                id="company-name"
                placeholder="e.g. Google, Shopify, Meta"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="form-div">
              <label htmlFor="job-title" className="block text-sm font-medium mb-2">
                Job Title
              </label>
              <input
                type="text"
                id="job-title"
                placeholder="e.g. Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="form-div">
              <label htmlFor="job-description" className="block text-sm font-medium mb-2">
                Job Description
              </label>
              <textarea
                id="job-description"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={7}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="form-div">
              <label className="block text-sm font-medium mb-2">
                Upload Resume (PDF, max 20MB)
              </label>
              <FileUploader onFileSelect={handleFileSelect} />
              {file && (
                <p className="mt-3 text-sm text-green-700 font-medium">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isProcessing || !file || !companyName || !jobTitle || !jobDescription}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Analyze Resume'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default Upload;