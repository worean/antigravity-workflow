/**
 * AntiGravity Unified Logger Utility
 * - 로그 레벨 관리 (DEBUG, INFO, WARN, ERROR, SILENT)
 * - 모듈별 태그 프리픽스 지정
 * - 인메모리 최근 로그 링 버퍼(Ring Buffer) 저장 및 내보내기/화면 출력 지원
 */

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  levelLabel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  module: string;
  message: string;
  args?: any[];
}

export interface LoggerInstance {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

class LogManager {
  private currentLevel: LogLevel = LogLevel.DEBUG;
  private maxHistorySize: number = 300;
  private history: LogEntry[] = [];
  private sequenceId: number = 0;
  private listeners: Set<(entry: LogEntry) => void> = new Set();

  constructor() {
    // Vite 환경에서 프로덕션 빌드일 경우 기본 INFO 레벨 적용
    const isProd = typeof import.meta !== 'undefined' && import.meta.env?.PROD;
    this.currentLevel = isProd ? LogLevel.INFO : LogLevel.DEBUG;
  }

  /**
   * 전역 최소 로그 레벨을 설정합니다.
   */
  public setLogLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * 현재 설정된 전역 로그 레벨을 반환합니다.
   */
  public getLogLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * 최대 보관 로그 기록 개수를 설정합니다.
   */
  public setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(1, size);
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(this.history.length - this.maxHistorySize);
    }
  }

  /**
   * 새 로그 엔트리를 기록하고 리스너에게 통지합니다.
   */
  public addLog(level: LogLevel, module: string, message: string, args: any[] = []): void {
    const now = new Date();
    const timestamp = now.toISOString();

    const levelLabels: Record<number, 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'> = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.ERROR]: 'ERROR',
    };
    const levelLabel = levelLabels[level] || 'INFO';

    const entry: LogEntry = {
      id: ++this.sequenceId,
      timestamp,
      level,
      levelLabel,
      module,
      message,
      args: args.length > 0 ? args : undefined,
    };

    // 링 버퍼에 추가
    this.history.push(entry);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // 등록된 실시간 구독자들에게 알림 (UI 디버그 뷰어 등)
    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch {
        // 리스너 오류 무시
      }
    });

    // 콘솔 출력 (현재 레벨 이상일 때만)
    if (level >= this.currentLevel && this.currentLevel !== LogLevel.SILENT) {
      this.printToConsole(entry);
    }
  }

  private printToConsole(entry: LogEntry): void {
    const timeStr = entry.timestamp.split('T')[1]?.slice(0, 12) || '';
    const prefix = `[${timeStr}][${entry.module}][${entry.levelLabel}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`%c${prefix}`, 'color: #888;', entry.message, ...(entry.args || []));
        break;
      case LogLevel.INFO:
        console.info(`%c${prefix}`, 'color: #38bdf8;', entry.message, ...(entry.args || []));
        break;
      case LogLevel.WARN:
        console.warn(`%c${prefix}`, 'color: #f59e0b; font-weight: bold;', entry.message, ...(entry.args || []));
        break;
      case LogLevel.ERROR:
        console.error(`%c${prefix}`, 'color: #ef4444; font-weight: bold;', entry.message, ...(entry.args || []));
        break;
    }
  }

  /**
   * 현재까지 수집된 인메모리 로그 기록을 반환합니다.
   */
  public getHistory(levelFilter?: LogLevel): LogEntry[] {
    if (levelFilter === undefined) {
      return [...this.history];
    }
    return this.history.filter((h) => h.level >= levelFilter);
  }

  /**
   * 저장된 로그 기록을 초기화합니다.
   */
  public clearHistory(): void {
    this.history = [];
  }

  /**
   * 실시간 로그 발생을 구독합니다. (UI 컴포넌트 언마운트 시 unsubscribe 호출)
   */
  public subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 로그 히스토리를 텍스트 문자열로 내보냅니다.
   */
  public exportLogsAsText(): string {
    return this.history
      .map((e) => {
        const extra = e.args && e.args.length > 0 ? ` | ${JSON.stringify(e.args)}` : '';
        return `[${e.timestamp}][${e.levelLabel}][${e.module}] ${e.message}${extra}`;
      })
      .join('\n');
  }

  /**
   * 특정 모듈 전용 Logger 인스턴스를 생성합니다.
   */
  public createLogger(moduleName: string): LoggerInstance {
    return {
      debug: (msg: string, ...args: any[]) => this.addLog(LogLevel.DEBUG, moduleName, msg, args),
      info: (msg: string, ...args: any[]) => this.addLog(LogLevel.INFO, moduleName, msg, args),
      warn: (msg: string, ...args: any[]) => this.addLog(LogLevel.WARN, moduleName, msg, args),
      error: (msg: string, ...args: any[]) => this.addLog(LogLevel.ERROR, moduleName, msg, args),
    };
  }
}

export const logManager = new LogManager();
export const createLogger = (moduleName: string): LoggerInstance => logManager.createLogger(moduleName);
export default logManager;
