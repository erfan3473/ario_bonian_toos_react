// src/screens/ProjectGeofenceScreen.jsx

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import L from '@neshan-maps-platform/leaflet';
import '@neshan-maps-platform/leaflet/dist/leaflet.css';
import { fetchProjectGeofence, updateProjectGeofence } from '../features/projects/projectSlice';

const vertexIcon = L.divIcon({
  className: 'custom-vertex',
  html: '<div style="width:16px;height:16px;background:#3b82f6;border:2px solid #fff;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const midpointIcon = L.divIcon({
  className: 'custom-midpoint',
  html: '<div style="width:12px;height:12px;background:#10b981;border:2px solid #fff;border-radius:50%;opacity:0.9;box-shadow:0 0 4px rgba(0,0,0,0.4); cursor:pointer;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const ProjectGeofenceScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { geofence, loading } = useSelector((state) => state.projects);
  const geofenceData = geofence?.data;

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // لایه‌ها به صورت مجزا برای جلوگیری از افت فریم
  const layerGroupRef = useRef(null); 
  const shapeLayerRef = useRef(null); 

  const isDrawingRef = useRef(false);
  const pointsRef = useRef([]);

  const [points, setPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchProjectGeofence(id));
  }, [dispatch, id]);

  const drawLayers = () => {
    const map = mapInstanceRef.current;
    if (!map || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();
    const pts = pointsRef.current;

    if (pts.length === 0) {
      shapeLayerRef.current = null;
      return;
    }

    // 1. رسم خط یا چندضلعی و ذخیره رفرنس آن
    if (pts.length >= 3) {
      shapeLayerRef.current = L.polygon(pts, {
        color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 3,
      }).addTo(layerGroupRef.current);
    } else if (pts.length === 2) {
      shapeLayerRef.current = L.polyline(pts, { color: '#3b82f6', weight: 3 }).addTo(layerGroupRef.current);
    }

    // 2. رسم نقاط اصلی
    pts.forEach((p, index) => {
      const marker = L.marker(p, { icon: vertexIcon, draggable: true }).addTo(layerGroupRef.current);
      
      // آپدیت سریع چندضلعی بدون رسم مجدد بقیه نقاط (جلوگیری از جا ماندن موس)
      marker.on('drag', (e) => {
        const { lat, lng } = e.target.getLatLng();
        pointsRef.current[index] = [lat, lng];
        if (shapeLayerRef.current) {
          shapeLayerRef.current.setLatLngs(pointsRef.current);
        }
      });

      // رسم مجدد نقاط میانی فقط وقتی درگ تمام شد
      marker.on('dragend', () => {
        setPoints([...pointsRef.current]);
        drawLayers(); 
      });
    });

    // 3. رسم نقاط میانی
    if (pts.length >= 2) {
      for (let i = 0; i < pts.length; i++) {
        if (pts.length === 2 && i === 1) break;

        const nextI = (i + 1) % pts.length;
        const p1 = pts[i];
        const p2 = pts[nextI];
        
        const midLat = (p1[0] + p2[0]) / 2;
        const midLng = (p1[1] + p2[1]) / 2;

        const midMarker = L.marker([midLat, midLng], { icon: midpointIcon }).addTo(layerGroupRef.current);
        
        midMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e); // جلوگیری از ثبت نقطه جدید توسط نقشه
          pointsRef.current.splice(i + 1, 0, [midLat, midLng]);
          setPoints([...pointsRef.current]);
          drawLayers();
        });
      }
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new L.Map(mapContainerRef.current, {
      key: "web.83d364e4d58e4b1e966567753524cdf8",
      maptype: "neshan",
      poi: false,
      traffic: false,
      center: [35.6892, 51.389],
      zoom: 13,
    });

    mapInstanceRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    map.on('click', (e) => {
      if (!isDrawingRef.current) return;
      const { lat, lng } = e.latlng;
      pointsRef.current.push([lat, lng]);
      setPoints([...pointsRef.current]);
      drawLayers();
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || loading?.geofence || !geofenceData?.boundary_coordinates?.length) return;

    const coords = geofenceData.boundary_coordinates;
    pointsRef.current = [...coords];
    setPoints([...coords]);
    
    drawLayers();

    try {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    } catch (e) {}

  }, [geofenceData, loading?.geofence]);

  const handleStart = () => {
    pointsRef.current = [];
    setPoints([]);
    if (layerGroupRef.current) layerGroupRef.current.clearLayers();
    isDrawingRef.current = true;
    setIsDrawing(true);
  };

  const handleFinish = () => {
    if (pointsRef.current.length < 3) {
      alert('حداقل ۳ نقطه لازمه');
      return;
    }
    isDrawingRef.current = false;
    setIsDrawing(false);
  };

  const handleClear = () => {
    pointsRef.current = [];
    setPoints([]);
    if (layerGroupRef.current) layerGroupRef.current.clearLayers();
    isDrawingRef.current = false;
    setIsDrawing(false);
  };

  const handleSave = async () => {
    if (pointsRef.current.length < 3) {
      alert('حداقل ۳ نقطه لازمه');
      return;
    }
    try {
      setSaving(true);
      await dispatch(updateProjectGeofence({
        projectId: id,
        coordinates: pointsRef.current,
      })).unwrap();
      alert('✅ محدوده با موفقیت ذخیره شد');
      navigate(-1);
    } catch (err) {
      alert('خطا: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    // z-index: 50 برای قرار گرفتن روی هدر و منوها
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: 50, backgroundColor: '#111827' }}>

      {loading?.geofence && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 18,
        }}>
          در حال بارگذاری...
        </div>
      )}

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* انتقال دکمه‌ها به پایین (Bottom) صفحه تا زیر هدر نروند */}
      <div style={{
        position: 'absolute', bottom: 24, left: 24, right: 24, zIndex: 1000,
        display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center'
      }}>
        <button onClick={() => navigate(-1)} style={btnStyle('#374151')}>
          ← بازگشت
        </button>

        {!isDrawing ? (
          <button onClick={handleStart} style={btnStyle('#2563eb')}>
            ✏️ رسم مجدد
          </button>
        ) : (
          <button onClick={handleFinish} style={btnStyle('#16a34a')}>
            ✅ اتمام رسم
          </button>
        )}

        <button onClick={handleClear} style={btnStyle('#dc2626')}>
          🗑️ پاک کردن
        </button>

        {!isDrawing && points.length >= 3 && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={btnStyle(saving ? '#6b7280' : '#15803d')}
          >
            {saving ? 'در حال ذخیره...' : `💾 ذخیره (${points.length} نقطه)`}
          </button>
        )}
      </div>

      {isDrawing && (
        <div style={{
          position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
          background: 'rgba(0,0,0,0.8)', color: '#86efac',
          padding: '10px 16px', borderRadius: 8, fontSize: 14, textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          🟢 روی نقشه کلیک کنید ({points.length} نقطه)
        </div>
      )}
    </div>
  );
};

const btnStyle = (bg) => ({
  background: bg, color: '#fff', border: 'none',
  padding: '12px 20px', borderRadius: 8,
  fontSize: 15, fontWeight: 'bold', cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(0,0,0,0.3)', fontFamily: 'inherit',
  minWidth: '120px'
});

export default ProjectGeofenceScreen;
