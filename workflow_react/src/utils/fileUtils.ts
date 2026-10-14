/**
 * 파일 처리 및 검증, 크기 포맷팅 관련 공통 유틸리티
 */

export interface FileValidationOptions {
  /** 최대 허용 파일 크기 (바이트 단위, 기본: 20MB) */
  maxSizeBytes?: number;
  /** 허용 파일 확장자 목록 (소문자, 예: ['jpg', 'png', 'pdf', 'zip']) */
  allowedExtensions?: string[];
  /** 허용 MIME 타입 접두사 또는 전체 (예: ['image/', 'application/pdf']) */
  allowedMimeTypes?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export type FileCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'archive'
  | 'code'
  | 'other';

/**
 * 바이트 크기를 사람이 읽기 편한 형식(B, KB, MB, GB)으로 변환합니다.
 */
export const formatFileSize = (bytes?: number | null, decimals: number = 1): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const clampedI = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, clampedI)).toFixed(dm))} ${sizes[clampedI]}`;
};

/**
 * 파일 경로 또는 파일명에서 확장자를 소문자로 추출합니다. (점 제외)
 */
export const getFileExtension = (filename?: string | null): string => {
  if (!filename) return '';
  const clean = filename.trim().split('?')[0].split('#')[0];
  const lastDot = clean.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0 || lastDot === clean.length - 1) {
    return '';
  }
  return clean.slice(lastDot + 1).toLowerCase();
};

/**
 * 확장자 또는 MIME 타입을 기반으로 파일의 카테고리를 판별합니다.
 */
export const getFileCategory = (
  mimeTypeOrFilename?: string | null,
  filenameFallback?: string | null
): FileCategory => {
  const target = (mimeTypeOrFilename || '').toLowerCase();
  const ext = getFileExtension(filenameFallback || mimeTypeOrFilename);

  // 1. 이미지 판별
  if (
    target.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)
  ) {
    return 'image';
  }

  // 2. 비디오 판별
  if (
    target.startsWith('video/') ||
    ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv'].includes(ext)
  ) {
    return 'video';
  }

  // 3. 오디오 판별
  if (
    target.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)
  ) {
    return 'audio';
  }

  // 4. 문서 판별
  if (
    target.includes('pdf') ||
    target.includes('document') ||
    target.includes('sheet') ||
    target.includes('presentation') ||
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'hwp'].includes(ext)
  ) {
    return 'document';
  }

  // 5. 압축 파일 판별
  if (
    target.includes('zip') ||
    target.includes('tar') ||
    target.includes('rar') ||
    ['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)
  ) {
    return 'archive';
  }

  // 6. 소스 코드 판별
  if (
    ['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css', 'scss', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'sql'].includes(ext)
  ) {
    return 'code';
  }

  return 'other';
};

/**
 * 이미지를 나타내는 파일인지 확인합니다.
 */
export const isImageFile = (mimeTypeOrFilename?: string | null): boolean => {
  return getFileCategory(mimeTypeOrFilename) === 'image';
};

/**
 * 파일 용량 및 확장자, MIME 타입을 종합 검증합니다.
 */
export const validateFile = (
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult => {
  const {
    maxSizeBytes = 20 * 1024 * 1024, // 기본 20MB
    allowedExtensions,
    allowedMimeTypes,
  } = options;

  // 1. 크기 검증
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `파일 크기는 최대 ${formatFileSize(maxSizeBytes)} 이하여야 합니다. (현재: ${formatFileSize(file.size)})`,
    };
  }

  // 2. 확장자 검증
  const ext = getFileExtension(file.name);
  if (allowedExtensions && allowedExtensions.length > 0) {
    const normalizedAllowed = allowedExtensions.map((e) => e.toLowerCase().replace(/^\./, ''));
    if (!ext || !normalizedAllowed.includes(ext)) {
      return {
        valid: false,
        error: `허용되지 않은 파일 형식입니다. (허용: ${normalizedAllowed.join(', ')})`,
      };
    }
  }

  // 3. MIME 타입 검증
  if (allowedMimeTypes && allowedMimeTypes.length > 0 && file.type) {
    const isMimeAllowed = allowedMimeTypes.some((allowed) => {
      if (allowed.endsWith('/*')) {
        const prefix = allowed.slice(0, -2);
        return file.type.startsWith(prefix);
      }
      return file.type === allowed;
    });

    if (!isMimeAllowed) {
      return {
        valid: false,
        error: `허용되지 않는 MIME 형식입니다: ${file.type}`,
      };
    }
  }

  return { valid: true };
};

/**
 * File 또는 Blob 객체를 Base64 문자열로 변환합니다.
 */
export const fileToBase64 = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Blob 객체를 다운로드 트리거합니다.
 */
export const downloadFileFromBlob = (blob: Blob, filename: string): void => {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * URL 링크의 파일을 다운로드하도록 트리거합니다.
 */
export const downloadFileFromUrl = (url: string, filename?: string): void => {
  if (typeof window === 'undefined') return;
  const a = document.createElement('a');
  a.href = url;
  if (filename) a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
