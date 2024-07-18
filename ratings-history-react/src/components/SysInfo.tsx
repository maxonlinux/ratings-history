import { useState, useEffect } from "react";
import socket from "../services/socket";
import { SystemInfo } from "../types";

const ProgressBar: React.FC<{ progress: number | string }> = ({ progress }) => {
  const num = Number(progress);
  return (
    <div className="relative w-full h-1 bg-gray-200 rounded-full mt-2">
      <div
        className={`absolute h-full ${
          num > 80 ? "bg-red-400" : num > 50 ? " bg-amber-500" : "bg-blue-700"
        } rounded-full transition-all duration-500`}
        style={{ width: progress + "%" }}
      />
    </div>
  );
};

const ResourceTable: React.FC<{
  total: number | string;
  used: number | string;
  free: number | string;
}> = ({ total, used, free }) => {
  return (
    <table className="w-full">
      <thead className="opacity-50">
        <tr>
          <th className="text-start font-normal">Total</th>
          <th className="text-center font-normal">Used</th>
          <th className="text-end font-normal">Free</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="text-start">{total}</td>
          <td className="text-center">{used}</td>
          <td className="text-end">{free}</td>
        </tr>
      </tbody>
    </table>
  );
};

const SysInfo = () => {
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);

  const formatBytes = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (24 * 3600));
    const hours = Math.floor((uptime % (24 * 3600)) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return { days, hours, minutes };
  };

  useEffect(() => {
    socket.subscribe("SYSTEM_INFO", (data: any) => {
      console.log(data);
      setSysInfo(data);
    });

    return () => {
      socket.unsubscribe("SYSTEM_INFO");
    };
  }, []);

  if (!sysInfo) {
    return (
      <div className="flex justify-center items-center w-full h-full gap-2 text-4xl font-thin">
        <span className="ic animate-spin">progress_activity</span>
      </div>
    );
  }

  const uptimeData = formatUptime(sysInfo.uptime);

  return (
    <div className="flex flex-col gap-4 text-xs">
      <div className="p-4 rounded-lg border border-black/20">
        <h2 className="text-xl font-thin mb-2">CPU</h2>
        <div>
          <span className="opacity-50">Usage:</span>{" "}
          {sysInfo.cpu.usage.toFixed(2)}%
        </div>
        <ProgressBar progress={sysInfo.cpu.usage.toFixed(2)} />
      </div>
      <div className="p-4 rounded-lg border border-black/20">
        <h2 className="text-xl font-thin mb-2">RAM</h2>
        <div>
          <ResourceTable
            total={formatBytes(sysInfo.memory.total)}
            used={formatBytes(sysInfo.memory.used)}
            free={formatBytes(sysInfo.memory.free)}
          />
          {/* <p>Usage: {sysInfo.memory.percentage.toFixed(2)}%</p> */}
          <ProgressBar progress={sysInfo.memory.percentage.toFixed(2)} />
        </div>
      </div>
      <div className="p-4 rounded-lg border border-black/20">
        <h2 className="text-xl font-thin mb-2">Disk</h2>
        <div className="flex flex-col gap-4 border-b">
          {sysInfo.disk.map((disk, index) => (
            <div key={index} className="">
              {/* <p>Filesystem: {disk.fs}</p>
                <p>Type: {disk.type}</p> */}
              <ResourceTable
                total={formatBytes(disk.size)}
                used={formatBytes(disk.used)}
                free={formatBytes(disk.free)}
              />
              {/* <p>Usage: {disk.percentage.toFixed(2)}%</p> */}
              <ProgressBar progress={disk.percentage.toFixed(2)} />
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 rounded-lg border border-black/20">
        <h2 className="text-xl font-thin mb-2">Uptime</h2>
        <div className="flex gap-2">
          <span className="">{uptimeData.days}</span>
          <span className="opacity-50">Days</span>
          <span>{uptimeData.hours}</span>
          <span className="opacity-50">Hrs</span>
          <span>{uptimeData.minutes}</span>
          <div className="opacity-50">Mins</div>
        </div>
        {Math.floor(sysInfo.uptime / (24 * 3600)) > 30 && (
          <div className="opacity-50">Reboot recommended</div>
        )}
      </div>
    </div>
  );
};

export default SysInfo;
