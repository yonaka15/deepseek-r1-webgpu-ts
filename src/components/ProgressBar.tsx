import React from "react";

interface ProgressBarProps {
  progress: number;
  fileName: string;
  fileSize: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  fileName,
  fileSize,
}) => {
  // Format the progress to 2 decimal places
  const formattedProgress = Number(progress).toFixed(2);

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <div className="mb-2 flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium truncate">
          {fileName || "Loading model..."}
          {fileSize && ` (${fileSize} GB)`}
        </span>
        <span>{formattedProgress}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
