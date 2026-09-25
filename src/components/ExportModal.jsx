import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Table, 
  CheckCircle2, 
  X, 
  Printer 
} from 'lucide-react';
import html2canvas from 'html2canvas';

export default function ExportModal({
  isOpen,
  onClose,
  lessonTitle,
  nodes,
  posts,
  students
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');

  if (!isOpen) return null;

  // 1. 고해상도 PNG 이미지로 저장
  const handleExportPng = async () => {
    setIsExporting(true);
    try {
      const element = document.querySelector('.workspace-layout');
      if (!element) return;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `${lessonTitle}_수업산출물_${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setExportSuccess('PNG 고해상도 이미지가 성공적으로 다운로드되었습니다.');
    } catch (err) {
      console.error(err);
      alert('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. CSV / 엑셀 데이터 내보내기
  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += '단계,학번,이름,학급,모둠,내용,좋아요수,댓글수,작성시간\n';

    posts.forEach((p) => {
      const linkedNode = nodes.find((n) => n.id === p.nodeId)?.title || '기타';
      const cleanContent = `"${(p.content || '').replace(/"/g, '""')}"`;
      csvContent += `${linkedNode},${p.studentNo},${p.authorName},${p.className},${p.group},${cleanContent},${p.likes},${p.comments.length},${p.createdAt}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${lessonTitle}_활동데이터.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportSuccess('CSV 활동 데이터가 성공적으로 다운로드되었습니다.');
  };

  // 3. 인쇄 및 PDF 저장 모달 창 열기
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={20} color="#4f46e5" />
            <span className="modal-title">수업 산출물 보관 및 포트폴리오 내보내기</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
            수업 중 학생들이 작성한 글, 손그림 산출물, 토의 내용을 생활기록부 작성 근거 및 평가 증빙용으로 다양한 형태로 일괄 보관합니다.
          </p>

          {exportSuccess && (
            <div style={{ padding: '0.6rem 1rem', background: '#ecfdf5', color: '#065f46', fontSize: '0.85rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} />
              <span>{exportSuccess}</span>
            </div>
          )}

          {/* 수업 요약 통계 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>설계된 흐름도</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5' }}>{nodes.length}개 단계</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>학생 산출물 카드</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{posts.length}건</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>참여 학생 수</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0ea5e9' }}>{students.length}명</div>
            </div>
          </div>

          {/* 내보내기 옵션 카드 3종 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 1. 고해상도 PNG */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ImageIcon size={24} color="#4f46e5" />
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>보드 전체 이미지 (PNG)</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>흐름도와 모든 학생 카드를 2배 고해상도 이미지로 캡처 저장</div>
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleExportPng}
                disabled={isExporting}
              >
                {isExporting ? '캡처 중...' : 'PNG 다운로드'}
              </button>
            </div>

            {/* 2. PDF 보고서 인쇄 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText size={24} color="#10b981" />
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>학생별 포트폴리오 보고서 (PDF)</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>수행평가 증빙 및 학교생활기록부 교과세특 참고용 보고서 인쇄/PDF 저장</div>
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handlePrintPdf}
              >
                <Printer size={14} /> PDF 인쇄
              </button>
            </div>

            {/* 3. CSV 데이터 시트 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Table size={24} color="#0ea5e9" />
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>활동 통계 데이터 (CSV/Excel)</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>학생별 작성 텍스트, 반응 수, 댓글 수 통계 엑셀 데이터 추출</div>
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleExportCsv}
              >
                CSV 저장
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
