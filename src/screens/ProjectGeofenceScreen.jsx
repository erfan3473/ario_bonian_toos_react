// src/screens/ProjectGeofenceScreen.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import L from '@neshan-maps-platform/leaflet';
import '@neshan-maps-platform/leaflet/dist/leaflet.css';
import { fetchProjectGeofence, updateProjectGeofence } from '../features/projects/projectSlice';
import { fetchRouteTemplates, fetchProjectFeatures } from '../features/routeMaps/mapRoutesSlice';

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

// --- تابع ساخت آیکون عارضه‌ها با همان استایل دقیق داشبورد کارگران ---
const createFeatureIcon = (svgString) => {
  return L.divIcon({
    className: 'custom-feature-icon',
    html: `
      <div style="
        background-color: white; 
        width: 28px; 
        height: 28px; 
        border: 2px solid #3B82F6; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.3); 
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
      ">
        ${
          svgString 
            ? `<div style="width: 16px; height: 16px; display:flex; justify-content:center; align-items:center;">${svgString}</div>` 
            : `<span style="font-size: 14px;">📍</span>`
        }
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

const ProjectGeofenceScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { geofence, loading } = useSelector((state) => state.projects);
  const geofenceData = geofence?.data;

  // خواندن مسیرها و عارضه‌ها از ریداکس
  const { routeTemplates, projectFeatures } = useSelector((state) => state.mapRoutes);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // لایه‌ها به صورت مجزا برای جلوگیری از افت فریم
  const layerGroupRef = useRef(null); 
  const shapeLayerRef = useRef(null); 
  
  // لایه گروهی اختصاصی برای عارضه‌ها و مسیرها تا با ترسیم Geofence قاطی نشن
  const routesFeaturesGroupRef = useRef(null);

  const isDrawingRef = useRef(false);
  const pointsRef = useRef([]);

  const [points, setPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);

  // ۱. دریافت اطلاعات ژئوفنس، مسیرها و عارضه‌ها در ابتدای ورود به صفحه
  useEffect(() => {
    dispatch(fetchProjectGeofence(id));
    dispatch(fetchRouteTemplates());
    dispatch(fetchProjectFeatures());
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

  // ۲. مقداردهی اولیه نقشه و ساختن لایه‌های گروهی
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
    
    // فعال‌سازی لایه عارضه‌ها و مسیرها روی مپ
    routesFeaturesGroupRef.current = L.featureGroup().addTo(map);

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

  // ۳. لود کردن دیتای Geofence از دیتابیس روی نقشه
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

  // 🌟 ۴. افکت جدید: فیلتر کردن مسیرها و عارضه‌ها و رسم دقیق آن‌ها روی این صفحه 🌟
  useEffect(() => {
    const layerGroup = routesFeaturesGroupRef.current;
    if (!layerGroup || !mapInstanceRef.current) return;

    layerGroup.clearLayers();

    // فیلتر کردن قالب‌ها و عارضه‌ها فقط و فقط برای همین پروژه‌ای که وارد صفحه‌اش شدیم
    const targetId = String(id);
    
    const filteredTemplates = routeTemplates.filter(rt => {
      const pId = (rt.project && typeof rt.project === 'object') ? rt.project.id : rt.project;
      return String(pId) === targetId;
    });

    const filteredFeatures = projectFeatures.filter(pf => {
      const pId = (pf.project && typeof pf.project === 'object') ? pf.project.id : pf.project;
      return String(pId) === targetId;
    });

    // رسم مسیرها (با سیستم برعکس کردن مختصات برای وب جهت جلوگیری از خطا روسیه!)
    filteredTemplates.forEach((template) => {
      const popupContent = `
        <div style="font-family: Tahoma; font-size: 13px; text-align: right; min-width: 140px;">
          <strong style="color: #2563EB; font-size: 13px;">${template.name}</strong>
          ${template.description ? `<div style="margin-top: 4px; font-size: 11px; color:#4B5563;">${template.description}</div>` : ''}
        </div>
      `;

      if (template.polygon_coordinates && template.polygon_coordinates.length > 0) {
        const correctedPolygon = template.polygon_coordinates.map(pt => [pt[1], pt[0]]);
        L.polygon(correctedPolygon, { color: '#8B5CF6', weight: 2, fillOpacity: 0.2 })
          .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(popupContent))
          .addTo(layerGroup);
      } 
      else if (template.line_coordinates && template.line_coordinates.length > 0) {
        const correctedLine = template.line_coordinates.map(pt => [pt[1], pt[0]]);
        L.polyline(correctedLine, { color: '#10B981', weight: 3 })
          .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(popupContent))
          .addTo(layerGroup);
      }
      else if (template.multi_line_coordinates && template.multi_line_coordinates.length > 0) {
        const correctedMultiLine = template.multi_line_coordinates.map(line => line.map(pt => [pt[1], pt[0]]));
        L.polyline(correctedMultiLine, { color: '#F59E0B', weight: 3 })
          .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(popupContent))
          .addTo(layerGroup);
      }
    });

    // رسم عارضه‌ها (نقاط ثابت)
    filteredFeatures.forEach((feature) => {
      if (feature.location_coordinates && feature.location_coordinates.length === 2) {
        const svgIcon = feature.icon_detail?.icon_svg || null;
        const popupContent = `
          <div style="font-family: Tahoma; font-size: 13px; text-align: right; min-width: 140px;">
            <strong style="color: #EF4444; font-size: 13px;">${feature.name}</strong>
            ${feature.icon_detail?.name ? `<div style="color: #059669; margin-top: 2px; font-size: 11px;">نوع: ${feature.icon_detail.name}</div>` : ''}
            ${feature.description ? `<div style="margin-top: 4px; font-size: 11px; color:#4B5563;">${feature.description}</div>` : ''}
          </div>
        `;

        L.marker(feature.location_coordinates, { icon: createFeatureIcon(svgIcon) })
          .bindPopup(L.popup({ className: 'sharp-popup' }).setContent(popupContent))
          .addTo(layerGroup);
      }
    });

  }, [routeTemplates, projectFeatures, id]);

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
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: 50, backgroundColor: '#111827' }}>
      
      {/* استایل‌های اختصاصی پاپ‌آپ و آیکون‌های SVG عارضه‌ها */}
      <style>{`
        .sharp-popup .leaflet-popup-content-wrapper { border-radius: 4px !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        .sharp-popup .leaflet-popup-tip { display: none; }
        .custom-feature-icon svg { width: 100%; height: 100%; }
      `}</style>

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