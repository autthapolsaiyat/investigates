/**
 * Login Map Page (Admin)
 * Display user login locations on a map using Leaflet.js
 */
import { useState, useEffect, useRef } from 'react';
import { 
  Map as MapIcon, 
  RefreshCw, 
  Users, 
  MapPin, 
  Activity,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  List
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { loginHistoryAPI } from '../../services/api';
import type { LoginMapPoint, LoginStats, LoginHistoryItem } from '../../services/api';

// Leaflet types (loaded via CDN)
declare global {
  interface Window {
    L: any;
  }
}

export const LoginMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [days, setDays] = useState(7);
  const [showList, setShowList] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  
  // Summary counts
  const [totalLogins, setTotalLogins] = useState(0);
  const [uniqueUsers, setUniqueUsers] = useState(0);
  const [uniqueLocations, setUniqueLocations] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(0);

  // Initialize Leaflet map
  useEffect(() => {
    // Load Leaflet from CDN if not already loaded
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
      }
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || leafletMap.current) return;

    const L = window.L;
    
    // Create map centered on Thailand
    leafletMap.current = L.map(mapRef.current).setView([13.7563, 100.5018], 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap.current);

    // Create markers layer group
    markersLayer.current = L.layerGroup().addTo(leafletMap.current);

    // Fetch initial data
    fetchData();
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [mapData, statsData, historyData] = await Promise.all([
        loginHistoryAPI.getMapData(days),
        loginHistoryAPI.getStats(),
        loginHistoryAPI.list({ page: 1, page_size: 50, days })
      ]);

      setTotalLogins(mapData.total_logins);
      setUniqueUsers(mapData.unique_users);
      setUniqueLocations(mapData.unique_locations);
      setOnlineUsers(mapData.points.filter(p => p.is_online).length);
      setStats(statsData);
      setLoginHistory(historyData.items);

      // Update markers on map
      updateMarkers(mapData.points);
    } catch (err) {
      console.error('Error fetching login data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMarkers = (points: LoginMapPoint[]) => {
    if (!markersLayer.current || !window.L) return;

    const L = window.L;
    
    // Clear existing markers
    markersLayer.current.clearLayers();

    // Add markers for each point
    points.forEach(point => {
      if (!point.latitude || !point.longitude) return;

      // Create custom icon based on online status
      const iconHtml = point.is_online
        ? `<div class="relative">
             <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-lg">
               ${point.user_name.charAt(0).toUpperCase()}
             </div>
             <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white animate-pulse"></div>
           </div>`
        : `<div class="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-lg">
             ${point.user_name.charAt(0).toUpperCase()}
           </div>`;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      // Create popup content
      const popupContent = `
        <div class="p-2 min-w-[200px]">
          <div class="font-bold text-gray-900 mb-1">${point.user_name}</div>
          <div class="text-sm text-gray-600 mb-2">${point.user_email}</div>
          <div class="space-y-1 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-gray-500">📍</span>
              <span>${point.city || 'Unknown'}, ${point.country || 'Unknown'}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-500">🖥️</span>
              <span>${point.device_type || 'Unknown'} - ${point.browser || 'Unknown'}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-500">🕐</span>
              <span>${new Date(point.login_at).toLocaleString('th-TH')}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="${point.is_online ? 'text-green-500' : 'text-gray-400'}">●</span>
              <span>${point.is_online ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      `;

      L.marker([point.latitude, point.longitude], { icon })
        .bindPopup(popupContent)
        .addTo(markersLayer.current);
    });

    // Fit bounds if we have points
    if (points.length > 0) {
      const validPoints = points.filter(p => p.latitude && p.longitude);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(
          validPoints.map(p => [p.latitude!, p.longitude!])
        );
        leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  useEffect(() => {
    if (leafletMap.current) {
      fetchData();
    }
  }, [days]);

  const getDeviceIcon = (deviceType: string | undefined) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return <Smartphone size={14} />;
      case 'tablet': return <Tablet size={14} />;
      default: return <Monitor size={14} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MapIcon className="w-7 h-7 text-primary-400" />
            Login Map
          </h1>
          <p className="text-gray-400 mt-1">ติดตามการ Login ของผู้ใช้บนแผนที่</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
          >
            <option value={1}>24 ชั่วโมง</option>
            <option value={7}>7 วัน</option>
            <option value={30}>30 วัน</option>
            <option value={90}>90 วัน</option>
          </select>
          <Button 
            variant="secondary" 
            onClick={() => setShowList(!showList)}
          >
            <List className="w-4 h-4 mr-2" />
            {showList ? 'ซ่อนรายการ' : 'แสดงรายการ'}
          </Button>
          <Button onClick={fetchData} variant="secondary" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalLogins}</p>
              <p className="text-sm text-gray-400">Total Logins</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{uniqueUsers}</p>
              <p className="text-sm text-gray-400">Unique Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{uniqueLocations}</p>
              <p className="text-sm text-gray-400">Unique Locations</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{onlineUsers}</p>
              <p className="text-sm text-gray-400">Online Now</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Map and List */}
      <div className={`grid gap-6 ${showList ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {/* Map */}
        <Card className={`overflow-hidden ${showList ? 'lg:col-span-2' : ''}`}>
          <div 
            ref={mapRef} 
            className="w-full h-[500px] bg-dark-700"
            style={{ minHeight: '500px' }}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-dark-800/50 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-primary-400 animate-spin" />
            </div>
          )}
        </Card>

        {/* Login History List */}
        {showList && (
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-dark-700">
              <h3 className="font-medium text-white">Login History</h3>
            </div>
            <div className="divide-y divide-dark-700 max-h-[500px] overflow-y-auto">
              {loginHistory.map((item) => (
                <div key={item.id} className="p-3 hover:bg-dark-800/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      item.login_success 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {item.user_name?.charAt(0) || item.user_email?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.user_name || item.user_email}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        {getDeviceIcon(item.device_type)}
                        <span>{item.browser}</span>
                        <span>•</span>
                        <span>{item.city || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {new Date(item.login_at).toLocaleString('th-TH')}
                        </span>
                        {item.login_success ? (
                          <CheckCircle size={12} className="text-green-400" />
                        ) : (
                          <XCircle size={12} className="text-red-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {loginHistory.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  ไม่มีข้อมูล Login
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Stats Details */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Locations */}
          <Card className="p-4">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-primary-400" />
              Top Locations (7 วัน)
            </h3>
            <div className="space-y-3">
              {stats.top_locations.map((loc, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{index + 1}.</span>
                    <span className="text-white">{loc.city}, {loc.country}</span>
                  </div>
                  <span className="text-primary-400">{loc.count} logins</span>
                </div>
              ))}
              {stats.top_locations.length === 0 && (
                <p className="text-gray-400 text-center">ไม่มีข้อมูล</p>
              )}
            </div>
          </Card>

          {/* Top Devices */}
          <Card className="p-4">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <Monitor size={18} className="text-primary-400" />
              Top Devices (7 วัน)
            </h3>
            <div className="space-y-3">
              {stats.top_devices.map((dev, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(dev.device_type)}
                    <span className="text-white">{dev.device_type} - {dev.browser}</span>
                  </div>
                  <span className="text-primary-400">{dev.count} logins</span>
                </div>
              ))}
              {stats.top_devices.length === 0 && (
                <p className="text-gray-400 text-center">ไม่มีข้อมูล</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Custom marker styles */}
      <style>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
        .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default LoginMap;
