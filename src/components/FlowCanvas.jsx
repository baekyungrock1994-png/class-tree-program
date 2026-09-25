import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  Sparkles, 
  Trash2, 
  Layers, 
  Activity, 
  CheckCircle2, 
  ArrowLeft, 
  ChevronRight, 
  ExternalLink,
  Link2,
  X,
  Pencil,
  EyeOff,
  BookOpen,
  LayoutGrid,
  GripHorizontal,
  Save,
  Check,
  RotateCcw,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  UploadCloud,
  Clock,
  Film
} from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

// =========================================================================
// Tarjan의 SCC(Strongly Connected Components) 알고리즘으로 사이클 검출
// =========================================================================
function findSCCs(nodeIds, outgoingMap) {
  let index = 0;
  const indices = {};
  const lowlink = {};
  const onStack = {};
  const stack = [];
  const sccs = [];

  function strongConnect(v) {
    indices[v] = index;
    lowlink[v] = index;
    index++;
    stack.push(v);
    onStack[v] = true;

    const neighbors = outgoingMap[v] || [];
    for (const w of neighbors) {
      if (indices[w] === undefined) {
        strongConnect(w);
        lowlink[v] = Math.min(lowlink[v], lowlink[w]);
      } else if (onStack[w]) {
        lowlink[v] = Math.min(lowlink[v], indices[w]);
      }
    }

    if (lowlink[v] === indices[v]) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack[w] = false;
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }

  for (const v of nodeIds) {
    if (indices[v] === undefined) {
      strongConnect(v);
    }
  }

  return sccs;
}

// =========================================================================
// 순환 구조(사이클)에서 '가장 왼쪽 카드'를 우선 시작점으로 삼아 회귀 화살표 분리
// =========================================================================
export function removeCycleReturnEdges(nodes, edges) {
  if (!nodes || nodes.length === 0 || !edges || edges.length === 0) {
    return { dagEdges: edges || [], returnEdges: [] };
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  // 유효한 간선 필터링 (자기 자신 루프는 회귀로 즉시 분리)
  let currentEdges = edges.filter(
    (e) => e.from && e.to && e.from !== e.to && nodeMap.has(e.from) && nodeMap.has(e.to)
  );
  const returnEdges = edges.filter(
    (e) => e.from && e.to && e.from === e.to && nodeMap.has(e.from)
  );

  const nodeIds = nodes.map((n) => n.id);
  let iterations = 0;
  const maxIterations = currentEdges.length + 2;

  while (iterations < maxIterations) {
    iterations++;

    const outgoing = {};
    nodeIds.forEach((id) => { outgoing[id] = []; });
    currentEdges.forEach((e) => {
      if (outgoing[e.from]) outgoing[e.from].push(e.to);
    });

    const sccs = findSCCs(nodeIds, outgoing);
    // 노드가 2개 이상인 순환 컴포넌트 추출
    const cycleSccs = sccs.filter((scc) => scc.length > 1);
    if (cycleSccs.length === 0) {
      break; // 모든 사이클이 해소되어 DAG 달성
    }

    let removedAny = false;
    for (const scc of cycleSccs) {
      const sccSet = new Set(scc);
      // 순환 구조 내부의 노드들 중 가장 왼쪽(x 오름차순, y 오름차순) 노드를 시작 노드로 선정
      const sccNodes = scc.map((id) => nodeMap.get(id)).filter(Boolean);
      sccNodes.sort((a, b) => (a.x - b.x) || (a.y - b.y));
      const leaderNode = sccNodes[0];

      if (leaderNode) {
        // 사이클 내부에서 시작(가장 왼쪽) 카드로 되돌아오는 회귀(return) 화살표를 분리
        const cycleReturnCandidates = currentEdges.filter(
          (e) => sccSet.has(e.from) && e.to === leaderNode.id
        );

        if (cycleReturnCandidates.length > 0) {
          cycleReturnCandidates.forEach((e) => returnEdges.push(e));
          currentEdges = currentEdges.filter(
            (e) => !(sccSet.has(e.from) && e.to === leaderNode.id)
          );
          removedAny = true;
        }
      }
    }

    // 만약 leaderNode로 직접 들어오는 간선이 아닐 경우(다중 루프 등) 방어 처리
    if (!removedAny) {
      const firstCycle = cycleSccs[0];
      const sccSet = new Set(firstCycle);
      const edgeToRemove = currentEdges.find((e) => sccSet.has(e.from) && sccSet.has(e.to));
      if (edgeToRemove) {
        returnEdges.push(edgeToRemove);
        currentEdges = currentEdges.filter((e) => e !== edgeToRemove);
      } else {
        break;
      }
    }
  }

  return { dagEdges: currentEdges, returnEdges };
}

// =========================================================================
// 유튜브 URL에서 비디오 ID 및 썸네일, 구간 텍스트 추출 유틸 함수
// =========================================================================
export function extractYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // 1. 순수 11자리 비디오 ID만 입력한 경우
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. youtube 정규식 (youtu.be, shorts/, live/, watch?v=, embed/)
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
  );
  if (match && match[1]) return match[1];

  // 3. 복잡한 쿼리스트링 URL 파싱
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const v = parsed.searchParams.get('v');
    if (v && v.length === 11) return v;
    // pathname 끝부분이 11자리인 경우 (예: /shorts/xxxx)
    const segments = parsed.pathname.split('/').filter(Boolean);
    const lastSeg = segments[segments.length - 1];
    if (lastSeg && lastSeg.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(lastSeg)) {
      return lastSeg;
    }
  } catch (_) {}

  return null;
}

export function buildYoutubeEmbedUrl(videoId, startMin, startSec, endMin, endSec) {
  if (!videoId) return '';
  const sMin = Number(startMin) || 0;
  const sSec = Number(startSec) || 0;
  const eMin = Number(endMin) || 0;
  const eSec = Number(endSec) || 0;
  const startTotal = sMin * 60 + sSec;
  const endTotal = eMin * 60 + eSec;

  const params = new URLSearchParams();
  params.set('autoplay', '1');
  params.set('rel', '0');
  params.set('modestbranding', '1');
  params.set('enablejsapi', '1');
  params.set('playsinline', '1');
  if (typeof window !== 'undefined' && window.location?.origin) {
    params.set('origin', window.location.origin);
  }
  if (startTotal > 0) params.set('start', String(startTotal));
  if (endTotal > 0 && endTotal > startTotal) params.set('end', String(endTotal));

  // youtube-nocookie.com 사용으로 쿠키 차단 및 토큰 오류에 의한 검은 화면 방지
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function buildYoutubeDirectUrl(videoId, startMin, startSec) {
  if (!videoId) return '';
  const sMin = Number(startMin) || 0;
  const sSec = Number(startSec) || 0;
  const startTotal = sMin * 60 + sSec;
  return `https://www.youtube.com/watch?v=${videoId}${startTotal > 0 ? `&t=${startTotal}s` : ''}`;
}

export function formatTimeSegment(startMin, startSec, endMin, endSec) {
  const sMin = Number(startMin) || 0;
  const sSec = Number(startSec) || 0;
  const eMin = Number(endMin) || 0;
  const eSec = Number(endSec) || 0;
  const hasStart = sMin > 0 || sSec > 0;
  const hasEnd = eMin > 0 || eSec > 0;
  if (!hasStart && !hasEnd) return null;
  const startStr = `${String(sMin).padStart(2, '0')}:${String(sSec).padStart(2, '0')}`;
  const endStr = hasEnd ? `${String(eMin).padStart(2, '0')}:${String(eSec).padStart(2, '0')}` : '끝까지';
  return `${startStr} ~ ${endStr}`;
}

// =========================================================================
// 화살표(edges) 연결 기반 위상 정렬 및 단계/분기(2-1, 2-2) 번호 계산
// (순환 구조 시 가장 왼쪽에 있는 카드가 우선이 되어 회귀 요약)
// =========================================================================
export function computeFlowGraph(nodes, edges) {
  if (!nodes || nodes.length === 0) return [];

  // 화살표가 하나도 없는 경우: x 좌표 순(왼쪽->오른쪽)으로 1, 2, 3... 단순 정렬
  if (!edges || edges.length === 0) {
    const sorted = [...nodes].sort((a, b) => (a.x - b.x) || (a.y - b.y));
    const res = sorted.map((n, idx) => ({
      ...n,
      stepDepth: idx + 1,
      stepLabel: `${idx + 1}`,
      branchIndex: 1,
      totalInStage: 1,
      hasReturnLoop: false
    }));
    res.hasCycleReturn = false;
    res.returnEdges = [];
    return res;
  }

  // 순환 구조가 있다면 가장 왼쪽 카드가 우선이 되도록 회귀 화살표를 분리하여 DAG 변환
  const { dagEdges, returnEdges } = removeCycleReturnEdges(nodes, edges);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = {};
  const incoming = {};

  nodes.forEach((n) => {
    outgoing[n.id] = [];
    incoming[n.id] = [];
  });

  dagEdges.forEach((e) => {
    if (outgoing[e.from] && incoming[e.to]) {
      outgoing[e.from].push(e.to);
      incoming[e.to].push(e.from);
    }
  });

  // 위쪽부터 2-1, 2-2가 부여되도록 자식 노드들을 y 좌표 오름차순(위->아래)으로 정렬
  nodes.forEach((n) => {
    outgoing[n.id].sort((aId, bId) => {
      const nodeA = nodeMap.get(aId);
      const nodeB = nodeMap.get(bId);
      return (nodeA?.y || 0) - (nodeB?.y || 0);
    });
  });

  // 시작 노드(들어오는 화살표가 없는 노드)
  // 가장 왼쪽 카드가 우선되도록 (x 오름차순, y 오름차순) 정렬
  let roots = nodes.filter((n) => incoming[n.id].length === 0);
  roots.sort((a, b) => (a.x - b.x) || (a.y - b.y));

  if (roots.length === 0) {
    roots = [...nodes].sort((a, b) => (a.x - b.x) || (a.y - b.y));
  }

  // 각 노드의 깊이(단계 레벨, 1부터 시작) 계산
  const depth = {};
  roots.forEach((r) => {
    depth[r.id] = 1;
  });

  // 화살표를 따라 깊이 전파 (최대 경로 길이 기준)
  let changed = true;
  let iterations = 0;
  while (changed && iterations < nodes.length * 2) {
    changed = false;
    iterations++;
    dagEdges.forEach((e) => {
      if (depth[e.from] !== undefined) {
        const targetDepth = depth[e.from] + 1;
        if (depth[e.to] === undefined || targetDepth > depth[e.to]) {
          depth[e.to] = targetDepth;
          changed = true;
        }
      }
    });
  }

  // 시작점과 연결되지 않은 고립 노드들 순차 배치 (왼쪽->오른쪽 순서 보장)
  const unreachedNodes = nodes.filter((n) => depth[n.id] === undefined);
  unreachedNodes.sort((a, b) => (a.x - b.x) || (a.y - b.y));

  let maxFoundDepth = Math.max(...Object.values(depth), 0);
  unreachedNodes.forEach((n) => {
    maxFoundDepth += 1;
    depth[n.id] = maxFoundDepth;
  });

  // 깊이(단계)별로 그룹화
  const depthGroups = {};
  nodes.forEach((n) => {
    const d = depth[n.id];
    if (!depthGroups[d]) depthGroups[d] = [];
    depthGroups[d].push(n);
  });

  const sortedDepths = Object.keys(depthGroups).map(Number).sort((a, b) => a - b);
  const resultNodes = [];

  sortedDepths.forEach((d) => {
    const group = depthGroups[d];

    // 같은 깊이 내 노드 정렬:
    // 1. 부모 노드의 선행 순서
    // 2. y 좌표 오름차순 (위쪽이 2-1, 아래쪽이 2-2)
    group.sort((a, b) => {
      const aParents = incoming[a.id] || [];
      const bParents = incoming[b.id] || [];
      const aParentIndex = aParents.length > 0
        ? Math.min(...aParents.map((pId) => resultNodes.findIndex((rn) => rn.id === pId)).filter((i) => i >= 0))
        : 9999;
      const bParentIndex = bParents.length > 0
        ? Math.min(...bParents.map((pId) => resultNodes.findIndex((rn) => rn.id === pId)).filter((i) => i >= 0))
        : 9999;

      if (aParentIndex !== bParentIndex) {
        return aParentIndex - bParentIndex;
      }
      return (a.y || 0) - (b.y || 0);
    });

    const isBranch = group.length > 1;
    group.forEach((node, idx) => {
      const stepLabel = isBranch ? `${d}-${idx + 1}` : `${d}`;
      resultNodes.push({
        ...node,
        stepDepth: d,
        stepLabel,
        branchIndex: idx + 1,
        totalInStage: group.length,
        hasReturnLoop: returnEdges.some((re) => re.from === node.id)
      });
    });
  });

  resultNodes.hasCycleReturn = returnEdges.length > 0;
  resultNodes.returnEdges = returnEdges;

  return resultNodes;
}

export default function FlowCanvas({
  nodes = [],
  setNodes,
  edges = [],
  setEdges,
  currentRole,
  canModify = true,
  activeStageId,
  setActiveStageId,
  liveStageId,
  setLiveStageId,
  posts = [],
  isMinimized = false,
  onOpenCanvas,
  onBackToOverview,
  onSaveBoard
}) {
  const isTeacher = (currentRole === 'teacher' || currentRole === 'admin') && canModify;
  // 화살표와 노드로부터 동적으로 계산된 위상 순서 및 2-1, 2-2 분기 라벨
  const orderedNodes = useMemo(() => computeFlowGraph(nodes, edges), [nodes, edges]);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (onSaveBoard) {
      onSaveBoard();
      setIsSavedRecently(true);
      setTimeout(() => {
        setIsSavedRecently(false);
      }, 2000);
    }
  };
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragInfoRef = useRef({ startX: 0, startY: 0, isDragging: false });

  // 화살표 자유 연결 시스템 상태
  const [connectingFromId, setConnectingFromId] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const [zoomedStageNode, setZoomedStageNode] = useState(null);
  const [zoomedModalOffset, setZoomedModalOffset] = useState({ x: 0, y: 0 });
  const [isDraggingZoomedModal, setIsDraggingZoomedModal] = useState(false);
  const isDraggingZoomedModalRef = useRef(false);
  const zoomedDragStartRef = useRef({ startX: 0, startY: 0, initOffsetX: 0, initOffsetY: 0 });

  // 확대 카드 모달 드래그 핸들러
  const handleZoomedModalMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;

    isDraggingZoomedModalRef.current = true;
    setIsDraggingZoomedModal(true);
    zoomedDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initOffsetX: zoomedModalOffset.x,
      initOffsetY: zoomedModalOffset.y
    };

    const handleWindowMouseMove = (moveEvent) => {
      if (!isDraggingZoomedModalRef.current) return;
      const dx = moveEvent.clientX - zoomedDragStartRef.current.startX;
      const dy = moveEvent.clientY - zoomedDragStartRef.current.startY;
      setZoomedModalOffset({
        x: zoomedDragStartRef.current.initOffsetX + dx,
        y: zoomedDragStartRef.current.initOffsetY + dy
      });
    };

    const handleWindowMouseUp = () => {
      isDraggingZoomedModalRef.current = false;
      setIsDraggingZoomedModal(false);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // New Node Form
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [newNodeHasCanvas, setNewNodeHasCanvas] = useState(true);
  const [newNodeMediaTypeTab, setNewNodeMediaTypeTab] = useState('none'); // 'none' | 'image' | 'video'
  const [newNodeImageUrl, setNewNodeImageUrl] = useState('');
  const [newNodeVideoUrl, setNewNodeVideoUrl] = useState('');
  const [newNodeVideoStartMin, setNewNodeVideoStartMin] = useState('');
  const [newNodeVideoStartSec, setNewNodeVideoStartSec] = useState('');
  const [newNodeVideoEndMin, setNewNodeVideoEndMin] = useState('');
  const [newNodeVideoEndSec, setNewNodeVideoEndSec] = useState('');

  // Edit Node Form
  const [editingNode, setEditingNode] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editHasCanvas, setEditHasCanvas] = useState(true);
  const [editMediaTypeTab, setEditMediaTypeTab] = useState('none'); // 'none' | 'image' | 'video'
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editVideoStartMin, setEditVideoStartMin] = useState('');
  const [editVideoStartSec, setEditVideoStartSec] = useState('');
  const [editVideoEndMin, setEditVideoEndMin] = useState('');
  const [editVideoEndSec, setEditVideoEndSec] = useState('');

  // 동영상 구간 재생 팝업 모달 상태
  const [playingVideoNode, setPlayingVideoNode] = useState(null);

  const canvasRef = useRef(null);

  // Node Dragging Handlers
  const handleMouseDown = (e, node) => {
    if (!isTeacher || isMinimized) return;
    // 화살표 연결 모드 중일 때는 드래그를 전혀 시작하지 않음 (클릭 보장)
    if (connectingFromId) return;
    // 버튼, 아이콘 등 클릭 시에는 드래그 방지
    if (e.target.closest('button') || e.target.closest('a')) return;

    setDraggingNodeId(node.id);
    dragInfoRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      isDragging: false
    };

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    // 캔버스 내 마우스 좌표 갱신 (화살표 가이드 라인용)
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - canvasRect.left + canvasRef.current.scrollLeft,
        y: e.clientY - canvasRect.top + canvasRef.current.scrollTop
      });
    }

    if (!draggingNodeId || !canvasRef.current || isMinimized) return;

    // 5px 이상 이동했을 때만 실제 드래그로 판정
    const dist = Math.hypot(
      e.clientX - dragInfoRef.current.startX,
      e.clientY - dragInfoRef.current.startY
    );
    if (dist < 5 && !dragInfoRef.current.isDragging) {
      return;
    }

    dragInfoRef.current.isDragging = true;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(20, Math.min(3000, e.clientX - canvasRect.left + canvasRef.current.scrollLeft - dragOffset.x));
    const newY = Math.max(70, Math.min(1200, e.clientY - canvasRect.top + canvasRef.current.scrollTop - dragOffset.y));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
    );
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setTimeout(() => {
      dragInfoRef.current.isDragging = false;
    }, 60);
  };

  // 화살표 연결 도트 클릭 처리
  const handleToggleConnect = (e, nodeId) => {
    e.stopPropagation();
    if (!connectingFromId) {
      setConnectingFromId(nodeId);
    } else if (connectingFromId === nodeId) {
      setConnectingFromId(null);
    } else {
      toggleEdge(connectingFromId, nodeId);
      setConnectingFromId(null);
    }
  };

  // 노드 카드 클릭 시
  const handleNodeClick = (e, node) => {
    e.stopPropagation();

    // 실제 드래그 이동을 한 직후의 클릭이면 무시
    if (dragInfoRef.current.isDragging) {
      return;
    }

    // 1. 화살표 연결 모드일 때: 클릭한 대상 카드와 즉시 연결
    if (connectingFromId) {
      if (connectingFromId !== node.id) {
        toggleEdge(connectingFromId, node.id);
      }
      setConnectingFromId(null);
      return;
    }

    // 2. 일반 모드일 때: 활성 카드 선택 & 중앙 확대 모달 열기
    setActiveStageId(node.id);
    setZoomedStageNode(node);
    setZoomedModalOffset({ x: 0, y: 0 });
  };

  // 엣지 추가 / 삭제 토글 (함수형 업데이트로 최신 상태 보장)
  const toggleEdge = (fromId, toId) => {
    setEdges((prevEdges) => {
      const exists = prevEdges.some((edge) => edge.from === fromId && edge.to === toId);
      if (exists) {
        return prevEdges.filter((edge) => !(edge.from === fromId && edge.to === toId));
      } else {
        return [...prevEdges, { from: fromId, to: toId }];
      }
    });
  };

  // 화살표(선) 직접 클릭하여 삭제
  const handleDeleteEdge = (e, index) => {
    e.stopPropagation();
    if (!isTeacher) return;
    setEdges((prevEdges) => prevEdges.filter((_, idx) => idx !== index));
  };

  // Add Manual Node
  const handleCreateNode = (e) => {
    e.preventDefault();
    if (!newNodeTitle.trim()) return;

    const nextStep = nodes.length + 1;
    const lastNode = nodes[nodes.length - 1];
    const newX = lastNode ? lastNode.x + 320 : 40;
    const newY = lastNode ? lastNode.y : 90;

    const newNode = {
      id: `node-${Date.now()}`,
      stepNumber: nextStep,
      title: `${nextStep}. ${newNodeTitle}`,
      description: newNodeDesc,
      imageUrl: newNodeMediaTypeTab === 'image' ? (newNodeImageUrl || null) : null,
      videoUrl: newNodeMediaTypeTab === 'video' ? (newNodeVideoUrl || null) : null,
      videoStartMin: newNodeMediaTypeTab === 'video' ? newNodeVideoStartMin : '',
      videoStartSec: newNodeMediaTypeTab === 'video' ? newNodeVideoStartSec : '',
      videoEndMin: newNodeMediaTypeTab === 'video' ? newNodeVideoEndMin : '',
      videoEndSec: newNodeMediaTypeTab === 'video' ? newNodeVideoEndSec : '',
      x: newX,
      y: newY,
      color: '#4f46e5',
      hasCanvas: newNodeHasCanvas,
      canvasSections: ['학생 발표', '선생님 자료'],
      boardStatus: 'open'
    };

    setNodes([...nodes, newNode]);
    if (lastNode) {
      setEdges([...edges, { from: lastNode.id, to: newNode.id }]);
    }
    setNewNodeTitle('');
    setNewNodeDesc('');
    setNewNodeHasCanvas(true);
    setNewNodeImageUrl('');
    setNewNodeVideoUrl('');
    setNewNodeVideoStartMin('');
    setNewNodeVideoStartSec('');
    setNewNodeVideoEndMin('');
    setNewNodeVideoEndSec('');
    setNewNodeMediaTypeTab('none');
    setShowAddModal(false);
  };

  // Run AI Generation
  const handleRunAiGeneration = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      setShowAiModal(false);

      const generatedNodes = [
        {
          id: 'node-ai-1',
          stepNumber: 1,
          title: '1. 기압과 바람의 발생 (AI)',
          description: '기압차가 생길 때 고기압에서 저기압으로 공기가 밀려나가는 바람의 원리 탐구',
          category: '관찰·탐구',
          x: 40,
          y: 90,
          color: '#10b981',
          hasCanvas: true,
          canvasSections: ['학생 발표', '선생님 자료'],
          boardStatus: 'open'
        },
        {
          id: 'node-ai-2',
          stepNumber: 2,
          title: '2. 계절별 바람의 특징 (AI)',
          description: '우리나라 여름철(남동풍)과 겨울철(북서풍)의 성질과 대륙/해양의 온도차 비교',
          category: '실험·원리',
          x: 360,
          y: 90,
          color: '#0ea5e9',
          hasCanvas: true,
          canvasSections: ['학생 발표', '선생님 자료'],
          boardStatus: 'open'
        },
        {
          id: 'node-ai-3',
          stepNumber: 3,
          title: '3. 생활 속 바람의 활용 (AI)',
          description: '풍력 발전, 전통 가옥 구조 등 날씨와 바람을 슬기롭게 이용한 사례 토의',
          category: '융합·토의',
          x: 680,
          y: 90,
          color: '#f59e0b',
          hasCanvas: true,
          canvasSections: ['학생 발표', '선생님 자료'],
          boardStatus: 'open'
        }
      ];

      setNodes(generatedNodes);
      setEdges([
        { from: 'node-ai-1', to: 'node-ai-2' },
        { from: 'node-ai-2', to: 'node-ai-3' }
      ]);
      setActiveStageId('node-ai-1');
      setLiveStageId('node-ai-1');
    }, 1000);
  };

  // Node Deletion
  const handleDeleteNode = (nodeId) => {
    if (nodes.length <= 1) return alert('최소 1개 이상의 노드가 필요합니다.');
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setEdges(edges.filter((e) => e.from !== nodeId && e.to !== nodeId));
    if (activeStageId === nodeId) {
      const remaining = nodes.filter((n) => n.id !== nodeId);
      if (remaining.length > 0) setActiveStageId(remaining[0].id);
    }
  };

  // Node Editing
  const handleOpenEditModal = (node) => {
    setEditingNode(node);
    setEditTitle(node.title || '');
    setEditDesc(node.description || '');
    setEditHasCanvas(node.hasCanvas !== false);
    setEditImageUrl(node.imageUrl || '');
    setEditVideoUrl(node.videoUrl || '');
    setEditVideoStartMin(node.videoStartMin ?? '');
    setEditVideoStartSec(node.videoStartSec ?? '');
    setEditVideoEndMin(node.videoEndMin ?? '');
    setEditVideoEndSec(node.videoEndSec ?? '');
    setEditMediaTypeTab(node.videoUrl ? 'video' : node.imageUrl ? 'image' : 'none');
  };

  const handleSaveEditNode = (e) => {
    e.preventDefault();
    if (!editingNode || !editTitle.trim()) return;

    setNodes((prevNodes) =>
      prevNodes.map((n) =>
        n.id === editingNode.id
          ? {
              ...n,
              title: editTitle.trim(),
              description: editDesc.trim(),
              hasCanvas: editHasCanvas,
              imageUrl: editMediaTypeTab === 'image' ? (editImageUrl || null) : null,
              videoUrl: editMediaTypeTab === 'video' ? (editVideoUrl || null) : null,
              videoStartMin: editMediaTypeTab === 'video' ? editVideoStartMin : '',
              videoStartSec: editMediaTypeTab === 'video' ? editVideoStartSec : '',
              videoEndMin: editMediaTypeTab === 'video' ? editVideoEndMin : '',
              videoEndSec: editMediaTypeTab === 'video' ? editVideoEndSec : ''
            }
          : n
      )
    );

    setEditingNode(null);
  };

  // 이미지 파일 업로드 (무료 Firestore 직접 저장을 위한 초경량 자동 압축)
  const handleImageFileChange = async (e, isEdit) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 900, 900, 0.75);
      if (compressed) {
        if (isEdit) {
          setEditImageUrl(compressed);
          setEditMediaTypeTab('image');
        } else {
          setNewNodeImageUrl(compressed);
          setNewNodeMediaTypeTab('image');
        }
        return;
      }
    } catch (err) {
      console.warn('이미지 압축 오류 (기본 로드 대체):', err);
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result;
      if (isEdit) {
        setEditImageUrl(base64);
        setEditMediaTypeTab('image');
      } else {
        setNewNodeImageUrl(base64);
        setNewNodeMediaTypeTab('image');
      }
    };
    reader.readAsDataURL(file);
  };

  // 교사용: 카드별 캔버스 활성화/비활성화 원클릭 토글
  const handleToggleNodeCanvas = (e, nodeId) => {
    e.stopPropagation();
    if (currentRole !== 'teacher') return;
    setNodes((prevNodes) =>
      prevNodes.map((n) =>
        n.id === nodeId
          ? { ...n, hasCanvas: n.hasCanvas === false ? true : false }
          : n
      )
    );
  };

  // =========================================================================
  // 최소화 모드 (상단 콤팩트 바)
  // =========================================================================
  if (isMinimized) {
    const currentNode = nodes.find((n) => n.id === activeStageId) || nodes[0];

    return (
      <div className="minimized-flow-bar">
        {/* 전체 흐름도 복귀 버튼 */}
        <button 
          className="back-to-flow-btn"
          onClick={onBackToOverview}
          title="지식 흐름도 전체 화면으로 돌아가기"
        >
          <ArrowLeft size={14} />
          <span>전체 흐름도 보기</span>
        </button>

        {/* 단계 전환 칩 목록 (화살표 연결 및 2-1, 2-2 분기 순서 실시간 반영) */}
        <div className="flow-step-chips">
          {orderedNodes.map((node, index) => {
            const isCurrent = node.id === activeStageId;
            const isLive = node.id === liveStageId;
            const hasCanvas = node.hasCanvas !== false;
            const nextNode = orderedNodes[index + 1];
            const showArrow = nextNode && (node.stepDepth !== nextNode.stepDepth);
            const isParallel = nextNode && (node.stepDepth === nextNode.stepDepth);

            return (
              <React.Fragment key={node.id}>
                <button
                  className={`flow-chip ${isCurrent ? 'active' : ''} ${isLive ? 'live-chip' : ''} ${!hasCanvas ? 'no-canvas-chip' : ''}`}
                  onClick={() => setActiveStageId(node.id)}
                  title={!hasCanvas ? `${node.title} (캔버스 미사용 단계)` : node.title}
                >
                  <span className="flow-chip-num">{node.stepLabel}</span>
                  <span className="flow-chip-title">
                    {node.title.replace(/^\d+([-\.]\d+)?[\.\s]\s*/, '')}
                    {!hasCanvas && <span className="chip-no-canvas-tag">안내</span>}
                  </span>
                  {isLive && <span className="chip-live-dot" title="선생님 진행중"></span>}
                </button>
                {showArrow && (
                  <span className="chip-arrow"><ChevronRight size={13} /></span>
                )}
                {isParallel && (
                  <span className="chip-branch-sep" title="동일 단계 선택 분기">/</span>
                )}
              </React.Fragment>
            );
          })}

          {/* 순환 회귀 수업인 경우 요약 바 끝에 순환 표시 뱃지 */}
          {orderedNodes.hasCycleReturn && (
            <button 
              className="chip-cycle-badge" 
              onClick={() => {
                if (orderedNodes.length > 0) {
                  setActiveStageId(orderedNodes[0].id);
                }
              }}
              title="처음 1단계로 다시 회귀하는 순환구조 수업 (클릭 시 1단계로 이동)"
            >
              <RotateCcw size={12} />
              <span>1단계로 순환 회귀</span>
            </button>
          )}
        </div>

        {/* 라이브 진도 맞추기 버튼 (교사용/관리자용) */}
        {isTeacher && currentNode && (
          <div className="minimized-actions">
            <button
              className={`btn btn-sm ${currentNode.id === liveStageId ? 'btn-live-active' : 'btn-sync-action'}`}
              onClick={() => setLiveStageId(currentNode.id)}
              title="현재 보고 있는 단계를 전체 학생의 실시간 화면으로 전송"
            >
              {currentNode.id === liveStageId ? '🟢 학생 화면 동기화 중' : '👉 이 단계로 학생 진도 맞추기'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 첫 화면 (전체 지식 흐름도 단독 표시)
  // =========================================================================
  const currentZoomedNode = zoomedStageNode 
    ? (nodes.find((n) => n.id === zoomedStageNode.id) || zoomedStageNode)
    : null;

  return (
    <div 
      className="flow-canvas-wrapper full-overview" 
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => {
        if (connectingFromId) setConnectingFromId(null);
      }}
    >
      {/* 1, 2, 3번 요구사항 반영 툴바: 정돈된 뒤로가기 스타일 버튼, 텍스트/뱃지 제거 */}
      <div className="flow-canvas-toolbar">
        {isTeacher ? (
          <div className="flow-toolbar-left">
            <button 
              className="btn-flow-clean"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={14} /> 카드 추가
            </button>
            <button 
              className="btn-flow-clean"
              onClick={() => setShowAiModal(true)}
            >
              <Sparkles size={14} /> AI 교재 흐름도 생성
            </button>
          </div>
        ) : (
          currentRole === 'teacher' && (
            <div className="flow-toolbar-left">
              <span className="readonly-permission-badge" style={{ padding: '6px 12px' }}>
                👁️ 다른 교사 수업 참관 중 (열람 전용 - 수정/삭제 제한)
              </span>
            </div>
          )
        )}

        {/* 화살표 연결 안내 뱃지 (연결 중일 때만 표시) */}
        {connectingFromId && (
          <div className="connecting-guide-pill">
            <Link2 size={13} />
            <span>화살표를 연결할 대상 카드를 클릭하세요</span>
            <button 
              className="connecting-cancel-btn"
              onClick={(e) => {
                e.stopPropagation();
                setConnectingFromId(null);
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* 오른쪽 끝에 배치되는 흐름도 저장 버튼 */}
        {isTeacher && onSaveBoard && (
          <div className="flow-toolbar-right">
            <button
              className={`btn-flow-save ${isSavedRecently ? 'saved' : ''}`}
              onClick={handleSaveClick}
              title="현재 변경된 흐름도 단계, 연결 화살표, 위치를 차시에 저장"
            >
              {isSavedRecently ? (
                <>
                  <Check size={14} />
                  <span>저장 완료!</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>흐름도 저장</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 노드 연결 화살표 SVG (선 클릭 시 삭제 가능) */}
      <svg className="flow-edges-svg" width="3500" height="1500">
        <defs>
          <marker 
            id="flow-arrow" 
            viewBox="0 0 10 10" 
            refX="7" 
            refY="5" 
            markerWidth="7" 
            markerHeight="7" 
            orient="auto"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366f1" />
          </marker>
          <marker 
            id="flow-arrow-active" 
            viewBox="0 0 10 10" 
            refX="7" 
            refY="5" 
            markerWidth="8" 
            markerHeight="8" 
            orient="auto"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4f46e5" />
          </marker>
        </defs>

        {/* 기존 연결된 화살표 목록 */}
        {edges.map((edge, idx) => {
          const fromNode = nodes.find((n) => n.id === edge.from);
          const toNode = nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const isFromLeft = fromNode.x + 200 < toNode.x;
          const isFromRight = fromNode.x > toNode.x + 200;

          let startX, startY, endX, endY, c1x, c1y, c2x, c2y;

          if (isFromLeft) {
            startX = fromNode.x + 275;
            startY = fromNode.y + 75;
            endX = toNode.x;
            endY = toNode.y + 75;
            const dx = Math.max(30, (endX - startX) * 0.5);
            c1x = startX + dx;
            c1y = startY;
            c2x = endX - dx;
            c2y = endY;
          } else if (isFromRight) {
            startX = fromNode.x;
            startY = fromNode.y + 75;
            endX = toNode.x + 275;
            endY = toNode.y + 75;
            const dx = Math.max(30, (startX - endX) * 0.5);
            c1x = startX - dx;
            c1y = startY;
            c2x = endX + dx;
            c2y = endY;
          } else {
            const isFromAbove = fromNode.y < toNode.y;
            startX = fromNode.x + 137;
            startY = isFromAbove ? fromNode.y + 150 : fromNode.y;
            endX = toNode.x + 137;
            endY = isFromAbove ? toNode.y : toNode.y + 150;
            const dy = Math.max(30, Math.abs(endY - startY) * 0.5);
            c1x = startX;
            c1y = isFromAbove ? startY + dy : startY - dy;
            c2x = endX;
            c2y = isFromAbove ? endY - dy : endY + dy;
          }

          const pathD = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;

          return (
            <g key={`${edge.from}-${edge.to}-${idx}`} className="flow-edge-group">
              {/* 클릭 감지용 투명 넓은 패스 */}
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth="18"
                style={{ cursor: isTeacher ? 'pointer' : 'default' }}
                onClick={(e) => handleDeleteEdge(e, idx)}
              >
                <title>클릭하여 화살표 연결 삭제</title>
              </path>
              {/* 실제 보이는 화살표 라인 */}
              <path
                d={pathD}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeDasharray="5 4"
                markerEnd="url(#flow-arrow)"
                className="edge-visible-path"
              />
            </g>
          );
        })}

        {/* 연결 중일 때 마우스 커서를 따라가는 실시간 가이드 화살표 */}
        {connectingFromId && (() => {
          const fromNode = nodes.find((n) => n.id === connectingFromId);
          if (!fromNode) return null;
          const startX = fromNode.x + 275;
          const startY = fromNode.y + 75;
          return (
            <path
              d={`M ${startX} ${startY} L ${mousePos.x} ${mousePos.y}`}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              markerEnd="url(#flow-arrow-active)"
              className="temp-connecting-line"
            />
          );
        })()}
      </svg>

      {/* 노드 카드 목록 */}
      <div className="flow-nodes-container">
        {nodes.map((node) => {
          const isCurrentActive = node.id === activeStageId;
          const isLive = node.id === liveStageId;
          const isConnectingSource = connectingFromId === node.id;
          const isConnectingCandidate = connectingFromId && connectingFromId !== node.id;
          const nodePostsCount = posts.filter((p) => p.nodeId === node.id).length;

          return (
            <div
              key={node.id}
              className={`flow-stage-card ${draggingNodeId === node.id ? 'is-dragging' : ''} ${isLive ? 'is-live-step' : ''} ${isCurrentActive ? 'is-active-view' : ''} ${isConnectingSource ? 'connecting-source' : ''} ${isConnectingCandidate ? 'connecting-candidate' : ''}`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`
              }}
              onMouseDown={(e) => handleMouseDown(e, node)}
              onClick={(e) => handleNodeClick(e, node)}
            >
              {/* 교사/관리자용 화살표 연결 도트 핸들 (카드 오른쪽 바깥) */}
              {isTeacher && (
                <button
                  className={`node-connector-handle ${isConnectingSource ? 'active' : ''}`}
                  onClick={(e) => handleToggleConnect(e, node.id)}
                  title={isConnectingSource ? '연결 취소' : '다른 카드와 화살표 연결하기'}
                >
                  <Link2 size={12} />
                </button>
              )}

              {/* 헤더: 진행중 상태 및 교사 작업 버튼 */}
              <div className="stage-card-header">
                <div className="stage-header-status">
                  {isLive && (
                    <span className="stage-live-badge">
                      <Activity size={13} /> 진행중
                    </span>
                  )}
                </div>

                <div className="stage-header-actions">
                  {isLive && (
                    <span className="stage-live-badge">
                      <Activity size={13} /> 진행중
                    </span>
                  )}
                  {isTeacher && (
                    <div className="stage-teacher-actions">
                      <button
                        className="stage-card-action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(node);
                        }}
                        title="단계 내용 수정"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="stage-card-action-btn trash"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                        title="단계 삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 본문 (드래그 핸들 역할) */}
              <div className="stage-card-body">
                <strong className="stage-card-title">{node.title}</strong>
                <p className="stage-card-desc">{node.description}</p>

                {/* 첨부된 사진 미리보기 */}
                {node.imageUrl && (
                  <div className="stage-card-media-wrap" onClick={(e) => e.stopPropagation()}>
                    <img 
                      src={node.imageUrl} 
                      alt={node.title} 
                      className="stage-card-img-thumb"
                      onClick={() => {
                        setActiveStageId(node.id);
                        setZoomedStageNode(node);
                      }}
                      title="클릭하여 크게 보기"
                    />
                  </div>
                )}

                {/* 첨부된 영상 썸네일 & 구간 재생 배지 */}
                {node.videoUrl && (() => {
                  const videoId = extractYoutubeId(node.videoUrl);
                  const thumbUrl = videoId 
                    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` 
                    : null;
                  const timeSegmentText = formatTimeSegment(
                    node.videoStartMin,
                    node.videoStartSec,
                    node.videoEndMin,
                    node.videoEndSec
                  );

                  return (
                    <div 
                      className="stage-card-media-wrap"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingVideoNode(node);
                      }}
                      title="클릭하여 영상 구간 재생"
                    >
                      <div className="stage-card-video-thumb-container">
                        {thumbUrl ? (
                          <img src={thumbUrl} alt="동영상 썸네일" className="stage-card-video-thumb" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b', color: '#94a3b8' }}>
                            <Film size={24} />
                          </div>
                        )}
                        <div className="stage-card-video-overlay">
                          <div className="stage-card-video-top-tag">
                            <span className="stage-video-label-tag">수업 영상</span>
                          </div>
                          <div className="stage-card-video-play-center">
                            <Play size={18} fill="white" />
                          </div>
                          <div className="stage-card-video-bottom-tags">
                            {timeSegmentText ? (
                              <span className="stage-video-time-tag">
                                <Clock size={11} /> {timeSegmentText}
                              </span>
                            ) : (
                              <span className="stage-video-time-tag">전체 영상</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 하단: 학생글 수 & 진도맞추기 버튼 */}
              <div className="stage-card-footer">
                <div className="stage-post-counter">
                  <Layers size={13} />
                  <span>학생글 {nodePostsCount}개</span>
                </div>

                <div className="stage-action-wrap">
                  {isTeacher ? (
                    <button
                      className={`stage-sync-btn ${isLive ? 'live' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLiveStageId(node.id);
                        setActiveStageId(node.id);
                      }}
                      title={isLive ? '현재 실시간으로 진행 중인 단계입니다' : '전체 학생 화면을 이 단계로 즉시 동기화'}
                    >
                      {isLive ? '진행 중' : '진도 맞추기'}
                    </button>
                  ) : (
                    isLive && (
                      <span className="student-current-indicator">
                        <CheckCircle2 size={13} color="#10b981" /> 우리 반 활동 중
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* 카드별 캔버스 열기 (교사 활성화 여부에 따라 제어) */}
              {node.hasCanvas !== false ? (
                <div className="stage-card-canvas-bar">
                  <button
                    className="stage-card-enter-prompt-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveStageId(node.id);
                      if (onOpenCanvas) onOpenCanvas(node.id);
                    }}
                    title={`${node.title} 캔버스 열기`}
                  >
                    <span>캔버스 열기</span>
                    <ExternalLink size={12} />
                  </button>
                  {isTeacher && (
                    <button
                      type="button"
                      className="stage-card-canvas-toggle-btn on"
                      onClick={(e) => handleToggleNodeCanvas(e, node.id)}
                      title="이 카드의 캔버스 열기 기능 끄기 (학생 진입 차단)"
                    >
                      <LayoutGrid size={11} />
                      <span>끄기</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="stage-card-canvas-bar disabled">
                  {isTeacher ? (
                    <>
                      <div className="stage-card-no-canvas-guide" title="현재 학생들에게 캔버스 열기 버튼이 숨겨져 있습니다.">
                        <EyeOff size={12} />
                        <span>캔버스 꺼짐 (안내 전용)</span>
                      </div>
                      <button
                        type="button"
                        className="stage-card-canvas-toggle-btn off"
                        onClick={(e) => handleToggleNodeCanvas(e, node.id)}
                        title="이 카드에 캔버스 열기 기능 활성화"
                      >
                        <Plus size={11} />
                        <span>캔버스 켜기</span>
                      </button>
                    </>
                  ) : (
                    <div className="stage-card-no-canvas-student" title="설명 및 학습 안내 전용 단계입니다.">
                      <BookOpen size={12} />
                      <span>안내·학습 전용 단계</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 모달들 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">수업 흐름도 단계 카드 추가</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>취소</button>
            </div>
            <form onSubmit={handleCreateNode}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">단계 제목</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: 공기의 온도와 습도의 관계"
                    value={newNodeTitle}
                    onChange={(e) => setNewNodeTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">수업 활동 내용 및 설명</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="학생들이 이번 단계에서 탐구하고 기록할 핵심 내용을 적어주세요."
                    value={newNodeDesc}
                    onChange={(e) => setNewNodeDesc(e.target.value)}
                    required
                  />
                </div>

                {/* 미디어 첨부 영역 (사진 & 영상 URL & 구간 재생) */}
                <div className="form-group">
                  <label className="form-label">사진 또는 영상 자료 첨부 (선택)</label>
                  <div className="media-input-group">
                    <div className="media-tab-btns">
                      <button
                        type="button"
                        className={`media-tab-btn ${newNodeMediaTypeTab === 'none' ? 'active' : ''}`}
                        onClick={() => {
                          setNewNodeMediaTypeTab('none');
                          setNewNodeImageUrl('');
                          setNewNodeVideoUrl('');
                        }}
                      >
                        없음
                      </button>
                      <button
                        type="button"
                        className={`media-tab-btn ${newNodeMediaTypeTab === 'image' ? 'active' : ''}`}
                        onClick={() => setNewNodeMediaTypeTab('image')}
                      >
                        <ImageIcon size={14} />
                        <span>사진 첨부</span>
                      </button>
                      <button
                        type="button"
                        className={`media-tab-btn ${newNodeMediaTypeTab === 'video' ? 'active' : ''}`}
                        onClick={() => setNewNodeMediaTypeTab('video')}
                      >
                        <VideoIcon size={14} />
                        <span>영상 링크 & 구간</span>
                      </button>
                    </div>

                    {newNodeMediaTypeTab === 'image' && (
                      <div className="media-tab-body">
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <UploadCloud size={14} />
                            <span>사진 파일 올리기</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleImageFileChange(e, false)}
                            />
                          </label>
                        </div>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="또는 웹 이미지 URL (https://...)"
                          value={newNodeImageUrl}
                          onChange={(e) => setNewNodeImageUrl(e.target.value)}
                        />
                        {newNodeImageUrl && (
                          <div className="media-preview-container">
                            <img src={newNodeImageUrl} alt="미리보기" className="media-preview-img" />
                            <button
                              type="button"
                              className="media-remove-btn"
                              onClick={() => setNewNodeImageUrl('')}
                              title="사진 삭제"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {newNodeMediaTypeTab === 'video' && (
                      <div className="media-tab-body">
                        <input
                          type="url"
                          className="form-input"
                          placeholder="유튜브 영상 URL (예: https://www.youtube.com/watch?v=...)"
                          value={newNodeVideoUrl}
                          onChange={(e) => setNewNodeVideoUrl(e.target.value)}
                        />
                        <p style={{ fontSize: '0.71rem', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                          💡 EBS, 과학 실험, 일반 교육 영상은 창 내에서 즉시 재생되며, F1/방송사 등 저작권 차단 영상도 전용 팝업창으로 구간 재생됩니다.
                        </p>

                        {newNodeVideoUrl && extractYoutubeId(newNodeVideoUrl) && (
                          <div className="media-preview-container" style={{ position: 'relative' }}>
                            <img
                              src={`https://img.youtube.com/vi/${extractYoutubeId(newNodeVideoUrl)}/hqdefault.jpg`}
                              alt="유튜브 썸네일 미리보기"
                              className="media-preview-img"
                            />
                            <button
                              type="button"
                              className="media-remove-btn"
                              onClick={() => setNewNodeVideoUrl('')}
                              title="영상 삭제"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        {/* 원하는 부분만 틀 수 있는 영상 구간 설정 */}
                        <div className="video-segment-box">
                          <div className="video-segment-title">
                            <Clock size={14} />
                            <span>영상 구간 재생 설정 (선택사항)</span>
                          </div>
                          <p style={{ fontSize: '0.72rem', color: '#3b82f6', marginBottom: '8px' }}>
                            영상 중 수업에 필요한 핵심 구간만 지정하여 틀 수 있습니다. (비워둘 시 전체 재생)
                          </p>
                          <div className="video-segment-inputs">
                            <div className="time-input-wrap">
                              <span>시작:</span>
                              <input
                                type="number"
                                min="0"
                                max="180"
                                className="time-num-input"
                                placeholder="분"
                                value={newNodeVideoStartMin}
                                onChange={(e) => setNewNodeVideoStartMin(e.target.value)}
                              />
                              <span>분</span>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                className="time-num-input"
                                placeholder="초"
                                value={newNodeVideoStartSec}
                                onChange={(e) => setNewNodeVideoStartSec(e.target.value)}
                              />
                              <span>초</span>
                            </div>
                            <span style={{ fontWeight: 800, color: '#60a5fa' }}>~</span>
                            <div className="time-input-wrap">
                              <span>종료:</span>
                              <input
                                type="number"
                                min="0"
                                max="180"
                                className="time-num-input"
                                placeholder="분"
                                value={newNodeVideoEndMin}
                                onChange={(e) => setNewNodeVideoEndMin(e.target.value)}
                              />
                              <span>분</span>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                className="time-num-input"
                                placeholder="초"
                                value={newNodeVideoEndSec}
                                onChange={(e) => setNewNodeVideoEndSec(e.target.value)}
                              />
                              <span>초</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-setting-label">
                    <input
                      type="checkbox"
                      checked={newNodeHasCanvas}
                      onChange={(e) => setNewNodeHasCanvas(e.target.checked)}
                    />
                    <span style={{ fontWeight: 600 }}>학생 참여 캔버스(보드) 열기 활성화</span>
                  </label>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', marginInlineStart: '24px' }}>
                    체크 시 카드에 '캔버스 열기' 버튼이 제공됩니다. 체크 해제 시 설명 전용 카드로 사용됩니다.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">단계 추가</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={18} color="#4f46e5" />
                AI 교재 기반 지식 흐름도 자동 생성
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAiModal(false)}>취소</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                교과서 단원 PDF를 업로드하거나 수업 주제를 입력하면, 초등 교육과정에 맞는 단계별 지식 흐름도를 자동으로 설계합니다.
              </p>
              <div className="form-group">
                <label className="form-label">교과서/지도서 PDF 첨부</label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="form-input"
                  onChange={(e) => setPdfFileName(e.target.files[0]?.name || '')}
                />
                {pdfFileName && (
                  <span style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', display: 'block' }}>
                    ✔ {pdfFileName} 파일 분석 준비 완료
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">수업 주제 또는 추가 요청사항</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 초등 5학년 2학기 날씨와 우리 생활 3차시 바람의 원리 탐구"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAiModal(false)}>취소</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRunAiGeneration}
                disabled={isAiLoading}
              >
                {isAiLoading ? 'AI가 흐름도를 추출 중입니다...' : 'AI 흐름도 자동 생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 노드 카드 내용 수정 모달 */}
      {editingNode && (
        <div className="modal-overlay" onClick={() => setEditingNode(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Pencil size={16} color="#4f46e5" />
                수업 흐름도 단계 카드 수정
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingNode(null)}>취소</button>
            </div>
            <form onSubmit={handleSaveEditNode}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">단계 제목</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">수업 활동 내용 및 설명</label>
                  <textarea
                    className="form-textarea"
                    rows="4"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    required
                  />
                </div>

                {/* 미디어 첨부 영역 (사진 & 영상 URL & 구간 재생) */}
                <div className="form-group">
                  <label className="form-label">사진 또는 영상 자료 첨부</label>
                  <div className="media-input-group">
                    <div className="media-tab-btns">
                      <button
                        type="button"
                        className={`media-tab-btn ${editMediaTypeTab === 'none' ? 'active' : ''}`}
                        onClick={() => {
                          setEditMediaTypeTab('none');
                          setEditImageUrl('');
                          setEditVideoUrl('');
                        }}
                      >
                        없음
                      </button>
                      <button
                        type="button"
                        className={`media-tab-btn ${editMediaTypeTab === 'image' ? 'active' : ''}`}
                        onClick={() => setEditMediaTypeTab('image')}
                      >
                        <ImageIcon size={14} />
                        <span>사진 첨부</span>
                      </button>
                      <button
                        type="button"
                        className={`media-tab-btn ${editMediaTypeTab === 'video' ? 'active' : ''}`}
                        onClick={() => setEditMediaTypeTab('video')}
                      >
                        <VideoIcon size={14} />
                        <span>영상 링크 & 구간</span>
                      </button>
                    </div>

                    {editMediaTypeTab === 'image' && (
                      <div className="media-tab-body">
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <UploadCloud size={14} />
                            <span>사진 파일 올리기</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleImageFileChange(e, true)}
                            />
                          </label>
                        </div>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="또는 웹 이미지 URL (https://...)"
                          value={editImageUrl}
                          onChange={(e) => setEditImageUrl(e.target.value)}
                        />
                        {editImageUrl && (
                          <div className="media-preview-container">
                            <img src={editImageUrl} alt="미리보기" className="media-preview-img" />
                            <button
                              type="button"
                              className="media-remove-btn"
                              onClick={() => setEditImageUrl('')}
                              title="사진 삭제"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {editMediaTypeTab === 'video' && (
                      <div className="media-tab-body">
                        <input
                          type="url"
                          className="form-input"
                          placeholder="유튜브 영상 URL (예: https://www.youtube.com/watch?v=...)"
                          value={editVideoUrl}
                          onChange={(e) => setEditVideoUrl(e.target.value)}
                        />
                        <p style={{ fontSize: '0.71rem', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                          💡 EBS, 과학 실험, 일반 교육 영상은 창 내에서 즉시 재생되며, F1/방송사 등 저작권 차단 영상도 전용 팝업창으로 구간 재생됩니다.
                        </p>

                        {editVideoUrl && extractYoutubeId(editVideoUrl) && (
                          <div className="media-preview-container" style={{ position: 'relative' }}>
                            <img
                              src={`https://img.youtube.com/vi/${extractYoutubeId(editVideoUrl)}/hqdefault.jpg`}
                              alt="유튜브 썸네일 미리보기"
                              className="media-preview-img"
                            />
                            <button
                              type="button"
                              className="media-remove-btn"
                              onClick={() => setEditVideoUrl('')}
                              title="영상 삭제"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        {/* 원하는 부분만 틀 수 있는 영상 구간 설정 */}
                        <div className="video-segment-box">
                          <div className="video-segment-title">
                            <Clock size={14} />
                            <span>영상 구간 재생 설정</span>
                          </div>
                          <p style={{ fontSize: '0.72rem', color: '#3b82f6', marginBottom: '8px' }}>
                            영상 중 수업에 필요한 핵심 구간만 지정하여 틀 수 있습니다. (비워둘 시 전체 재생)
                          </p>
                          <div className="video-segment-inputs">
                            <div className="time-input-wrap">
                              <span>시작:</span>
                              <input
                                type="number"
                                min="0"
                                max="180"
                                className="time-num-input"
                                placeholder="분"
                                value={editVideoStartMin}
                                onChange={(e) => setEditVideoStartMin(e.target.value)}
                              />
                              <span>분</span>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                className="time-num-input"
                                placeholder="초"
                                value={editVideoStartSec}
                                onChange={(e) => setEditVideoStartSec(e.target.value)}
                              />
                              <span>초</span>
                            </div>
                            <span style={{ fontWeight: 800, color: '#60a5fa' }}>~</span>
                            <div className="time-input-wrap">
                              <span>종료:</span>
                              <input
                                type="number"
                                min="0"
                                max="180"
                                className="time-num-input"
                                placeholder="분"
                                value={editVideoEndMin}
                                onChange={(e) => setEditVideoEndMin(e.target.value)}
                              />
                              <span>분</span>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                className="time-num-input"
                                placeholder="초"
                                value={editVideoEndSec}
                                onChange={(e) => setEditVideoEndSec(e.target.value)}
                              />
                              <span>초</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-setting-label">
                    <input
                      type="checkbox"
                      checked={editHasCanvas}
                      onChange={(e) => setEditHasCanvas(e.target.checked)}
                    />
                    <span style={{ fontWeight: 600 }}>학생 참여 캔버스(보드) 열기 활성화</span>
                  </label>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', marginInlineStart: '24px' }}>
                    {editHasCanvas 
                      ? '현재 학생들이 이 단계에서 캔버스에 입장할 수 있습니다.' 
                      : '현재 캔버스가 비활성화되어 학생들에게 캔버스 열기 버튼이 나타나지 않습니다.'}
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingNode(null)}>취소</button>
                <button type="submit" className="btn btn-primary">수정 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. 전체 흐름도 선생님 카드 중앙 확대 모달 (최상위 레이어 & 드래그 이동 가능) */}
      {currentZoomedNode && (
        <div 
          className="modal-overlay flow-zoomed-backdrop" 
          onClick={() => {
            if (!isDraggingZoomedModalRef.current) {
              setZoomedStageNode(null);
            }
          }}
        >
          <div 
            className="zoomed-stage-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: `translate(${zoomedModalOffset.x}px, ${zoomedModalOffset.y}px)`,
              transition: isDraggingZoomedModal ? 'none' : 'transform 0.08s ease-out'
            }}
          >
            <div 
              className={`zoomed-stage-header ${isDraggingZoomedModal ? 'is-dragging' : ''}`}
              onMouseDown={handleZoomedModalMouseDown}
              title="헤더를 드래그하여 카드를 원하는 위치로 이동하세요"
            >
              <div className="zoomed-stage-badges">
                <span className="stage-drag-handle-hint" title="헤더를 잡고 드래그하여 화면 원하는 곳으로 이동할 수 있습니다">
                  <GripHorizontal size={15} />
                  <span>이동 가능</span>
                </span>
                {currentZoomedNode.id === liveStageId && (
                  <span className="stage-live-badge" style={{ fontSize: '0.85rem', padding: '4px 10px' }}>
                    <Activity size={14} /> 현재 진행 중인 수업
                  </span>
                )}
              </div>
              <button
                className="zoomed-close-btn"
                onClick={() => setZoomedStageNode(null)}
                title="닫기"
              >
                <X size={20} />
              </button>
            </div>

            <div className="zoomed-stage-body">
              <h2 className="zoomed-stage-title">{currentZoomedNode.title}</h2>

              <div className="zoomed-stage-desc-container">
                <h4 className="zoomed-section-heading">📌 수업 활동 및 선생님 안내</h4>
                <div className="zoomed-stage-desc-text">
                  {currentZoomedNode.description}
                </div>
              </div>

              {/* 확대 카드 내 첨부 사진 */}
              {currentZoomedNode.imageUrl && (
                <div style={{ margin: '14px 0' }}>
                  <h4 className="zoomed-section-heading">📷 첨부 사진</h4>
                  <img
                    src={currentZoomedNode.imageUrl}
                    alt={currentZoomedNode.title}
                    style={{
                      width: '100%',
                      maxHeight: '320px',
                      objectFit: 'contain',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      background: '#0f172a'
                    }}
                  />
                </div>
              )}

              {/* 확대 카드 내 첨부 영상 및 구간 재생 버튼 */}
              {currentZoomedNode.videoUrl && (() => {
                const videoId = extractYoutubeId(currentZoomedNode.videoUrl);
                const thumbUrl = videoId
                  ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                  : null;
                const timeSegmentText = formatTimeSegment(
                  currentZoomedNode.videoStartMin,
                  currentZoomedNode.videoStartSec,
                  currentZoomedNode.videoEndMin,
                  currentZoomedNode.videoEndSec
                );

                return (
                  <div style={{ margin: '14px 0' }}>
                    <h4 className="zoomed-section-heading">🎬 수업 영상 자료</h4>
                    <div
                      className="stage-card-video-thumb-container"
                      style={{ maxHeight: '280px', borderRadius: '12px' }}
                      onClick={() => setPlayingVideoNode(currentZoomedNode)}
                      title="클릭하여 지정 구간 영상 재생하기"
                    >
                      {thumbUrl ? (
                        <img src={thumbUrl} alt="동영상 썸네일" className="stage-card-video-thumb" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b', color: '#94a3b8' }}>
                          <Film size={32} />
                        </div>
                      )}
                      <div className="stage-card-video-overlay">
                        <div className="stage-card-video-top-tag">
                          <span className="stage-video-label-tag">클릭하여 재생</span>
                        </div>
                        <div className="stage-card-video-play-center" style={{ width: '48px', height: '48px' }}>
                          <Play size={24} fill="white" />
                        </div>
                        <div className="stage-card-video-bottom-tags">
                          {timeSegmentText ? (
                            <span className="stage-video-time-tag" style={{ fontSize: '0.78rem', padding: '4px 8px' }}>
                              <Clock size={13} /> {timeSegmentText} 구간 재생
                            </span>
                          ) : (
                            <span className="stage-video-time-tag" style={{ fontSize: '0.78rem', padding: '4px 8px' }}>
                              전체 영상 재생
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 캔버스 및 참여 현황 */}
              <div className="zoomed-stage-status-grid">
                <div className="zoomed-status-item">
                  <span className="status-item-label">학습 참여 캔버스</span>
                  <span className="status-item-value">
                    {currentZoomedNode.hasCanvas !== false ? (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>🟢 활성화됨 (게시판 사용 가능)</span>
                    ) : (
                      <span style={{ color: '#64748b' }}>⚪ 비활성화 (선생님 안내 전용)</span>
                    )}
                  </span>
                </div>

                <div className="zoomed-status-item">
                  <span className="status-item-label">등록된 학생/교사 카드</span>
                  <span className="status-item-value" style={{ fontWeight: 600 }}>
                    <Layers size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {posts.filter((p) => p.nodeId === currentZoomedNode.id).length}개의 글
                  </span>
                </div>
              </div>
            </div>

            <div className="zoomed-stage-footer">
              <div className="zoomed-footer-left">
                {isTeacher && (
                  <>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const target = currentZoomedNode;
                        setZoomedStageNode(null);
                        handleOpenEditModal(target);
                      }}
                    >
                      <Pencil size={14} /> 내용 수정하기
                    </button>
                    {currentZoomedNode.id !== liveStageId && (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => {
                          setLiveStageId(currentZoomedNode.id);
                        }}
                      >
                        <CheckCircle2 size={14} /> 이 단계로 진도 맞추기
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="zoomed-footer-right">
                {currentZoomedNode.hasCanvas !== false && onOpenCanvas && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const id = currentZoomedNode.id;
                      setZoomedStageNode(null);
                      onOpenCanvas(id);
                    }}
                  >
                    <span>캔버스(보드) 열기</span>
                    <ExternalLink size={16} />
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => setZoomedStageNode(null)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 동영상 구간 재생 팝업 모달 */}
      {playingVideoNode && (() => {
        const videoId = extractYoutubeId(playingVideoNode.videoUrl);
        const segmentText = formatTimeSegment(
          playingVideoNode.videoStartMin,
          playingVideoNode.videoStartSec,
          playingVideoNode.videoEndMin,
          playingVideoNode.videoEndSec
        );

        const embedUrl = videoId
          ? buildYoutubeEmbedUrl(
              videoId,
              playingVideoNode.videoStartMin,
              playingVideoNode.videoStartSec,
              playingVideoNode.videoEndMin,
              playingVideoNode.videoEndSec
            )
          : playingVideoNode.videoUrl;

        const directYoutubeUrl = videoId
          ? buildYoutubeDirectUrl(
              videoId,
              playingVideoNode.videoStartMin,
              playingVideoNode.videoStartSec
            )
          : playingVideoNode.videoUrl;

        const handleOpenPopupPlayer = () => {
          if (!directYoutubeUrl) return;
          const width = 1000;
          const height = 620;
          const left = Math.max(0, (window.screen.width - width) / 2);
          const top = Math.max(0, (window.screen.height - height) / 2);
          window.open(
            directYoutubeUrl,
            'classTreeYtPopup',
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
          );
        };

        return (
          <div className="modal-overlay" onClick={() => setPlayingVideoNode(null)} style={{ zIndex: 1200 }}>
            <div className="flow-video-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ width: '720px' }}>
              <div className="flow-video-modal-header">
                <div className="flow-video-modal-title">
                  <Film size={18} color="#ef4444" />
                  <span>{playingVideoNode.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {directYoutubeUrl && (
                    <button
                      type="button"
                      onClick={handleOpenPopupPlayer}
                      className="btn btn-sm"
                      style={{ 
                        fontSize: '0.78rem', 
                        padding: '4px 10px', 
                        background: '#dc2626', 
                        color: 'white', 
                        border: 'none',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title="유튜브 내부 정책으로 차단된 영상도 전용 창으로 즉시 구간 재생합니다"
                    >
                      <ExternalLink size={13} />
                      <span>YouTube 전용창으로 재생</span>
                    </button>
                  )}
                  <button
                    className="flow-video-close-btn"
                    onClick={() => setPlayingVideoNode(null)}
                    title="영상 닫기"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* 임베드 제한 영상 안내 바 */}
              <div style={{ background: '#1e293b', padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>💡 저작권사(F1, 방송사 등)에 의해 화면 재생이 제한될 경우 우측 상단 <b>[YouTube 전용창으로 재생]</b>을 누르세요.</span>
                {segmentText && (
                  <span className="stage-video-time-tag" style={{ fontSize: '0.72rem' }}>
                    <Clock size={11} /> {segmentText} 구간
                  </span>
                )}
              </div>

              <div className="flow-video-frame-wrap">
                {videoId ? (
                  <iframe
                    key={embedUrl}
                    src={embedUrl}
                    title={playingVideoNode.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    <p style={{ marginBottom: '1rem' }}>유효한 유튜브 영상 링크를 인식하지 못했습니다.</p>
                    <a href={playingVideoNode.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                      외부 링크로 열기
                    </a>
                  </div>
                )}
              </div>
              <div className="flow-video-modal-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {segmentText ? (
                    <span className="stage-video-time-tag" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                      <Clock size={13} /> {segmentText} 지정 구간 자동 설정됨
                    </span>
                  ) : (
                    <span style={{ color: '#d1d5db' }}>전체 영상 모드</span>
                  )}
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPlayingVideoNode(null)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
