// -*- coding: utf-8 -*-
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './common';
import { Crop, ZoomIn, ZoomOut, Check, X } from 'lucide-react';


interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  fileName?: string;
  onClose: () => void;
  onCropComplete: (croppedPngDataUrl: string) => void;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  fileName,
  onClose,
  onCropComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // 이미지 캔버스 크기
  const [canvasDim, setCanvasDim] = useState<{ width: number; height: number }>({ width: 440, height: 340 });

  // 크롭 정사각형 상태 (캔버스 좌표계 기준)
  const [crop, setCrop] = useState<{ x: number; y: number; size: number }>({ x: 50, y: 50, size: 200 });

  // 드래그 상태
  const [isDraggingPos, setIsDraggingPos] = useState<boolean>(false);
  const [isDraggingResize, setIsDraggingResize] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<{ x: number; y: number; size: number }>({ x: 0, y: 0, size: 0 });

  // 이미지 로드 및 초기 크롭 영역 계산
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;

      // 최대 캔버스 크기 제약
      const maxW = 440;
      const maxH = 340;
      let w = img.naturalWidth;
      let h = img.naturalHeight;

      const scale = Math.min(maxW / w, maxH / h, 1);
      const displayW = Math.round(w * scale);
      const displayH = Math.round(h * scale);

      setCanvasDim({ width: displayW, height: displayH });

      // 초기 크롭 박스: 화면 중앙에 가능한 최대 정사각형의 80%
      const initialSize = Math.min(displayW, displayH) * 0.8;
      const initialX = (displayW - initialSize) / 2;
      const initialY = (displayH - initialSize) / 2;

      setCrop({
        x: Math.max(0, initialX),
        y: Math.max(0, initialY),
        size: Math.max(40, initialSize),
      });
    };
  }, [isOpen, imageSrc]);

  // 메인 캔버스 렌더링 및 마스크 그리기
  const drawMainCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. 이미지 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 2. 어두운 오버레이 마스크
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. 크롭 사각형 영역 밝게 뚫기
    ctx.clearRect(crop.x, crop.y, crop.size, crop.size);
    ctx.drawImage(
      img,
      (crop.x / canvas.width) * img.naturalWidth,
      (crop.y / canvas.height) * img.naturalHeight,
      (crop.size / canvas.width) * img.naturalWidth,
      (crop.size / canvas.height) * img.naturalHeight,
      crop.x,
      crop.y,
      crop.size,
      crop.size
    );

    // 4. 크롭 경계선 (정사각형 테두리)
    ctx.strokeStyle = '#007acc';
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.size, crop.size);

    // 5. 3x3 격자선
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const third = crop.size / 3;
    // 세로선
    ctx.beginPath();
    ctx.moveTo(crop.x + third, crop.y);
    ctx.lineTo(crop.x + third, crop.y + crop.size);
    ctx.moveTo(crop.x + third * 2, crop.y);
    ctx.lineTo(crop.x + third * 2, crop.y + crop.size);
    // 가로선
    ctx.moveTo(crop.x, crop.y + third);
    ctx.lineTo(crop.x + crop.size, crop.y + third);
    ctx.moveTo(crop.x, crop.y + third * 2);
    ctx.lineTo(crop.x + crop.size, crop.y + third * 2);
    ctx.stroke();

    // 6. 원형 가이드선 (아바타 원형 프리뷰 가이드)
    ctx.strokeStyle = 'rgba(78, 201, 176, 0.6)';
    ctx.beginPath();
    ctx.arc(crop.x + crop.size / 2, crop.y + crop.size / 2, crop.size / 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]); // 라인 스타일 복원

    // 7. 우측 하단 리사이즈 핸들
    const handleSize = 10;
    ctx.fillStyle = '#007acc';
    ctx.fillRect(crop.x + crop.size - handleSize, crop.y + crop.size - handleSize, handleSize, handleSize);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(crop.x + crop.size - handleSize, crop.y + crop.size - handleSize, handleSize, handleSize);
  }, [crop]);

  // 실시간 256x256 프리뷰 렌더링
  const drawPreview = useCallback(() => {
    const previewCanvas = previewCanvasRef.current;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!previewCanvas || !img || !canvas) return;

    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 256, 256);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 원본 이미지 기준의 크롭 좌표 계산
    const srcX = (crop.x / canvas.width) * img.naturalWidth;
    const srcY = (crop.y / canvas.height) * img.naturalHeight;
    const srcSize = (crop.size / canvas.width) * img.naturalWidth;

    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, 256, 256);
  }, [crop]);

  useEffect(() => {
    drawMainCanvas();
    drawPreview();
  }, [drawMainCanvas, drawPreview]);

  // 마우스 인터랙션 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const handleSize = 14;
    const isOverHandle =
      clickX >= crop.x + crop.size - handleSize &&
      clickX <= crop.x + crop.size + 4 &&
      clickY >= crop.y + crop.size - handleSize &&
      clickY <= crop.y + crop.size + 4;

    if (isOverHandle) {
      setIsDraggingResize(true);
      setDragStart({ x: clickX, y: clickY });
      setCropStart({ ...crop });
      return;
    }

    const isInsideCrop =
      clickX >= crop.x &&
      clickX <= crop.x + crop.size &&
      clickY >= crop.y &&
      clickY <= crop.y + crop.size;

    if (isInsideCrop) {
      setIsDraggingPos(true);
      setDragStart({ x: clickX, y: clickY });
      setCropStart({ ...crop });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (isDraggingResize) {
      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;
      const delta = Math.max(deltaX, deltaY); // 정사각형 비율 유지

      let newSize = cropStart.size + delta;
      newSize = Math.max(30, newSize);
      newSize = Math.min(newSize, canvas.width - cropStart.x, canvas.height - cropStart.y);

      setCrop((prev) => ({ ...prev, size: newSize }));
    } else if (isDraggingPos) {
      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;

      let newX = cropStart.x + deltaX;
      let newY = cropStart.y + deltaY;

      newX = Math.max(0, Math.min(newX, canvas.width - crop.size));
      newY = Math.max(0, Math.min(newY, canvas.height - crop.size));

      setCrop((prev) => ({ ...prev, x: newX, y: newY }));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingPos(false);
    setIsDraggingResize(false);
  };

  // 슬라이더로 크기 조절
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 중앙 기준 확대/축소
    const center = {
      x: crop.x + crop.size / 2,
      y: crop.y + crop.size / 2,
    };

    let newX = center.x - newSize / 2;
    let newY = center.y - newSize / 2;

    newX = Math.max(0, Math.min(newX, canvas.width - newSize));
    newY = Math.max(0, Math.min(newY, canvas.height - newSize));

    setCrop({
      x: newX,
      y: newY,
      size: newSize,
    });
  };

  // 256x256 PNG Data URL 생성 및 전달
  const handleApplyCrop = () => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    // 256x256 크기의 고품질 PNG Data URL 추출
    const croppedDataUrl = previewCanvas.toDataURL('image/png', 1.0);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  if (!isOpen || !imageSrc) return null;

  const maxCropSize = Math.min(canvasDim.width, canvasDim.height);

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div
        className="modal-container"
        style={{
          maxWidth: '680px',
          width: '95%',
          background: 'var(--bg-card)',
          padding: '20px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-main)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Crop size={18} color="var(--primary)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
              아바타 이미지 영역 자르기 (정사각형 크롭)
            </h4>
            {fileName && (
              <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: '#333', color: 'var(--text-sub)', borderRadius: '3px' }}>
                {fileName}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          선택 영역을 마우스로 드래그하여 이동하거나 우측 하단 핸들/슬라이더로 크기를 조절하세요.
          저장 시 최대 <strong>256x256 PNG</strong> 포맷으로 자동 변환 및 최적화됩니다.
        </p>

        {/* Content Layout */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Main Crop Canvas */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                overflow: 'hidden',
                background: '#1e1e1e',
                cursor: isDraggingPos ? 'move' : isDraggingResize ? 'nwse-resize' : 'crosshair',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
              }}
            >
              <canvas
                ref={canvasRef}
                width={canvasDim.width}
                height={canvasDim.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ display: 'block' }}
              />
            </div>

            {/* Crop Size Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: `${canvasDim.width}px` }}>
              <ZoomOut size={14} color="var(--text-muted)" />
              <input
                type="range"
                min={40}
                max={maxCropSize}
                value={Math.round(crop.size)}
                onChange={handleSliderChange}
                style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <ZoomIn size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)', minWidth: '45px', textAlign: 'right' }}>
                {Math.round(crop.size)}px
              </span>
            </div>
          </div>

          {/* Right Live Preview Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minWidth: '160px',
              padding: '12px',
              background: '#252526',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              실시간 미리보기
            </div>

            {/* Circle Avatar Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid var(--primary)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  background: '#1e1e1e',
                }}
              >
                <canvas
                  ref={previewCanvasRef}
                  width={256}
                  height={256}
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>원형 프로필 뷰</span>
            </div>

            {/* Small Size Previews */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-xs)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <img
                    src={previewCanvasRef.current?.toDataURL('image/png')}
                    alt="Preview 32"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>32px</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <img
                    src={previewCanvasRef.current?.toDataURL('image/png')}
                    alt="Preview 24"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>24px</span>
              </div>
            </div>

            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-sub)',
                background: '#1e1e1e',
                padding: '6px',
                borderRadius: '3px',
                lineHeight: 1.3,
              }}
            >
              ✓ 규격: 256x256 PNG<br />
              ✓ 용량: 초경량 고화질
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleApplyCrop}>
            <Check size={14} /> 256x256 크롭 적용
          </Button>
        </div>
      </div>
    </div>
  );
};
