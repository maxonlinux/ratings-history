import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { emitter } from "../services/emitter";
import { Events } from "../types";
import { config } from "../config";

const FileComponent: React.FC<{
  file: { name: string; date: string; size: number; lines: number };
}> = ({ file }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(file.name);

  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      deleteButtonRef.current &&
      !deleteButtonRef.current.contains(event.target as Node)
    ) {
      setIsDeleting(false);
    }

    if (
      editButtonRef.current &&
      !editButtonRef.current.contains(event.target as Node) &&
      inputRef.current &&
      !inputRef.current.contains(event.target as Node)
    ) {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }

    try {
      emitter.dispatch(Events.FILE_DELETE, file.name);
      const res = await axios.delete(config.apiUrl + "/files/" + file.name, {
        withCredentials: true,
      });
      console.log(res.data);
    } catch (error) {
      console.error(error);
    }

    setIsDeleting(false);
  };

  const handleEdit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (editedName !== file.name) {
      try {
        const res = await axios.put(
          config.apiUrl + "/files/" + file.name,
          {
            newName: editedName,
          },
          { withCredentials: true }
        );
        emitter.dispatch(Events.FILE_EDIT, {
          currentFileName: file.name,
          newFileName: editedName,
        });
        console.log(res.data);
      } catch (error) {
        console.error("Error updating file name:", error);
      }

      setEditedName(file.name);
    }

    setIsEditing(false);
  };

  return (
    <div className="relative border border-black/15 rounded-lg overflow-hidden">
      <div className="flex gap-4 p-4 items-center">
        <div className="ic flex items-center justify-center rounded-full flex-shrink-0 size-10 bg-gray-200">
          description
        </div>
        {isEditing ? (
          <input
            className="relative z-10 w-full focus:outline-none bg-transparent border-b border-gray-700/30 focus:border-blue-700 caret-blue-700"
            type="text"
            ref={inputRef}
            autoFocus={true}
            value={editedName}
            onChange={(e) => {
              setEditedName(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleEdit();
              }
            }}
          />
        ) : (
          <a
            className="hover:text-blue-700 border-b border-transparent"
            href={config.apiUrl + "/public/" + file.name}
          >
            {file.name}
          </a>
        )}
        <div className="relative z-10 flex gap-4 ml-auto">
          <button
            className="ic size-10 bg-gray-700/15 text-gray-700 flex-shrink-0 rounded-full"
            onClick={handleEdit}
            ref={editButtonRef}
          >
            {isEditing ? "done" : "edit"}
          </button>
          {isEditing && (
            <button className="ic size-10 bg-red-700/15 text-red-700 flex-shrink-0 rounded-full">
              close
            </button>
          )}
          {!isEditing && (
            <div className="relative z-10 flex items-center">
              <div
                className={`absolute right-full mr-2 transition-opacity h-10 p-4 flex items-center justify-center text-xs bg-white shadow-sm text-red-700 rounded-full border border-black/10 ${
                  isDeleting ? "" : "pointer-events-none"
                }`}
                style={{ opacity: isDeleting ? 100 : 0 }}
              >
                Sure?
              </div>

              <button
                className="ic size-10 bg-red-700/15 text-red-700 flex-shrink-0 rounded-full"
                onClick={handleDelete}
                ref={deleteButtonRef}
              >
                delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="py-2 px-4 flex gap-2 justify-between text-xs opacity-50 border-t border-black/20">
        <div>
          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.lines} lines
        </div>
        <div className="text-right">{new Date(file.date).toLocaleString()}</div>
      </div>
      <div
        className={`absolute left-0 top-0 w-full h-full transition-all ${
          isDeleting || isEditing
            ? `${isDeleting ? "bg-red-700/10" : ""} ${
                isEditing ? "bg-gray-700/10" : ""
              }`
            : "backdrop-blur-0 pointer-events-none"
        }`}
      />
    </div>
  );
};

export default FileComponent;
