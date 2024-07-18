import { socket } from ".";
import { Events } from "../types";
import si from "systeminformation";

interface SysInfo {
  cpu: {
    manufacturer: string;
    brand: string;
    speed: number;
    cores: number;
    usage: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  disk: {
    fs: string;
    type: string;
    size: number;
    used: number;
    free: number;
    percentage: number;
  }[];

  uptime: number;
}

class Monitor {
  intervalId: NodeJS.Timeout;
  info: SysInfo;

  constructor() {
    this.info = {
      cpu: {
        manufacturer: "",
        brand: "",
        speed: 0,
        cores: 0,
        usage: 0,
      },
      memory: {
        total: 0,
        free: 0,
        used: 0,
        percentage: 0,
      },
      disk: [],
      uptime: 0,
    };

    this.intervalId = setInterval(async () => {
      this.info = await this.getSystemResources();

      socket.broadcast({
        event: Events.SYSTEM_INFO,
        data: this.info,
      });
    }, 3000);
  }

  public getSysInfo() {
    return this.info;
  }

  private async getSystemResources() {
    // CPU Information
    const cpu = await si.cpu();
    const cpuUsage = await si.currentLoad();

    // Memory Information
    const memory = await si.mem();
    const memoryUsage = {
      total: memory.total,
      free: memory.free,
      used: memory.used,
      percentage: (memory.used / memory.total) * 100,
    };

    // Disk Information
    const disk = await si.fsSize();
    const diskUsage = disk.map((disk) => ({
      fs: disk.fs,
      type: disk.type,
      size: disk.size,
      used: disk.used,
      free: disk.size - disk.used,
      percentage: (disk.used / disk.size) * 100,
    }));

    // System Uptime
    const uptime = si.time().uptime;

    return {
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        speed: cpu.speed,
        cores: cpu.cores,
        usage: cpuUsage.currentLoad,
      },
      memory: memoryUsage,
      disk: diskUsage,
      uptime,
    };
  }
}

export default Monitor;
