/**
 * LocationTimeline - Location Tracking & Timeline Visualization
 * แสดงการเคลื่อนที่ของเป้าหมายบนแผนที่พร้อมไทม์ไลน์
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin,
  Clock,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
  Plus,
  Download,
  Filter,
  User,
  Navigation
} from 'lucide-react';
import { Button, Card, Badge, CaseSelector } from '../../components/ui';
import type { Case } from '../../services/api';

// Location point interface
interface LocationPoint {
  id: string;
  lat: number;
  lng: number;
  timestamp: Date;
  label: string;
  source: 'gps' | 'cell_tower' | 'wifi' | 'photo' | 'manual';
  accuracy?: number;
  address?: string;
  notes?: string;
  personId?: string;
  personName?: string;
}

// Demo data - Silk Road case locations
const DEMO_LOCATIONS: LocationPoint[] = [
  {
    id: '1',
    lat: 37.7749,
    lng: -122.4194,
    timestamp: new Date('2013-10-01T14:30:00'),
    label: 'Glen Park Library',
    source: 'gps',
    address: '2825 Diamond St, San Francisco, CA',
    notes: 'สถานที่จับกุม Ross Ulbricht',
    personName: 'Ross Ulbricht',
  },
  {
    id: '2',
    lat: 37.7849,
    lng: -122.4094,
    timestamp: new Date('2013-10-01T12:00:00'),
    label: 'Bernal Heights Coffee',
    source: 'wifi',
    address: 'Bernal Heights, San Francisco, CA',
    notes: 'ใช้ WiFi สาธารณะ',
    personName: 'Ross Ulbricht',
  },
  {
    id: '3',
    lat: 37.7649,
    lng: -122.4294,
    timestamp: new Date('2013-10-01T10:00:00'),
    label: 'ที่พักอาศัย',
    source: 'gps',
    address: '15th Street, San Francisco, CA',
    notes: 'ออกจากบ้านพัก',
    personName: 'Ross Ulbricht',
  },
  {
    id: '4',
    lat: 34.0522,
    lng: -83.9886,
    timestamp: new Date('2022-11-06T09:00:00'),
    label: 'บ้านพัก James Zhong',
    source: 'gps',
    address: 'Gainesville, Georgia, USA',
    notes: 'สถานที่ค้นบ้าน - พบ BTC 50,676 เหรียญ',
    personName: 'James Zhong',
  },
  {
    id: '5',
    lat: 34.0622,
    lng: -83.9786,
    timestamp: new Date('2022-11-06T14:00:00'),
    label: 'สำนักงาน FBI Atlanta',
    source: 'manual',
    address: 'Atlanta, Georgia, USA',
    notes: 'นำตัวสอบปากคำ',
    personName: 'James Zhong',
  },
];

// Source icons and colors
const SOURCE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  gps: { color: '#22c55e', icon: '📍', label: 'GPS' },
  cell_tower: { color: '#3b82f6', icon: '📡', label: 'Cell Tower' },
  wifi: { color: '#8b5cf6', icon: '📶', label: 'WiFi' },
  photo: { color: '#f59e0b', icon: '📷', label: 'Photo EXIF' },
  manual: { color: '#6b7280', icon: '✏️', label: 'Manual' },
};

export const LocationTimeline = () => {
  const [locations] = useState<LocationPoint[]>(DEMO_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterPerson, setFilterPerson] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Case selection
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [_selectedCase, setSelectedCase] = useState<Case | null>(null);
  
  const handleCaseChange = (caseId: number | null, caseData: Case | null) => {
    setSelectedCaseId(caseId);
    setSelectedCase(caseData);
  };
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // Get unique persons
  const persons = useMemo(() => {
    const uniquePersons = [...new Set(locations.map(l => l.personName).filter(Boolean))];
    return uniquePersons as string[];
  }, [locations]);

  // Filtered and sorted locations
  const filteredLocations = useMemo(() => {
    return locations
      .filter(l => filterPerson === 'all' || l.personName === filterPerson)
      .filter(l => filterSource === 'all' || l.source === filterSource)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [locations, filterPerson, filterSource]);

  // Load Leaflet map
  useEffect(() => {
    if (typeof window === 'undefined' || mapLoaded) return;

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      setMapLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Create map
    const map = L.map(mapRef.current).setView([37.7749, -122.4194], 12);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add markers
    updateMarkers();
  }, [mapLoaded]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    updateMarkers();
  }, [filteredLocations, selectedLocation]);

  const updateMarkers = () => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
    }

    // Add new markers
    const coords: [number, number][] = [];
    filteredLocations.forEach((loc, index) => {
      const isSelected = selectedLocation?.id === loc.id;
      const isCurrent = index === currentIndex;
      const config = SOURCE_CONFIG[loc.source];

      // Create custom icon
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: ${isSelected || isCurrent ? '40px' : '30px'};
            height: ${isSelected || isCurrent ? '40px' : '30px'};
            background: ${config.color};
            border-radius: 50%;
            border: 3px solid ${isSelected ? '#fff' : isCurrent ? '#fbbf24' : 'rgba(255,255,255,0.5)'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected || isCurrent ? '18px' : '14px'};
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s;
          ">
            ${config.icon}
          </div>
          <div style="
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            white-space: nowrap;
          ">${index + 1}</div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon })
        .addTo(mapInstanceRef.current)
        .on('click', () => {
          setSelectedLocation(loc);
          setCurrentIndex(index);
        });

      if (isSelected || isCurrent) {
        marker.bindPopup(`
          <div style="min-width: 200px;">
            <strong>${loc.label}</strong><br/>
            <small>${loc.address || 'ไม่ระบุที่อยู่'}</small><br/>
            <small>${loc.timestamp.toLocaleString('th-TH')}</small>
          </div>
        `).openPopup();
      }

      markersRef.current.push(marker);
      coords.push([loc.lat, loc.lng]);
    });

    // Draw polyline connecting points
    if (coords.length > 1) {
      polylineRef.current = L.polyline(coords, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(mapInstanceRef.current);
    }

    // Fit bounds
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= filteredLocations.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        setSelectedLocation(filteredLocations[next]);
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, filteredLocations]);

  const handlePlay = () => {
    if (currentIndex >= filteredLocations.length - 1) {
      setCurrentIndex(0);
      setSelectedLocation(filteredLocations[0]);
    }
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedLocation(filteredLocations[newIndex]);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredLocations.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedLocation(filteredLocations[newIndex]);
    }
  };

  const formatDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}ชม. ${minutes}น.`;
    return `${minutes} นาที`;
  };

  return (
    <div className="flex-1 p-6 bg-dark-900 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <MapPin className="text-primary-500" />
            Location Timeline
          </h1>
          <p className="text-dark-400 mt-1">ติดตามการเคลื่อนที่ของเป้าหมายบนแผนที่</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setShowAddModal(true)}>
            <Plus size={18} className="mr-2" />
            เพิ่มตำแหน่ง
          </Button>
          <Button variant="ghost">
            <Upload size={18} className="mr-2" />
            นำเข้า GPS
          </Button>
          <Button variant="secondary">
            <Download size={18} className="mr-2" />
            ส่งออก KML
          </Button>
        </div>
      </div>

      {/* Case Selector */}
      <CaseSelector
        selectedCaseId={selectedCaseId}
        onCaseChange={handleCaseChange}
        showCaseInfo={true}
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <User size={18} className="text-dark-400" />
            <select
              value={filterPerson}
              onChange={(e) => setFilterPerson(e.target.value)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">ทุกคน ({locations.length} จุด)</option>
              {persons.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-dark-400" />
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">ทุกแหล่งข้อมูล</option>
              {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.icon} {config.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <Navigation size={16} />
            <span>{filteredLocations.length} ตำแหน่ง</span>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-4" style={{ height: 'calc(100vh - 280px)' }}>
        {/* Map */}
        <div className="col-span-2">
          <Card className="h-full overflow-hidden">
            {!mapLoaded ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                <span className="ml-3">กำลังโหลดแผนที่...</span>
              </div>
            ) : (
              <div ref={mapRef} className="h-full w-full" />
            )}
          </Card>
        </div>

        {/* Timeline Panel */}
        <div className="col-span-1 flex flex-col gap-4">
          {/* Playback Controls */}
          <Card className="p-4">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setCurrentIndex(0); setSelectedLocation(filteredLocations[0]); }}
                disabled={filteredLocations.length === 0}
              >
                <SkipBack size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="primary"
                onClick={isPlaying ? () => setIsPlaying(false) : handlePlay}
                disabled={filteredLocations.length === 0}
                className="px-6"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex >= filteredLocations.length - 1}
              >
                <ChevronRight size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { 
                  const last = filteredLocations.length - 1;
                  setCurrentIndex(last); 
                  setSelectedLocation(filteredLocations[last]); 
                }}
                disabled={filteredLocations.length === 0}
              >
                <SkipForward size={18} />
              </Button>
            </div>
            <div className="text-center text-sm text-dark-400 mt-2">
              {currentIndex + 1} / {filteredLocations.length}
            </div>
          </Card>

          {/* Selected Location Details */}
          {selectedLocation && (
            <Card className="p-4 bg-primary-500/10 border-primary-500/30">
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ background: SOURCE_CONFIG[selectedLocation.source].color }}
                >
                  {SOURCE_CONFIG[selectedLocation.source].icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedLocation.label}</h3>
                  <p className="text-sm text-dark-400">{selectedLocation.address}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-dark-400">
                    <Clock size={12} />
                    {selectedLocation.timestamp.toLocaleString('th-TH')}
                  </div>
                  {selectedLocation.personName && (
                    <Badge variant="info" className="mt-2">
                      {selectedLocation.personName}
                    </Badge>
                  )}
                  {selectedLocation.notes && (
                    <p className="text-sm text-dark-300 mt-2 p-2 bg-dark-800 rounded">
                      📝 {selectedLocation.notes}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Timeline List */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-dark-700">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock size={16} className="text-primary-400" />
                ไทม์ไลน์
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-2">
                {filteredLocations.map((loc, index) => {
                  const isActive = index === currentIndex;
                  const config = SOURCE_CONFIG[loc.source];
                  const prevLoc = index > 0 ? filteredLocations[index - 1] : null;
                  
                  return (
                    <div key={loc.id}>
                      {/* Duration between points */}
                      {prevLoc && (
                        <div className="text-center text-xs text-dark-500 py-1">
                          ⏱️ {formatDuration(prevLoc.timestamp, loc.timestamp)}
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          setCurrentIndex(index);
                          setSelectedLocation(loc);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          isActive 
                            ? 'bg-primary-500/20 border border-primary-500/50' 
                            : 'bg-dark-800 hover:bg-dark-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                            style={{ background: config.color }}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{loc.label}</div>
                            <div className="text-xs text-dark-400 truncate">{loc.address}</div>
                            <div className="text-xs text-dark-500 mt-1">
                              {loc.timestamp.toLocaleString('th-TH')}
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Legend */}
      <Card className="p-3">
        <div className="flex items-center gap-6 justify-center">
          {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ background: config.color }}
              >
                {config.icon}
              </div>
              <span className="text-dark-400">{config.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px] p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="text-primary-400" />
              เพิ่มตำแหน่งใหม่
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-dark-400 block mb-1">Latitude</label>
                  <input type="number" step="0.0001" className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2" placeholder="13.7563" />
                </div>
                <div>
                  <label className="text-sm text-dark-400 block mb-1">Longitude</label>
                  <input type="number" step="0.0001" className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2" placeholder="100.5018" />
                </div>
              </div>
              <div>
                <label className="text-sm text-dark-400 block mb-1">ชื่อสถานที่</label>
                <input type="text" className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2" placeholder="บ้านพักผู้ต้องหา" />
              </div>
              <div>
                <label className="text-sm text-dark-400 block mb-1">วันเวลา</label>
                <input type="datetime-local" className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2" />
              </div>
              <div>
                <label className="text-sm text-dark-400 block mb-1">แหล่งข้อมูล</label>
                <select className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2">
                  {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.icon} {config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-dark-400 block mb-1">หมายเหตุ</label>
                <textarea rows={2} className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2 resize-none" placeholder="รายละเอียดเพิ่มเติม..." />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setShowAddModal(false)}>
                  ยกเลิก
                </Button>
                <Button variant="primary" className="flex-1" onClick={() => setShowAddModal(false)}>
                  <Plus size={16} className="mr-2" />
                  เพิ่มตำแหน่ง
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LocationTimeline;
