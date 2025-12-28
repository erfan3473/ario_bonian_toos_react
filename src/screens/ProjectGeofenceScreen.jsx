// src/screens/ProjectGeofenceScreen.jsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import { useDispatch } from 'react-redux';
import { 
  fetchProjectGeofence,     // ✅ تغییر
  updateProjectGeofence     // ✅ تغییر
} from '../features/projects/projectSlice';  // ✅ تغییر
import Loader from '../components/Loader';
import Message from '../components/Message';

// استایل‌ها
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// فیکس آیکون
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// 🗑️ دکمه پاک‌سازی روی نقشه
const ClearControl = ({ onClear }) => {
    return (
        <div className="leaflet-top leaflet-left mt-20 ml-3 pointer-events-auto z-[500]">
            <div className="leaflet-control leaflet-bar">
                <a 
                    href="#" 
                    title="پاک کردن نقشه" 
                    role="button" 
                    aria-label="Clear Map"
                    onClick={(e) => {
                        e.preventDefault();
                        onClear();
                    }}
                    className="bg-white text-red-600 hover:bg-gray-100 w-8 h-8 flex items-center justify-center font-bold text-lg"
                >
                    🗑️
                </a>
            </div>
        </div>
    );
};

// 🗺️ زوم هوشمند
const MapController = ({ geofence }) => {
  const map = useMap();
  const hasZoomed = useRef(false);

  useEffect(() => {
    if (geofence && geofence.length > 0 && !hasZoomed.current) {
      try {
        const polygon = L.polygon(geofence);
        map.fitBounds(polygon.getBounds(), { padding: [50, 50] });
        hasZoomed.current = true; 
      } catch (e) {
        console.warn("Invalid bounds", e);
      }
    }
  }, [geofence, map]);
  return null;
};

const ProjectGeofenceScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);
  const [geofence, setGeofence] = useState([]); 

  const featureGroupRef = useRef();

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await dispatch(fetchProjectGeofence(id)).unwrap();  // ✅ تغییر
        setProject(result);
        if (result.boundary_coordinates && result.boundary_coordinates.length > 0) {
            setGeofence(result.boundary_coordinates);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch, id]);

  // پاک کردن کل نقشه
  const handleClearMap = useCallback(() => {
    if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
    }
    setGeofence([]);
  }, []);

  const _onCreated = useCallback((e) => {
    const layer = e.layer;
    
    // فقط ۱ فنس مجاز است
    if (featureGroupRef.current) {
        const layers = featureGroupRef.current.getLayers();
        if (layers.length > 1) {
            layers.forEach(l => {
                if (l !== layer) featureGroupRef.current.removeLayer(l);
            });
        }
    }

    const latlngs = layer.getLatLngs()[0];
    const coords = latlngs.map(ll => [ll.lat, ll.lng]);
    setGeofence(coords);
  }, []);

  const _onEdited = useCallback((e) => {
    e.layers.eachLayer((layer) => {
        const latlngs = layer.getLatLngs()[0];
        const coords = latlngs.map(ll => [ll.lat, ll.lng]);
        setGeofence(coords);
    });
  }, []);

  const _onDeleted = useCallback((e) => {
    setGeofence([]);
  }, []);

  const handleSave = async () => {
    if (geofence.length < 3) {
        alert("❌ لطفاً یک محدوده معتبر رسم کنید (حداقل ۳ نقطه).");
        return;
    }
    try {
        setSaving(true);
        await dispatch(updateProjectGeofence({ 
        projectId: id, 
        coordinates: geofence 
        })).unwrap();
        
        alert("✅ محدوده با موفقیت ذخیره شد.");
        navigate('/projects');  // ✅ تغییر از '/admin/projects' به '/projects'
    } catch (err) {
        alert("خطا: " + err);
    } finally {
        setSaving(false);
    }
    };

  // لود کردن فنس اولیه برای ادیت
  const LoadInitialShape = () => {
      const loadedRef = useRef(false);
      useEffect(() => {
          if (!loadedRef.current && geofence.length > 0 && featureGroupRef.current) {
              featureGroupRef.current.clearLayers();
              const polygon = L.polygon(geofence, { color: '#3b82f6' });
              featureGroupRef.current.addLayer(polygon);
              loadedRef.current = true;
          }
      }, []);
      return null;
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-900 text-white">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-800 shadow-md z-10 border-b border-gray-700">
            <div className="mb-3 md:mb-0">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-blue-400">📍 فنس‌کشی:</span> 
                    {project?.name}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                   ابزار رسم (چندضلعی) را انتخاب کنید و محدوده را مشخص نمایید.
                </p>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition text-sm"
                    disabled={saving}
                >
                    انصراف
                </button>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-2 rounded-lg font-bold shadow-lg transition flex items-center gap-2 ${saving ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                >
                    {saving ? 'در حال ذخیره...' : 'ذخیره نهایی'}
                </button>
            </div>
        </div>

        {/* Map Area */}
        <div className="flex-grow relative w-full isolate">
            <MapContainer 
                center={[35.6892, 51.389]} 
                zoom={14} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                className="bg-gray-800"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                />

                <MapController geofence={geofence} />
                
                <ClearControl onClear={handleClearMap} />

                <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                        position="topright"
                        onCreated={_onCreated}
                        onEdited={_onEdited}
                        onDeleted={_onDeleted}
                        draw={{
                            rectangle: false,
                            circle: false,
                            circlemarker: false,
                            marker: false,
                            polyline: false,
                            polygon: {
                                allowIntersection: true,
                                showArea: true,
                                shapeOptions: { 
                                    color: '#3b82f6',
                                    fillOpacity: 0.2,
                                    weight: 4
                                }
                            },
                        }}
                    />
                </FeatureGroup>
                
                <LoadInitialShape />

            </MapContainer>

            <div className="absolute bottom-8 left-8 bg-gray-900/90 backdrop-blur p-4 rounded-xl border border-gray-600 shadow-2xl max-w-xs z-[400] pointer-events-none">
                <h4 className="font-bold text-blue-400 text-sm mb-2">📘 راهنما:</h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-300">
                    <li>ابزار چندضلعی (Pentagon) بالا سمت راست را بزنید.</li>
                    <li>نقاط را بدون محدودیت کلیک کنید.</li>
                    <li>برای بستن، روی <b>نقطه اول</b> کلیک کنید.</li>
                    <li>برای شروع مجدد دکمه 🗑️ را بزنید.</li>
                </ul>
            </div>
        </div>
    </div>
  );
};

export default ProjectGeofenceScreen;
