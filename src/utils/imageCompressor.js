/**
 * 브라우저 캔버스를 이용한 클라이언트 사이드 초경량 이미지 압축 유틸
 * 고용량 사진(5~10MB)을 800px 내외, 70~120KB의 최적화된 WebP/JPEG 데이터로 압축하여
 * 유료 스토리지 없이 무료 Firestore에 직접 실시간 저장할 수 있도록 변환합니다.
 */
export async function compressImage(file, maxWidth = 900, maxHeight = 900, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 비율을 유지하면서 최대 너비/높이 제한
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 이미지 그리기 (부드러운 다운샘플링)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // WebP 우선 지원 시도 후 JPEG로 압축
        try {
          const compressedDataUrl = canvas.toDataURL('image/webp', quality);
          // 지원하지 않는 구형 브라우저에서 png가 나오는 경우 jpeg로 변환
          if (compressedDataUrl.startsWith('data:image/webp') && compressedDataUrl.length < 900000) {
            resolve(compressedDataUrl);
            return;
          }
        } catch {
          // ignore
        }

        const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
