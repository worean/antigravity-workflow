import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logManager, createLogger, LogLevel } from '../utils/logger';

describe('logger', () => {
  beforeEach(() => {
    logManager.clearHistory();
    logManager.setLogLevel(LogLevel.DEBUG);
    logManager.setMaxHistorySize(300);
  });

  it('createLogger로 생성한 인스턴스로 로그를 남기면 히스토리에 정상 누적되어야 한다', () => {
    const logger = createLogger('TestModule');
    logger.info('Hello Info');
    logger.warn('Warning happened', { code: 404 });
    logger.error('Critical failure');

    const history = logManager.getHistory();
    expect(history.length).toBe(3);
    expect(history[0].module).toBe('TestModule');
    expect(history[0].levelLabel).toBe('INFO');
    expect(history[0].message).toBe('Hello Info');

    expect(history[1].levelLabel).toBe('WARN');
    expect(history[1].args).toEqual([{ code: 404 }]);

    expect(history[2].levelLabel).toBe('ERROR');
  });

  it('로그 레벨 필터링이 올바르게 동작해야 한다', () => {
    const logger = createLogger('LevelModule');
    logManager.setLogLevel(LogLevel.WARN);

    logger.debug('Debug msg');
    logger.info('Info msg');
    logger.warn('Warn msg');
    logger.error('Error msg');

    // getHistory에서 레벨 필터 조회 테스트
    const warnAndAbove = logManager.getHistory(LogLevel.WARN);
    expect(warnAndAbove.length).toBe(2);
    expect(warnAndAbove[0].message).toBe('Warn msg');
    expect(warnAndAbove[1].message).toBe('Error msg');
  });

  it('링 버퍼 크기 초과 시 오래된 로그부터 자동 제거되어야 한다', () => {
    logManager.setMaxHistorySize(5);
    const logger = createLogger('BufferModule');

    for (let i = 1; i <= 8; i++) {
      logger.info(`Message ${i}`);
    }

    const history = logManager.getHistory();
    expect(history.length).toBe(5);
    expect(history[0].message).toBe('Message 4');
    expect(history[4].message).toBe('Message 8');
  });

  it('exportLogsAsText로 문자열 내보내기가 정상 동작해야 한다', () => {
    const logger = createLogger('ExportModule');
    logger.info('Test line 1');
    logger.error('Test line 2');

    const exported = logManager.exportLogsAsText();
    expect(exported).toContain('[ExportModule] Test line 1');
    expect(exported).toContain('[ERROR][ExportModule] Test line 2');
  });

  it('subscribe 리스너가 새 로그 발생 시 호출되어야 한다', () => {
    const listener = vi.fn();
    const unsubscribe = logManager.subscribe(listener);

    const logger = createLogger('EventModule');
    logger.info('Trigger event');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'EventModule',
        message: 'Trigger event',
      })
    );

    unsubscribe();
    logger.info('After unsubscribe');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
