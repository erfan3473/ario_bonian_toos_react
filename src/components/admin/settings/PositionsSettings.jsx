// src/components/admin/settings/PositionsSettings.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position as FlowPosition,
  EdgeLabelRenderer,
  BaseEdge,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  createPosition,
  updatePosition,
  deletePosition,
  resetUpdateStatus,
} from '../../../features/admin/adminSlice';

// ═══════════════════════════════════════════════════════════
// 🔴 CUSTOM EDGE — دکمه حذف وسط خط
// ═══════════════════════════════════════════════════════════
const DeletableEdge = ({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style, selected, data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  // ✅ فقط id در dep — نه data (جلوگیری از re-render loop)
  const handleClick = useCallback(() => {
    data?.onDelete(id);
  }, [id]);

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} />
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            className="nodrag nopan"
          >
            <button
              onClick={handleClick}
              className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 border-2 border-gray-900 text-white flex items-center justify-center text-sm font-black shadow-lg hover:scale-125 transition-transform"
              title="حذف اتصال"
            >
              ×
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const edgeTypes = { deletable: DeletableEdge };

// ═══════════════════════════════════════════════════════════
// 🎨 CUSTOM NODE
// ═══════════════════════════════════════════════════════════
const CustomPositionNode = ({ data }) => {
  return (
    <div
      className={`relative w-64 rounded-xl border-2 shadow-2xl transition-all duration-300
        ${data.isMatched === false ? 'opacity-20 grayscale scale-95' : 'opacity-100'}
      `}
      style={{
        backgroundColor: '#1F2937',
        borderColor: data.isMatched === false ? '#374151' : data.color_hex,
        boxShadow: data.isMatched !== false ? `0 0 16px ${data.color_hex}40` : undefined,
      }}
    >
      <Handle
        id="top"
        type="target"
        position={FlowPosition.Top}
        className="w-5 h-5 bg-blue-500 border-2 border-gray-800 hover:scale-150 hover:bg-blue-400 transition-transform cursor-crosshair z-50"
      />

      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0"
            style={{
              backgroundColor: data.color_hex,
              boxShadow: `0 0 10px ${data.color_hex}50`,
            }}
          >
            {data.title?.[0]}
          </div>
          <div className="min-w-0">
            <h5 className="text-white font-bold text-sm truncate">{data.title}</h5>
            <p className="text-gray-400 text-xs font-mono truncate">{data.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: `${data.color_hex}25`, color: data.color_hex }}
          >
            سطح {data.hierarchy_level}
          </span>
          {data.can_enter_boq_items && (
            <span className="text-xs text-green-400 font-bold">✅ فهرست‌بها</span>
          )}
        </div>

        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-700">
          <span className="text-xs text-gray-500">{data.report_type_display || data.report_type}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onEdit(data.id);
            }}
            className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 font-bold transition"
          >
            ✏️ ویرایش
          </button>
        </div>
      </div>

      <Handle
        id="bottom"
        type="source"
        position={FlowPosition.Bottom}
        className="w-5 h-5 bg-green-500 border-2 border-gray-800 hover:scale-150 hover:bg-green-400 transition-transform cursor-crosshair z-50"
      />
    </div>
  );
};

const nodeTypes = { customPosition: CustomPositionNode };

// ═══════════════════════════════════════════════════════════
// 🚀 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const PositionsSettings = () => {
  const dispatch = useDispatch();
  const { positions, updateStatus } = useSelector((state) => state.admin);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [flowMode, setFlowMode] = useState('mission');
  const [pendingLevelChange, setPendingLevelChange] = useState(null);

  const [formData, setFormData] = useState({
    title: '', code: '', hierarchy_level: 3, parent_position: null,
    report_type: 'WORKER', color_hex: '#3B82F6',
    can_enter_boq_items: false, description: '',
  });

  const maxLevel = positions.reduce((max, p) => Math.max(max, p.hierarchy_level || 0), 3);
  const dynamicLevelOptions = Array.from({ length: maxLevel + 2 }, (_, i) => i);

  // ═══════════════════════════════════════════════════════════
  // ✅ handleDeleteEdge با useRef — هیچ‌وقت reference عوض نمی‌شه
  // ═══════════════════════════════════════════════════════════
  const edgesRef = useRef(edges);
  const positionsRef = useRef(positions);

  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { positionsRef.current = positions; }, [positions]);

  const handleDeleteEdge = useCallback((edgeId) => {
    const edge = edgesRef.current.find((e) => e.id === edgeId);
    if (!edge) return;

    const parentId = parseInt(edge.source);
    const childId = parseInt(edge.target);

    const childData = positionsRef.current.find((p) => p.id === childId);
    if (!childData) return;

    const currentParents = Array.isArray(childData.parent_positions) ? childData.parent_positions : [];
    const newParents = currentParents.filter((pid) => pid !== parentId);

    dispatch(updatePosition({
      id: childData.id,
      data: {
        title: childData.title,
        code: childData.code,
        hierarchy_level: childData.hierarchy_level,
        parent_positions: newParents,           // ✅
        report_type: childData.report_type,
        color_hex: childData.color_hex,
        can_enter_boq_items: childData.can_enter_boq_items,
        description: childData.description || '',
      },
    }));
  }, [dispatch]);


  // ── Build nodes & edges ──
  useEffect(() => {
    if (!positions) return;

    const newNodes = positions.map((pos) => {
      const sameLevelPositions = positions.filter((p) => p.hierarchy_level === pos.hierarchy_level);
      const indexInLevel = sameLevelPositions.findIndex((p) => p.id === pos.id);
      const isMatched =
        searchTerm === '' ||
        pos.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.code?.toLowerCase().includes(searchTerm.toLowerCase());

      const effectiveLevel =
        pendingLevelChange?.id === pos.id
          ? pendingLevelChange.level
          : pos.hierarchy_level || 0;

      return {
        id: pos.id.toString(),
        type: 'customPosition',
        position: {
          x: indexInLevel * 310 - (sameLevelPositions.length * 310) / 2 + 450,
          y: effectiveLevel * 220,
        },
        data: { ...pos, onEdit: handleEditClick, isMatched },
      };
    });

    const newEdges = positions.flatMap((pos) => {
      const parents = Array.isArray(pos.parent_positions) ? pos.parent_positions : [];
      return parents.map((pid) => ({
        id: `e${pid}-${pos.id}`,
        source: pid.toString(),
        target: pos.id.toString(),
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'deletable',
        animated: true,
        interactionWidth: 20,
        data: { onDelete: handleDeleteEdge },
        className: flowMode === 'approval' ? 'edge-report' : '',  // ✅ این یه خط
        style: {
          stroke: flowMode === 'mission' ? '#3B82F6' : '#10B981',
          strokeWidth: 4,
        },
      }));

    });


    setNodes(newNodes);
    setEdges(newEdges);
    // ✅ handleDeleteEdge اینجا نیست — loop نمی‌زنه
  }, [positions, searchTerm, flowMode, pendingLevelChange]);

  // ── onNodesChange ──
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // ── onEdgesChange — intercept حذف (Delete/Backspace) ──
  const onEdgesChange = useCallback(
    (changes) => {
      const removeChanges = changes.filter((c) => c.type === 'remove');
      const otherChanges = changes.filter((c) => c.type !== 'remove');

      if (otherChanges.length > 0) {
        setEdges((eds) => applyEdgeChanges(otherChanges, eds));
      }

      // حذف با keyboard → همان منطق handleDeleteEdge
      removeChanges.forEach((change) => {
        handleDeleteEdge(change.id);
      });
    },
    [handleDeleteEdge]
  );

  // ── onConnect ──
  const onConnect = useCallback((params) => {
    const parentId = parseInt(params.source);
    const childId = parseInt(params.target);

    const childData = positionsRef.current.find((p) => p.id === childId);
    if (!childData) return;

    const currentParents = Array.isArray(childData.parent_positions) ? childData.parent_positions : [];
    const newParents = currentParents.includes(parentId) ? currentParents : [...currentParents, parentId];

    dispatch(updatePosition({
      id: childData.id,
      data: {
        title: childData.title,
        code: childData.code,
        hierarchy_level: childData.hierarchy_level,
        parent_positions: newParents,           // ✅
        report_type: childData.report_type,
        color_hex: childData.color_hex,
        can_enter_boq_items: childData.can_enter_boq_items,
        description: childData.description || '',
      },
    }));
  }, [dispatch]);


  // ── isValidConnection ──
  const isValidConnection = useCallback((connection) => {
    if (connection.source === connection.target) return false;
    if (connection.sourceHandle !== 'bottom' || connection.targetHandle !== 'top') return false;
    return true;
  }, []);

  // ── onNodesDelete ──
  const onNodesDelete = useCallback(
    (nodesToDelete) => {
      nodesToDelete.forEach((node) => {
        if (window.confirm(`آیا از غیرفعال کردن سمت "${node.data.title}" مطمئن هستید؟`)) {
          dispatch(deletePosition(parseInt(node.id)));
        }
      });
    },
    [dispatch]
  );

  // ── onNodeDragStop — تغییر سطح با drag ──
  const onNodeDragStop = useCallback(
    (event, node) => {
      const newLevel = Math.max(0, Math.round(node.position.y / 220));
      const posData = positionsRef.current.find((p) => p.id.toString() === node.id);
      if (posData && posData.hierarchy_level !== newLevel) {
        setPendingLevelChange({ id: posData.id, level: newLevel });
        dispatch(updatePosition({
          id: posData.id,
          data: {
            title: posData.title, code: posData.code,
            hierarchy_level: newLevel,
            parent_position: posData.parent_position,
            report_type: posData.report_type, color_hex: posData.color_hex,
            can_enter_boq_items: posData.can_enter_boq_items,
            description: posData.description || '',
          },
        }));
      }
    },
    [dispatch]
  );

  // ── handleEditClick ──
  const handleEditClick = (id) => {
    const position = positionsRef.current.find((p) => p.id === id);
    if (position) {
      setFormData({
        title: position.title, code: position.code,
        hierarchy_level: position.hierarchy_level || 3,
        parent_position: position.parent_position,
        report_type: position.report_type || 'WORKER',
        color_hex: position.color_hex || '#3B82F6',
        can_enter_boq_items: position.can_enter_boq_items || false,
        description: position.description || '',
      });
      setEditingId(position.id);
      setShowSidebar(true);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', code: '', hierarchy_level: 3, parent_position: null,
      report_type: 'WORKER', color_hex: '#3B82F6',
      can_enter_boq_items: false, description: '',
    });
    setEditingId(null);
    setShowSidebar(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) dispatch(updatePosition({ id: editingId, data: formData }));
    else dispatch(createPosition(formData));
  };

  useEffect(() => {
    if (updateStatus.success) {
      setPendingLevelChange(null);
      resetForm();
      dispatch(resetUpdateStatus());
    }
  }, [updateStatus.success, dispatch]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="h-[800px] flex flex-col relative rounded-xl overflow-hidden bg-gray-900 border border-gray-700">

      <style>{`
        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #ef4444 !important;
          stroke-width: 5;
        }
        .react-flow__edge:hover .react-flow__edge-path {
          stroke-width: 5;
          cursor: pointer;
        }

        /* ✅ جهت انیمیشن برعکس برای حالت گزارش */
        .react-flow__edge.edge-report.animated path {
          animation-direction: reverse;
       }
    `}</style>


      {/* ── Top Bar ── */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none gap-4">

        <div className="bg-gray-800/90 backdrop-blur px-5 py-3 rounded-xl border border-gray-700 pointer-events-auto shadow-xl">
          <h3 className="text-white font-bold text-xl">🗺️ نقشه سازمانی</h3>
        </div>

        <div className="flex gap-3 pointer-events-auto items-center flex-wrap justify-end">

          <div className="bg-gray-800/90 backdrop-blur p-1.5 rounded-xl border border-gray-700 shadow-xl flex items-center gap-1">
            <button
              onClick={() => setFlowMode('mission')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${flowMode === 'mission' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              ⬇️ ماموریت
            </button>
            <button
              onClick={() => setFlowMode('approval')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${flowMode === 'approval' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              ⬆️ گزارش
            </button>
          </div>

          <div className="bg-gray-800/90 backdrop-blur px-3 py-2 rounded-xl border border-gray-700 shadow-xl flex items-center gap-2">
            <span className="text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="جستجو..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-white w-32 focus:outline-none text-sm placeholder-gray-500"
            />
          </div>

          <button
            onClick={() => { setEditingId(null); setShowSidebar(true); }}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 text-white px-6 py-2.5 rounded-xl transition font-bold flex items-center gap-2"
          >
            ➕ سمت جدید
          </button>
        </div>
      </div>

      {/* error */}
      {updateStatus.error && (
        <div className="absolute bottom-4 left-4 right-4 z-50 bg-red-900/90 border border-red-600 rounded-xl p-3 text-red-300 text-sm font-bold text-center">
          ❌ {updateStatus.error}
        </div>
      )}

      {/* ── Canvas ── */}
      <div className="flex-1 w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onNodeDragStop={onNodeDragStop}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-gray-900"
        >
          <Background color="#374151" gap={16} size={1} />
          <Controls className="bg-gray-300 border-gray-400 rounded-lg overflow-hidden shadow-2xl [&>button]:bg-gray-200 [&>button]:text-black [&>button>svg]:fill-black hover:[&>button]:bg-gray-400" />
          <MiniMap
            nodeColor={(node) => node.data?.color_hex || '#3B82F6'}
            maskColor="rgba(17, 24, 39, 0.8)"
            className="bg-gray-800 rounded-lg border border-gray-700"
          />
        </ReactFlow>
      </div>

      {/* ── Sidebar ── */}
      <div className={`absolute top-0 right-0 h-full w-[400px] bg-gray-800 border-l border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-white font-bold text-xl">
              {editingId ? '✏️ ویرایش سمت' : '➕ ایجاد سمت جدید'}
            </h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-white text-3xl leading-none transition">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-gray-300 mb-2 font-bold text-sm">عنوان سمت *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold text-sm">کد سمت *</label>
              <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required disabled={!!editingId} className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50" />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold text-sm">سطح سلسله‌مراتب</label>
              <select value={formData.hierarchy_level} onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) })} className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none">
                {dynamicLevelOptions.map((lvl) => (
                  <option key={lvl} value={lvl}>سطح {lvl} {lvl === 0 ? '(مدیریت)' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold text-sm">نوع گزارش</label>
              <select value={formData.report_type} onChange={(e) => setFormData({ ...formData, report_type: e.target.value })} className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="PROJECT_MANAGER">👑 مدیر پروژه</option>
                <option value="WORKSHOP_SUPERVISOR">🎯 سرپرست کارگاه</option>
                <option value="FOREMAN">👔 سرکارگر</option>
                <option value="WORKER">👷 کارگر</option>
                <option value="FACILITIES_STAFF">🔧 تاسیسات</option>
                <option value="ACCOUNTANT">💰 حسابدار</option>
                <option value="TECHNICAL_OFFICE">📐 دفتر فنی</option>
                <option value="HR_MANAGER">👥 منابع انسانی</option>
                <option value="SECURITY_GUARD">🛡️ نگهبان</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold text-sm">رنگ برای نقشه (HEX)</label>
              <div className="flex gap-2">
                <input type="color" value={formData.color_hex} onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })} className="w-14 h-12 rounded-lg cursor-pointer bg-transparent border-0" />
                <input type="text" value={formData.color_hex} onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })} placeholder="#3B82F6" className="flex-1 bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono" />
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#6B7280','#F97316'].map((c) => (
                  <button key={c} type="button" onClick={() => setFormData({ ...formData, color_hex: c })} className="w-7 h-7 rounded-lg hover:scale-125 transition border-2 border-transparent hover:border-white" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold text-sm">توضیحات</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" rows="3" />
            </div>

            <label className="flex items-center gap-3 cursor-pointer bg-gray-900 p-4 rounded-lg border border-gray-700">
              <input type="checkbox" checked={formData.can_enter_boq_items} onChange={(e) => setFormData({ ...formData, can_enter_boq_items: e.target.checked })} className="w-5 h-5 rounded text-blue-600 bg-gray-700 border-gray-600" />
              <span className="text-gray-300 text-sm font-bold">✅ دسترسی ثبت فهرست‌بها</span>
            </label>

            <div className="pt-6 border-t border-gray-700 flex gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('آیا مطمئن هستید؟ این سمت غیرفعال خواهد شد.')) {
                      dispatch(deletePosition(editingId));
                      resetForm();
                    }
                  }}
                  className="px-4 py-3 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white rounded-lg transition"
                >
                  🗑️
                </button>
              )}
              <button type="button" onClick={resetForm} className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition">
                انصراف
              </button>
              <button type="submit" disabled={updateStatus.loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50">
                {updateStatus.loading ? '⏳ صبر کنید...' : editingId ? '💾 ذخیره تغییرات' : '➕ ایجاد سمت'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PositionsSettings;
