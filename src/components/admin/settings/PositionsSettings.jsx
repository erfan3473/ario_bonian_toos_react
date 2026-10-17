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
} from '../../../features/admin/dropdownsSlice';

const DeletableEdge = ({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style, selected, data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const handleClick = useCallback(() => {
    data?.onDelete(id);
  }, [id, data]);

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
              className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 border-2 border-white text-white flex items-center justify-center text-sm font-black shadow-lg hover:scale-110 transition-transform"
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

const CustomPositionNode = ({ data }) => {
  // گرفتن تم تیره از دیتا
  const isDark = data.isDark !== false; // پیش‌فرض تیره
  
  return (
    <div
      className={`relative w-64 rounded-2xl border-2 shadow-xl transition-all duration-300
        ${data.isMatched === false ? 'opacity-30 grayscale scale-95' : 'opacity-100'}
      `}
      style={{
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        borderColor: data.isMatched === false ? (isDark ? '#374151' : '#E5E7EB') : data.color_hex,
        boxShadow: data.isMatched !== false ? `0 4px 20px ${data.color_hex}30` : undefined,
      }}
    >
      <Handle
        id="top"
        type="target"
        position={FlowPosition.Top}
        className={`w-4 h-4 bg-blue-500 border-2 hover:scale-150 transition-transform cursor-crosshair z-50 ${isDark ? 'border-gray-800' : 'border-white'}`}
      />

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 border border-white/20"
            style={{ backgroundColor: data.color_hex }}
          >
            {data.title?.[0]}
          </div>
          <div className="min-w-0">
            <h5 className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{data.title}</h5>
            <p className={`text-xs font-mono truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{data.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span
            className="text-[10px] px-2 py-0.5 rounded-md font-bold shadow-sm"
            style={{ backgroundColor: `${data.color_hex}20`, color: data.color_hex }}
          >
            سطح {data.hierarchy_level}
          </span>
          {data.can_enter_boq_items && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>✅ فهرست‌بها</span>
          )}
          {data.can_archive_letters && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>📁 بایگانی</span>
          )}
        </div>

        <div className={`flex justify-between items-center mt-4 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <span className={`text-[11px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{data.report_type_display || data.report_type}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onEdit(data.id);
            }}
            className="text-blue-500 hover:text-blue-600 text-xs flex items-center gap-1 font-bold transition"
          >
            ✏️ ویرایش
          </button>
        </div>
      </div>

      <Handle
        id="bottom"
        type="source"
        position={FlowPosition.Bottom}
        className={`w-4 h-4 bg-green-500 border-2 hover:scale-150 transition-transform cursor-crosshair z-50 ${isDark ? 'border-gray-800' : 'border-white'}`}
      />
    </div>
  );
};

const nodeTypes = { customPosition: CustomPositionNode };

const PositionsSettings = () => {
  const dispatch = useDispatch();
  const { positions, updateStatus } = useSelector((state) => state.admin.dropdowns);
  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

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
    can_enter_boq_items: false, 
    can_archive_letters: false, // 👈 اضافه شد
    description: '',
  });

  const maxLevel = (positions || []).reduce((max, p) => Math.max(max, p.hierarchy_level || 0), 3);
  const dynamicLevelOptions = Array.from({ length: maxLevel + 2 }, (_, i) => i);

  const edgesRef = useRef(edges);
  const positionsRef = useRef(positions || []);

  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { positionsRef.current = positions || []; }, [positions]);

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
        title: childData.title, code: childData.code, hierarchy_level: childData.hierarchy_level,
        parent_positions: newParents, report_type: childData.report_type,
        color_hex: childData.color_hex, can_enter_boq_items: childData.can_enter_boq_items,
        description: childData.description || '',
      },
    }));
  }, [dispatch]);

  useEffect(() => {
    if (!positions) return;

    const newNodes = positions.map((pos) => {
      const sameLevelPositions = positions.filter((p) => p.hierarchy_level === pos.hierarchy_level);
      const indexInLevel = sameLevelPositions.findIndex((p) => p.id === pos.id);
      const isMatched =
        searchTerm === '' ||
        pos.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.code?.toLowerCase().includes(searchTerm.toLowerCase());

      const effectiveLevel = pendingLevelChange?.id === pos.id ? pendingLevelChange.level : pos.hierarchy_level || 0;

      return {
        id: pos.id.toString(),
        type: 'customPosition',
        position: { x: indexInLevel * 310 - (sameLevelPositions.length * 310) / 2 + 450, y: effectiveLevel * 220 },
        data: { ...pos, onEdit: handleEditClick, isMatched, isDark }, // ارسال تم به نود
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
        className: flowMode === 'approval' ? 'edge-report' : '',
        style: { stroke: flowMode === 'mission' ? '#3B82F6' : '#10B981', strokeWidth: 4 },
      }));
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [positions, searchTerm, flowMode, pendingLevelChange, handleDeleteEdge, isDark]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => {
      const removeChanges = changes.filter((c) => c.type === 'remove');
      const otherChanges = changes.filter((c) => c.type !== 'remove');
      if (otherChanges.length > 0) setEdges((eds) => applyEdgeChanges(otherChanges, eds));
      removeChanges.forEach((change) => handleDeleteEdge(change.id));
    }, [handleDeleteEdge]);

  const onConnect = useCallback((params) => {
    const parentId = parseInt(params.source);
    const childId = parseInt(params.target);
    const childData = positionsRef.current.find((p) => p.id === childId);
    if (!childData) return;

    const currentParents = Array.isArray(childData.parent_positions) ? childData.parent_positions : [];
    const newParents = currentParents.includes(parentId) ? currentParents : [...currentParents, parentId];

    dispatch(updatePosition({
      id: childData.id,
      data: { ...childData, parent_positions: newParents, description: childData.description || '' },
    }));
  }, [dispatch]);

  const isValidConnection = useCallback((connection) => {
    if (connection.source === connection.target) return false;
    if (connection.sourceHandle !== 'bottom' || connection.targetHandle !== 'top') return false;
    return true;
  }, []);

  const onNodesDelete = useCallback((nodesToDelete) => {
      nodesToDelete.forEach((node) => {
        if (window.confirm(`آیا از غیرفعال کردن سمت "${node.data.title}" مطمئن هستید؟`)) dispatch(deletePosition(parseInt(node.id)));
      });
    }, [dispatch]);

  const onNodeDragStop = useCallback((event, node) => {
      const newLevel = Math.max(0, Math.round(node.position.y / 220));
      const posData = positionsRef.current.find((p) => p.id.toString() === node.id);
      if (posData && posData.hierarchy_level !== newLevel) {
        setPendingLevelChange({ id: posData.id, level: newLevel });
        dispatch(updatePosition({
          id: posData.id,
          data: { ...posData, hierarchy_level: newLevel, description: posData.description || '' },
        }));
      }
    }, [dispatch]);

  const handleEditClick = (id) => {
    const position = positionsRef.current.find((p) => p.id === id);
    if (position) {
      setFormData({
        title: position.title, 
        code: position.code, 
        hierarchy_level: position.hierarchy_level || 3,
        parent_position: position.parent_position, 
        report_type: position.report_type || 'WORKER',
        color_hex: position.color_hex || '#3B82F6', 
        can_enter_boq_items: position.can_enter_boq_items || false,
        can_archive_letters: position.can_archive_letters || false, // 👈 اضافه شد
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
      can_enter_boq_items: false, 
      can_archive_letters: false, // 👈 اضافه شد
      description: '' 
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
    if (updateStatus?.success) { setPendingLevelChange(null); resetForm(); }
  }, [updateStatus?.success]);

  const inputClass = `w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`;
  const labelClass = `block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`h-[800px] flex flex-col relative rounded-2xl overflow-hidden border-2 shadow-inner transition-colors ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      <style>{`
        .react-flow__edge.selected .react-flow__edge-path { stroke: #ef4444 !important; stroke-width: 5; }
        .react-flow__edge:hover .react-flow__edge-path { stroke-width: 5; cursor: pointer; }
        .react-flow__edge.edge-report.animated path { animation-direction: reverse; }
      `}</style>

      {/* ── Top Bar ── */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col md:flex-row justify-between items-start gap-4 pointer-events-none">
        <div className={`backdrop-blur px-5 py-3 rounded-xl border pointer-events-auto shadow-md ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
          <h3 className={`font-black text-lg md:text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>🗺️ نقشه سازمانی</h3>
        </div>

        <div className="flex flex-wrap gap-3 pointer-events-auto justify-end w-full md:w-auto">
          <div className={`backdrop-blur p-1.5 rounded-xl border shadow-md flex items-center gap-1 ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
            <button onClick={() => setFlowMode('mission')} className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${flowMode === 'mission' ? 'bg-blue-600 text-white shadow-md' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              ⬇️ ماموریت
            </button>
            <button onClick={() => setFlowMode('approval')} className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${flowMode === 'approval' ? 'bg-green-600 text-white shadow-md' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              ⬆️ گزارش
            </button>
          </div>

          <div className={`backdrop-blur px-4 py-2 rounded-xl border shadow-md flex items-center gap-2 ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
            <span className="opacity-50">🔍</span>
            <input type="text" placeholder="جستجو..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`bg-transparent w-24 sm:w-32 focus:outline-none text-sm font-bold ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} />
          </div>

          <button onClick={() => { setEditingId(null); setShowSidebar(true); }} className="bg-blue-600 hover:bg-blue-700 shadow-md text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
            ➕ سمت جدید
          </button>
        </div>
      </div>

      {updateStatus?.error && (
        <div className="absolute bottom-4 left-4 right-4 z-50 bg-red-900/90 border border-red-600 rounded-xl p-3 text-red-200 text-sm font-bold text-center shadow-lg">
          ❌ {updateStatus.error}
        </div>
      )}

      {/* ── Canvas ── */}
      <div className="flex-1 w-full h-full">
        <ReactFlow
          nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
          onNodesDelete={onNodesDelete} onNodeDragStop={onNodeDragStop} isValidConnection={isValidConnection}
          nodeTypes={nodeTypes} edgeTypes={edgeTypes} deleteKeyCode={['Backspace', 'Delete']} fitView fitViewOptions={{ padding: 0.2 }}
        >
          <Background color={isDark ? "#374151" : "#D1D5DB"} gap={16} size={1.5} />
          <Controls className={`border rounded-xl overflow-hidden shadow-lg ${isDark ? 'bg-gray-800 border-gray-700 [&>button]:bg-gray-700 [&>button]:text-white [&>button>svg]:fill-white hover:[&>button]:bg-gray-600' : 'bg-white border-gray-200 [&>button]:bg-white [&>button]:text-gray-800 [&>button>svg]:fill-gray-800 hover:[&>button]:bg-gray-100'}`} />
          <MiniMap nodeColor={(node) => node.data?.color_hex || '#3B82F6'} maskColor={isDark ? "rgba(17, 24, 39, 0.8)" : "rgba(249, 250, 251, 0.8)"} className={`rounded-xl border shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
        </ReactFlow>
      </div>

      {/* ── Sidebar ── */}
      <div className={`absolute top-0 right-0 h-full w-full sm:w-[400px] border-l shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${showSidebar ? 'translate-x-0' : 'translate-x-full'} ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-dashed border-gray-500/30">
            <h4 className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {editingId ? '✏️ ویرایش سمت' : '➕ ایجاد سمت جدید'}
            </h4>
            <button onClick={resetForm} className={`text-2xl leading-none transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>عنوان سمت *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>کد سمت *</label>
              <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required disabled={!!editingId} className={`${inputClass} disabled:opacity-50 font-mono text-left`} dir="ltr" />
            </div>

            <div>
              <label className={labelClass}>سطح سلسله‌مراتب</label>
              <select value={formData.hierarchy_level} onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) })} className={inputClass}>
                {dynamicLevelOptions.map((lvl) => <option key={lvl} value={lvl}>سطح {lvl} {lvl === 0 ? '(مدیریت)' : ''}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>نوع گزارش</label>
              <select value={formData.report_type} onChange={(e) => setFormData({ ...formData, report_type: e.target.value })} className={inputClass}>
                <option value="PROJECT_MANAGER">👑 مدیر پروژه</option><option value="WORKSHOP_SUPERVISOR">🎯 سرپرست کارگاه</option>
                <option value="FOREMAN">👔 سرکارگر</option><option value="WORKER">👷 کارگر</option><option value="FACILITIES_STAFF">🔧 تاسیسات</option>
                <option value="ACCOUNTANT">💰 حسابدار</option><option value="TECHNICAL_OFFICE">📐 دفتر فنی</option>
                <option value="HR_MANAGER">👥 منابع انسانی</option><option value="SECURITY_GUARD">🛡️ نگهبان</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>رنگ برای نقشه (HEX)</label>
              <div className="flex gap-2">
                <input type="color" value={formData.color_hex} onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })} className={`w-14 h-12 rounded-xl cursor-pointer p-1 border-2 ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`} />
                <input type="text" value={formData.color_hex} onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })} placeholder="#3B82F6" className={`${inputClass} font-mono uppercase`} dir="ltr" />
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#6B7280','#F97316'].map((c) => (
                  <button key={c} type="button" onClick={() => setFormData({ ...formData, color_hex: c })} className="w-8 h-8 rounded-lg shadow-sm hover:scale-110 transition border-2 border-transparent focus:border-gray-400" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>توضیحات</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`${inputClass} resize-none`} rows="3" />
            </div>

            <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700/80' : 'bg-white border-gray-200 shadow-sm hover:bg-gray-50'}`}>
              <input type="checkbox" checked={formData.can_enter_boq_items} onChange={(e) => setFormData({ ...formData, can_enter_boq_items: e.target.checked })} className={`w-5 h-5 rounded cursor-pointer transition-colors focus:ring-blue-500 text-blue-600 ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`} />
              <span className={`font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>✅ دسترسی ثبت فهرست‌بها</span>
            </label>

            {/* 👇 اضافه کردن چک‌باکس بایگانی دبیرخانه */}
            <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700/80' : 'bg-white border-gray-200 shadow-sm hover:bg-gray-50'}`}>
              <input type="checkbox" checked={formData.can_archive_letters} onChange={(e) => setFormData({ ...formData, can_archive_letters: e.target.checked })} className={`w-5 h-5 rounded cursor-pointer transition-colors focus:ring-purple-500 text-purple-600 ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`} />
              <span className={`font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>📁 دسترسی بایگانی دبیرخانه</span>
            </label>

            <div className={`pt-6 border-t flex gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {editingId && (
                <button type="button" onClick={() => { if (window.confirm('آیا مطمئن هستید؟ این سمت غیرفعال خواهد شد.')) { dispatch(deletePosition(editingId)); resetForm(); } }} className="px-4 py-3 bg-red-600/90 hover:bg-red-600 text-white rounded-xl shadow-sm transition font-bold">🗑️</button>
              )}
              <button type="button" onClick={resetForm} className={`px-4 py-3 rounded-xl transition font-bold ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>انصراف</button>
              <button type="submit" disabled={updateStatus?.loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50 shadow-md">
                {updateStatus?.loading ? '⏳ صبر کنید...' : editingId ? '💾 ذخیره تغییرات' : '➕ ایجاد سمت'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PositionsSettings;