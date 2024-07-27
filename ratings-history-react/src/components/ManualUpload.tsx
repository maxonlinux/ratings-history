import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import socket from "../services/socket";
import { Events, Message } from "../types";
import { emitter } from "../services/emitter";
import { config } from "../config";

const getMessageColorClass = (message: Message) => {
  if (!message) {
    return "opacity-50";
  }

  if (message.type === "exit") {
    return "text-blue-700";
  }

  if (message.type === "error") {
    return "text-red-700";
  }

  if (message.type === "message") {
    return "text-gray-700";
  }
};

const ManualUpload = () => {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasMessages = messages.length;
  const isLoading = hasMessages ? messages[0].type === "message" : false;
  const isFailed = hasMessages ? messages[0].type === "error" : false;
  const isDone = hasMessages ? messages[0].type === "exit" : false;
  const isQueued = hasMessages ? messages[0].message === "Queued..." : false;

  const lastMessageClassName = hasMessages
    ? getMessageColorClass(messages[0])
    : "";

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError("");

    const files = e.target.files;

    if (!files) {
      return;
    }

    handleUpload(files);
  };

  const handleUpload = (files: FileList | File[]) => {
    try {
      setUploadedFiles([...files]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDragEnter = () => {
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    setError("");

    const files = Array.from(e.dataTransfer.files);
    const zipFiles = files.filter((file) => file.type === "application/zip");

    if (!zipFiles.length) {
      removeItem();
      setError("Only ZIP files are allowed!");
      return;
    }

    handleUpload(files);
  };

  const removeItem = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setUploadedFiles([]);
  };

  const uploadFileToServer = async () => {
    if (!uploadedFiles.length) {
      setError("No file selected for upload.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => formData.append("files", file));

      const response = await axios.post(
        config.apiUrl + "/manual/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      console.log(response.data);
      removeItem();
    } catch (error) {
      setError("Failed to upload file.");
      console.error("Upload error:", error);
    }
  };

  const handleAbort = async () => {
    try {
      const response = await axios.post(config.apiUrl + "/manual/abort", null, {
        withCredentials: true,
      });

      console.log(response.data);
      removeItem();
    } catch (error) {
      setError("Failed to abort");
      console.error("Abort error:", error);
    }
  };

  useEffect(() => {
    if (isFailed || isDone) {
      setIsUploading(false);
      emitter.dispatch(Events.FILES_UPDATE, null);
    }
  }, [isFailed, isDone]);

  useEffect(() => {
    const handleUploadUpdate = (data: Message[]) => {
      setMessages(data);

      if (data.length) {
        setIsUploading(true);
        return;
      }

      setIsUploading(false);
    };

    socket.subscribe("UPLOAD_UPDATE", handleUploadUpdate);

    return () => {
      socket.unsubscribe("UPLOAD_UPDATE");
    };
  }, []);

  const Messages = () => {
    return (
      <div className="w-full h-full flex flex-col gap-4">
        <div
          className={`${lastMessageClassName} flex items-center gap-2 text-sm`}
        >
          {isLoading && (
            <span className="ic animate-spin">progress_activity</span>
          )}
          {isFailed && <span className="ic">error</span>}
          {isDone && <span className="ic">done</span>}
          {messages[0].message}
          {isLoading && (
            <button
              className="ml-auto flex gap-2 justify-between items-center text-sm bg-red-700/15 text-red-700 px-4 py-2 rounded-full"
              onClick={handleAbort}
              disabled={!isQueued}
            >
              Abort
              <span className="ic">close</span>
            </button>
          )}
          {(isFailed || isDone) && (
            <button
              className="ml-auto flex gap-2 justify-between items-center text-sm bg-blue-700/15 text-blue-700 px-4 py-2 rounded-full"
              onClick={() => {
                setMessages([]);
              }}
            >
              Start over
              <span className="ic">replay</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const DragAndDrop = () => {
    return (
      <label htmlFor="file-input">
        <input
          id="file-input"
          className="hidden"
          type="file"
          accept=".zip"
          multiple={true}
          onChange={handleFileInputChange}
          disabled={isUploading}
          ref={fileInputRef}
        />
        <div
          className={`group flex flex-col justify-center items-center w-full border border-dashed rounded-md p-4 cursor-pointer hover:border-blue-700
${isDragActive ? "bg-blue-700/15 border-blue-700" : "border-black/30"}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={handleDrop}
        >
          <div
            className={`text-center pointer-events-none group-hover:text-blue-700 ${
              isDragActive ? "text-blue-700" : "text-gray-400"
            }  `}
          >
            <span className="ic text-7xl font-thin">folder_zip</span>
            <p className="text-3xl font-thin">Manual Upload</p>
            <p className="text-xs my-2">
              {isDragActive
                ? "Leave your file here"
                : "Drag and drop ZIP archive here or click"}
            </p>
          </div>
        </div>
      </label>
    );
  };

  return (
    <div className="p-4 border border-black/20 rounded-lg">
      {hasMessages ? <Messages /> : <DragAndDrop />}

      {uploadedFiles.map((file) => (
        <div className="flex justify-between items-center mt-4 text-blue-700 text-xs p-4 border border-blue-700 rounded-md w-full cursor-default">
          {file.name} - {(file.size / 1024 / 1024).toFixed(2)} MB
          <button className="ic cursor-pointer" onClick={removeItem}>
            close
          </button>
        </div>
      ))}

      {error && (
        <div className="flex justify-between items-center mt-4 text-red-700 text-xs p-4 border border-red-700 rounded-md w-full cursor-default">
          {error}
          <button className="ic cursor-pointer" onClick={() => setError("")}>
            close
          </button>
        </div>
      )}

      {(uploadedFiles.length || isUploading) && !hasMessages && (
        <button
          className="flex gap-2 items-center text-sm mt-4 w-full bg-blue-700 text-white px-6 py-4 rounded-md transition-all hover:pr-4 disabled:bg-gray-300"
          disabled={!uploadedFiles.length}
          onClick={uploadFileToServer}
        >
          {isUploading ? (
            <>
              <span className="ic animate-spin">progress_activity</span>
              <span className="font-bold">Uploading...</span>
            </>
          ) : (
            <>
              <span className="font-bold">Proceed</span>
              <span className="ic ml-auto">east</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ManualUpload;
