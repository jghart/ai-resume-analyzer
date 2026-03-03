import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { formatSize } from '~/lib/utils'; // assuming this exists and works

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null); // clear previous errors

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        onFileSelect?.(selectedFile);
      }
    },
    [onFileSelect]
  );

  const onDropRejected = useCallback((fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      const issue = fileRejections[0];
      if (issue.errors.some((e: any) => e.code === 'file-too-large')) {
        setError('File is too large (max 20 MB)');
      } else if (issue.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setError('Only PDF files are allowed');
      } else {
        setError('Invalid file');
      }
      setFile(null);
      onFileSelect?.(null);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 20 * 1024 * 1024, // 20 MB
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering dropzone click
    setFile(null);
    setError(null);
    onFileSelect?.(null);
  };

  return (
    <div className="w-full gradient-border">
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${error ? 'border-red-500 bg-red-50' : ''}`}
      >
        <input {...getInputProps()} />

        {error ? (
          <div className="text-red-600">
            <p>{error}</p>
            <p className="text-sm mt-2">Please try again.</p>
          </div>
        ) : file ? (
          <div
            className="uploader-selected-file flex items-center justify-between"
            onClick={(e) => e.stopPropagation()} // prevent re-open on click inside
          >
            <div className="flex items-center space-x-4">
              <img src="/images/pdf.png" alt="PDF icon" className="size-10" />
              <div>
                <p className="text-sm font-medium text-gray-700 truncate max-w-[200px] md:max-w-xs">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded-full transition"
              onClick={removeFile}
              aria-label="Remove file"
            >
              <img src="/icons/cross.svg" alt="Remove" className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
              <img src="/icons/info.svg" alt="Upload icon" className="size-16" />
            </div>
            <p className="text-lg text-gray-500">
              <span className="font-semibold text-gray-700">Click to upload</span> or drag and drop
            </p>
            <p className="text-base text-gray-500">PDF (max 20 MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;