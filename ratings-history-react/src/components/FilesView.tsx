import axios from "axios";
import { useState, useEffect } from "react";
import FileComponent from "./FileComponent";
import { FileMetaData } from "../types";
import { Events } from "../types";
import { emitter } from "../services/emitter";

const FilesView = () => {
  const [files, setFiles] = useState<FileMetaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getFiles = async () => {
    setIsLoading(true);
    const response = await axios.get("http://localhost:3000/api/v1/files");

    setIsLoading(false);
    setFiles(response.data.message);
  };

  const handleFileDelete = (fileName: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const handleFileEdit = (data: {
    currentFileName: string;
    newFileName: string;
  }) => {
    const { currentFileName, newFileName } = data;

    setFiles((prev) =>
      prev.map((file) =>
        file.name === currentFileName ? { ...file, name: newFileName } : file
      )
    );
  };

  useEffect(() => {
    getFiles();

    emitter.subscribe(Events.FILES_UPDATE, getFiles);
    emitter.subscribe(Events.FILE_DELETE, handleFileDelete);
    emitter.subscribe(Events.FILE_EDIT, handleFileEdit);

    return () => {
      emitter.subscribe(Events.FILES_UPDATE, getFiles);
      emitter.unsubscribe(Events.FILE_DELETE, handleFileDelete);
      emitter.subscribe(Events.FILE_EDIT, handleFileEdit);
    };
  }, []);

  return (
    <div className="relative p-4 w-1/2 overflow-y-auto">
      {files.length ? (
        <div className="flex flex-col gap-4">
          {files.map((file: FileMetaData) => (
            <FileComponent key={file.name} file={file} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 items-center justify-center h-full w-full opacity-50">
          <span className="ic text-7xl font-thin">folder</span>No files
        </div>
      )}
      {isLoading && (
        <div className="absolute z-20 left-0 top-0 w-full h-full flex gap-4 items-center justify-center backdrop-blur-sm">
          <div className="size-8 rounded-full border border-blue-700 border-r-transparent animate-spin" />
          <div className="text-lg font-light">Getting files</div>
        </div>
      )}
    </div>
  );
};

export default FilesView;
