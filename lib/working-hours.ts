export type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface DaySchedule {
  active: boolean;
  is24h: boolean;
  openTime: string;
  closeTime: string;
  hasLunch: boolean;
  lunchStart?: string;
  lunchEnd?: string;
}

export type WorkingHoursMap = Record<DayKey, DaySchedule>;

export const DAYS_CONFIG: Array<{ key: DayKey; label: string; shortLabel: string }> = [
  { key: "monday", label: "Segunda-feira", shortLabel: "Seg" },
  { key: "tuesday", label: "Terça-feira", shortLabel: "Ter" },
  { key: "wednesday", label: "Quarta-feira", shortLabel: "Qua" },
  { key: "thursday", label: "Quinta-feira", shortLabel: "Qui" },
  { key: "friday", label: "Sexta-feira", shortLabel: "Sex" },
  { key: "saturday", label: "Sábado", shortLabel: "Sáb" },
  { key: "sunday", label: "Domingo", shortLabel: "Dom" },
];

export const DEFAULT_DAY_SCHEDULE: DaySchedule = {
  active: true,
  is24h: false,
  openTime: "08:00",
  closeTime: "18:00",
  hasLunch: false,
  lunchStart: "12:00",
  lunchEnd: "13:00",
};

export const DEFAULT_WORKING_HOURS: WorkingHoursMap = {
  monday: { ...DEFAULT_DAY_SCHEDULE },
  tuesday: { ...DEFAULT_DAY_SCHEDULE },
  wednesday: { ...DEFAULT_DAY_SCHEDULE },
  thursday: { ...DEFAULT_DAY_SCHEDULE },
  friday: { ...DEFAULT_DAY_SCHEDULE },
  saturday: {
    active: true,
    is24h: false,
    openTime: "08:00",
    closeTime: "13:00",
    hasLunch: false,
    lunchStart: "12:00",
    lunchEnd: "13:00",
  },
  sunday: {
    active: false,
    is24h: false,
    openTime: "08:00",
    closeTime: "12:00",
    hasLunch: false,
    lunchStart: "12:00",
    lunchEnd: "13:00",
  },
};

export function timeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.replace(/h/g, "").split(":");
  const hours = parseInt(parts[0] || "0", 10);
  const minutes = parseInt(parts[1] || "0", 10);
  return hours * 60 + minutes;
}

export function formatDaySchedule(schedule: DaySchedule): string {
  if (!schedule || !schedule.active) {
    return "Fechado";
  }
  if (schedule.is24h) {
    return "Aberto 24 horas";
  }
  if (schedule.hasLunch && schedule.lunchStart && schedule.lunchEnd) {
    return `${schedule.openTime} às ${schedule.lunchStart} e ${schedule.lunchEnd} às ${schedule.closeTime}`;
  }
  return `${schedule.openTime} às ${schedule.closeTime}`;
}

export function parseWorkingHours(raw: any): WorkingHoursMap {
  if (!raw) return JSON.parse(JSON.stringify(DEFAULT_WORKING_HOURS));

  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      // Return default if string is unparseable
      return JSON.parse(JSON.stringify(DEFAULT_WORKING_HOURS));
    }
  }

  if (typeof obj !== "object" || obj === null) {
    return JSON.parse(JSON.stringify(DEFAULT_WORKING_HOURS));
  }

  // Check if it already has key day properties
  const isFullMap = "monday" in obj || "tuesday" in obj;
  if (isFullMap) {
    const result = { ...DEFAULT_WORKING_HOURS };
    DAYS_CONFIG.forEach(({ key }) => {
      if (obj[key]) {
        const item = obj[key];
        result[key] = {
          active: Boolean(item.active ?? true),
          is24h: Boolean(item.is24h ?? false),
          openTime: item.openTime || item.open || "08:00",
          closeTime: item.closeTime || item.close || "18:00",
          hasLunch: Boolean(item.hasLunch ?? false),
          lunchStart: item.lunchStart || "12:00",
          lunchEnd: item.lunchEnd || "13:00",
        };
      }
    });
    return result;
  }

  // Handle legacy simple object formats (e.g. { weekday: "08:00-18:00", saturday: "..." })
  const result: WorkingHoursMap = JSON.parse(JSON.stringify(DEFAULT_WORKING_HOURS));

  if (obj.weekday || obj.weekdays) {
    const rawVal = String(obj.weekday || obj.weekdays);
    const parts = rawVal.replace(/h/g, "").split("-");
    if (parts.length === 2) {
      const open = parts[0].trim();
      const close = parts[1].trim();
      ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach((k) => {
        result[k as DayKey] = {
          active: true,
          is24h: false,
          openTime: open,
          closeTime: close,
          hasLunch: false,
          lunchStart: "12:00",
          lunchEnd: "13:00",
        };
      });
    }
  }

  if (obj.saturday) {
    const rawVal = String(obj.saturday);
    const parts = rawVal.replace(/h/g, "").split("-");
    if (parts.length === 2) {
      result.saturday = {
        active: true,
        is24h: false,
        openTime: parts[0].trim(),
        closeTime: parts[1].trim(),
        hasLunch: false,
        lunchStart: "12:00",
        lunchEnd: "13:00",
      };
    } else if (rawVal.toLowerCase().includes("fechado")) {
      result.saturday.active = false;
    }
  }

  if (obj.sunday) {
    const rawVal = String(obj.sunday);
    const parts = rawVal.replace(/h/g, "").split("-");
    if (parts.length === 2) {
      result.sunday = {
        active: true,
        is24h: false,
        openTime: parts[0].trim(),
        closeTime: parts[1].trim(),
        hasLunch: false,
        lunchStart: "12:00",
        lunchEnd: "13:00",
      };
    } else if (rawVal.toLowerCase().includes("fechado")) {
      result.sunday.active = false;
    }
  }

  return result;
}

export interface RealTimeStatus {
  isOpen: boolean;
  badge: "🟢 Aberto agora" | "🔴 Fechado agora";
  detailMessage: string;
}

const DAY_ORDER: DayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function calculateRealTimeStatus(
  hoursMap: WorkingHoursMap,
  nowDate: Date = new Date()
): RealTimeStatus {
  const dayIndex = nowDate.getDay(); // 0 = Sunday ... 6 = Saturday
  const currentDayKey = DAY_ORDER[dayIndex];
  const todaySchedule = hoursMap[currentDayKey];

  const currentMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

  if (!todaySchedule || !todaySchedule.active) {
    const nextInfo = getNextOpeningInfo(hoursMap, dayIndex, currentMinutes);
    return {
      isOpen: false,
      badge: "🔴 Fechado agora",
      detailMessage: nextInfo || "Fechado hoje",
    };
  }

  if (todaySchedule.is24h) {
    return {
      isOpen: true,
      badge: "🟢 Aberto agora",
      detailMessage: "Aberto 24 horas",
    };
  }

  const openMin = timeToMinutes(todaySchedule.openTime);
  const closeMin = timeToMinutes(todaySchedule.closeTime);

  // Check lunch break
  if (todaySchedule.hasLunch && todaySchedule.lunchStart && todaySchedule.lunchEnd) {
    const lunchStartMin = timeToMinutes(todaySchedule.lunchStart);
    const lunchEndMin = timeToMinutes(todaySchedule.lunchEnd);

    if (currentMinutes >= lunchStartMin && currentMinutes < lunchEndMin) {
      return {
        isOpen: false,
        badge: "🔴 Fechado agora",
        detailMessage: `Abre hoje às ${todaySchedule.lunchEnd}`,
      };
    }
  }

  // Normal daytime schedule (e.g. 08:00 to 18:00)
  if (closeMin > openMin) {
    if (currentMinutes >= openMin && currentMinutes < closeMin) {
      // Check if closing soon or lunch soon
      if (
        todaySchedule.hasLunch &&
        todaySchedule.lunchStart &&
        currentMinutes < timeToMinutes(todaySchedule.lunchStart)
      ) {
        return {
          isOpen: true,
          badge: "🟢 Aberto agora",
          detailMessage: `Pausa para almoço às ${todaySchedule.lunchStart}`,
        };
      }
      return {
        isOpen: true,
        badge: "🟢 Aberto agora",
        detailMessage: `Fecha às ${todaySchedule.closeTime}`,
      };
    }
    if (currentMinutes < openMin) {
      return {
        isOpen: false,
        badge: "🔴 Fechado agora",
        detailMessage: `Abre hoje às ${todaySchedule.openTime}`,
      };
    }
  } else {
    // Overnight schedule (e.g. 18:00 to 02:00)
    if (currentMinutes >= openMin || currentMinutes < closeMin) {
      return {
        isOpen: true,
        badge: "🟢 Aberto agora",
        detailMessage: `Fecha às ${todaySchedule.closeTime}`,
      };
    }
  }

  // Past closing time for today
  const nextInfo = getNextOpeningInfo(hoursMap, dayIndex, currentMinutes);
  return {
    isOpen: false,
    badge: "🔴 Fechado agora",
    detailMessage: nextInfo || "Fechado",
  };
}

function getNextOpeningInfo(
  hoursMap: WorkingHoursMap,
  currentDayIndex: number,
  _currentMinutes: number
): string {
  // Check next 7 days
  for (let offset = 1; offset <= 7; offset++) {
    const idx = (currentDayIndex + offset) % 7;
    const dayKey = DAY_ORDER[idx];
    const schedule = hoursMap[dayKey];
    if (schedule && schedule.active) {
      const dayConfig = DAYS_CONFIG.find((d) => d.key === dayKey);
      const dayLabel = offset === 1 ? "amanhã" : (dayConfig?.label.toLowerCase() || dayKey);
      const timeStr = schedule.is24h ? "00:00" : schedule.openTime;
      return `Abre ${dayLabel} às ${timeStr}`;
    }
  }
  return "Fechado";
}
