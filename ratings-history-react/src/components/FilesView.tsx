import axios from "axios";
import { useState, useEffect } from "react";
import FileComponent from "./FileComponent";
import { FileMetaData } from "../types";
import { Events } from "../types";
import { emitter } from "../services/emitter";
import { config } from "../config";

const FilesView = () => {
  const [files, setFiles] = useState<FileMetaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getFiles = async () => {
    setIsLoading(true);
    const response = await axios.get(config.apiUrl + "/files");

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
      <h1 className="flex items-center gap-2 text-3xl mb-8 mt-4">
        <span className="font-thin">
          Files {!isLoading && <>({files.length})</>}
        </span>
      </h1>
      {!isLoading && files.length ? (
        <div className="flex flex-col gap-4">
          {files.map((file: FileMetaData) => (
            <FileComponent key={file.name} file={file} />
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="flex flex-col items-center justify-center h-full w-full text-gray-400">
            <span className="ic text-7xl font-thin">folder</span>No files
          </div>
        )
      )}
      {isLoading && (
        <div className="absolute z-20 left-0 top-0 w-full h-full flex gap-2 items-center justify-center text-3xl font-thin">
          <span className="ic animate-spin">progress_activity</span>
          Getting files...
        </div>
      )}
    </div>
  );
};

export default FilesView;
