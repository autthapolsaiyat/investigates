/**
 * LocationTimeline V2 - Enhanced Playback with FBI CAST Style Features
 * Features:
 * - Auto Pan & Zoom to each point
 * - Animated Trail Line (shows path as it progresses)
 * - Current Point Highlight with pulsing animation
 * - Info Popup for current point
 * - Speed Control (0.5x, 1x, 2x, 4x)
 * - Progress Bar
 * - Follow Mode Toggle
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Plus,
  Filter,
  User,
  Navigation,
  Crosshair,
  Gauge,
  Eye,
  EyeOff,
  Maximize,
  Minimize
} from 'lucide-react';
import { Button, Card, Badge, CaseInfoBar } from '../../components/ui';
import { useCaseStore } from '../../store/caseStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://investigates-api.azurewebsites.net/api/v1';

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

// Source icons and colors
const SOURCE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  gps: { color: '#22c55e', icon: '📍', label: 'GPS' },
  cell_tower: { color: '#3b82f6', icon: '📡', label: 'Cell Tower' },
  wifi: { color: '#8b5cf6', icon: '📶', label: 'WiFi' },
  photo: { color: '#f59e0b', icon: '📷', label: 'Photo EXIF' },
  manual: { color: '#6b7280', icon: '✏️', label: 'Manual' },
};

// Speed options
const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
];

export const LocationTimeline = () => {
  // Data state - fetched from API
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterPerson, setFilterPerson] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New playback states
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [followMode, setFollowMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Ref for fullscreen container
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Use global case store
  const { selectedCaseId } = useCaseStore();
  
  // Fetch location data from API
  useEffect(() => {
    const fetchLocationData = async () => {
      if (!selectedCaseId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      try {
        const response = await fetch(
          `${API_BASE}/locations/case/${selectedCaseId}/timeline`,
          { headers }
        );
        
        if (!response.ok) {
          if (response.status === 404) {
            setLocations([]);
            setIsLoading(false);
            return;
          }
          throw new Error('Failed to fetch location data');
        }
        
        const data = await response.json();
        
        // Transform API data to component format
        const transformedLocations: LocationPoint[] = data.points.map((p: any) => ({
          id: p.id,
          lat: p.lat,
          lng: p.lng,
          timestamp: p.timestamp ? new Date(p.timestamp) : new Date(),
          label: p.label,
          source: p.source || 'manual',
          accuracy: p.accuracy,
          address: p.address,
          notes: p.notes,
          personId: p.personId,
          personName: p.personName
        }));
        
        setLocations(transformedLocations);
        
      } catch (err) {
        console.error('Error fetching location data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLocationData();
  }, [selectedCaseId]);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const trailPolylineRef = useRef<any>(null);
  const fullPolylineRef = useRef<any>(null);
  const pulseMarkerRef = useRef<any>(null);

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
    
    // Add custom CSS for pulsing animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-ring {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
      .pulse-marker {
        position: relative;
      }
      .pulse-marker::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 60px;
        height: 60px;
        margin: -30px 0 0 -30px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.4);
        animation: pulse-ring 1.5s ease-out infinite;
      }
      .pulse-marker::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 40px;
        height: 40px;
        margin: -20px 0 0 -20px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.3);
        animation: pulse-ring 1.5s ease-out infinite 0.3s;
      }
    `;
    document.head.appendChild(style);

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

    // Default center: Bangkok, Thailand. Will pan to data if available.
    const defaultCenter: [number, number] = [13.7563, 100.5018];
    const defaultZoom = 10;

    // Create map
    const map = L.map(mapRef.current).setView(defaultCenter, defaultZoom);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add markers
    updateMarkers();
  }, [mapLoaded]);

  // Update trail line (animated path)
  const updateTrailLine = useCallback((upToIndex: number) => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;
    
    // Remove old trail
    if (trailPolylineRef.current) {
      trailPolylineRef.current.remove();
    }
    
    // Draw trail up to current point (solid line)
    const trailCoords = filteredLocations.slice(0, upToIndex + 1).map(loc => [loc.lat, loc.lng] as [number, number]);
    if (trailCoords.length > 1) {
      trailPolylineRef.current = L.polyline(trailCoords, {
        color: '#3b82f6',
        weight: 4,
        opacity: 1,
      }).addTo(mapInstanceRef.current);
    }
  }, [filteredLocations]);

  // Update pulse marker for current location
  const updatePulseMarker = useCallback((loc: LocationPoint) => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;
    
    // Remove old pulse marker
    if (pulseMarkerRef.current) {
      pulseMarkerRef.current.remove();
    }
    
    const config = SOURCE_CONFIG[loc.source];
    
    // Create pulsing marker with inline animation (pseudo-elements don't work well with Leaflet)
    const pulseIcon = L.divIcon({
      className: 'custom-pulse-marker',
      html: `
        <div style="position: relative; width: 50px; height: 50px;">
          <!-- Pulse rings -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            width: 80px;
            height: 80px;
            margin: -40px 0 0 -40px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.3);
            animation: pulse-ring 1.5s ease-out infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            width: 60px;
            height: 60px;
            margin: -30px 0 0 -30px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.4);
            animation: pulse-ring 1.5s ease-out infinite 0.3s;
          "></div>
          <!-- Main marker -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            width: 50px;
            height: 50px;
            margin: -25px 0 0 -25px;
            background: ${config.color};
            border-radius: 50%;
            border: 4px solid #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            z-index: 10;
          ">
            ${config.icon}
          </div>
        </div>
      `,
      iconSize: [80, 80],
      iconAnchor: [40, 40],
    });
    
    pulseMarkerRef.current = L.marker([loc.lat, loc.lng], { icon: pulseIcon, zIndexOffset: 1000 })
      .addTo(mapInstanceRef.current)
      .bindPopup(`
        <div style="min-width: 250px; font-family: system-ui;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1e3a5f;">
            📍 ${loc.label}
          </div>
          <div style="color: #666; font-size: 12px; margin-bottom: 4px;">
            ${loc.address || 'No address specified'}
          </div>
          <div style="color: #666; font-size: 12px; margin-bottom: 4px;">
            🕐 ${loc.timestamp.toLocaleString('en-US')}
          </div>
          ${loc.personName ? `<div style="color: #3b82f6; font-size: 12px;">👤 ${loc.personName}</div>` : ''}
          ${loc.notes ? `<div style="margin-top: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 11px;">📝 ${loc.notes}</div>` : ''}
        </div>
      `)
      .openPopup();
  }, []);

  // Update markers when locations change
  const updateMarkers = useCallback(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;

    // Clear existing point markers only (NOT trail or pulse)
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (fullPolylineRef.current) {
      fullPolylineRef.current.remove();
    }
    // Don't clear trailPolylineRef and pulseMarkerRef here - they are managed separately

    // Add new markers
    const coords: [number, number][] = [];
    filteredLocations.forEach((loc, index) => {
      const config = SOURCE_CONFIG[loc.source];

      // Create custom icon (smaller for non-current points)
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: ${config.color};
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            opacity: 0.8;
          ">
            ${config.icon}
          </div>
          <div style="
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.75);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            white-space: nowrap;
          ">${index + 1}</div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon })
        .addTo(mapInstanceRef.current)
        .on('click', () => {
          setSelectedLocation(loc);
          setCurrentIndex(index);
          setIsPlaying(false);
          updatePulseMarker(loc);
          updateTrailLine(index);
          if (followMode) {
            mapInstanceRef.current.flyTo([loc.lat, loc.lng], 15, { duration: 0.5 });
          }
        });

      markersRef.current.push(marker);
      coords.push([loc.lat, loc.lng]);
    });

    // Draw full polyline (faded, showing entire route)
    if (coords.length > 1) {
      fullPolylineRef.current = L.polyline(coords, {
        color: '#6b7280',
        weight: 2,
        opacity: 0.4,
        dashArray: '8, 8',
      }).addTo(mapInstanceRef.current);
    }

    // Fit bounds initially
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // Initialize with first point
    if (filteredLocations.length > 0) {
      setSelectedLocation(filteredLocations[0]);
      updatePulseMarker(filteredLocations[0]);
      updateTrailLine(0);
    }
  }, [filteredLocations, followMode, updatePulseMarker, updateTrailLine]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    updateMarkers();
  }, [filteredLocations, updateMarkers]);

  // Pan to current location when index changes (during playback)
  const panToCurrentLocation = useCallback(() => {
    if (!mapInstanceRef.current) return;
    
    const currentLoc = filteredLocations[currentIndex];
    if (!currentLoc) return;
    
    // Update trail line to show path up to current point (always)
    updateTrailLine(currentIndex);
    
    // Update pulse marker (always)
    updatePulseMarker(currentLoc);
    
    // Only fly to location if follow mode is on
    if (followMode) {
      mapInstanceRef.current.flyTo([currentLoc.lat, currentLoc.lng], 15, {
        duration: 1,
        easeLinearity: 0.5
      });
    }
    
  }, [currentIndex, followMode, filteredLocations, updateTrailLine, updatePulseMarker]);

  // Update when current index changes
  useEffect(() => {
    if (filteredLocations.length > 0) {
      setSelectedLocation(filteredLocations[currentIndex]);
      panToCurrentLocation();
    }
  }, [currentIndex, filteredLocations, panToCurrentLocation]);

  // Auto-play animation with speed control
  useEffect(() => {
    if (!isPlaying) return;

    const baseInterval = 2000; // Base 2 seconds
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= filteredLocations.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, baseInterval / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, filteredLocations, playbackSpeed]);

  const handlePlay = () => {
    if (currentIndex >= filteredLocations.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredLocations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const handleEnd = () => {
    setCurrentIndex(filteredLocations.length - 1);
    setIsPlaying(false);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Enter fullscreen
      if (mapContainerRef.current?.requestFullscreen) {
        mapContainerRef.current.requestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Invalidate map size after fullscreen change
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Calculate progress percentage
  const progressPercent = filteredLocations.length > 1 
    ? (currentIndex / (filteredLocations.length - 1)) * 100 
    : 0;

  return (
    <div className="flex-1 p-6 bg-dark-900 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <MapPin className="text-primary-500" />
            Location Timeline
          </h1>
          <p className="text-dark-400 mt-1">Track target movement on map</p>
        </div>
      </div>

      {/* Case Info */}
      <CaseInfoBar />

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
              <option value="all">Everyone ({locations.length} points)</option>
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
              <option value="all">All Data Sources</option>
              {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.icon} {config.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <Navigation size={16} />
            <span>{filteredLocations.length} Locations</span>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className={`grid gap-4 ${isFullscreen ? '' : 'grid-cols-3'}`} style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 280px)' }}>
        {/* Map */}
        <div className={isFullscreen ? 'col-span-1' : 'col-span-2'} ref={mapContainerRef}>
          <Card className={`h-full overflow-hidden relative ${isFullscreen ? 'rounded-none' : ''}`}>
            {/* Fullscreen Button - Top Right */}
            {mapLoaded && (
              <button
                onClick={toggleFullscreen}
                className="absolute top-3 right-3 z-[10000] bg-dark-800/90 hover:bg-dark-700 backdrop-blur p-2 rounded-lg transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize size={20} className="text-white" /> : <Maximize size={20} className="text-white" />}
              </button>
            )}
            
            {/* Data Loading State */}
            {isLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-dark-800/80">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
                  <span className="text-dark-300">Loading location data...</span>
                </div>
              </div>
            )}
            
            {/* Empty Data State */}
            {!isLoading && locations.length === 0 && mapLoaded && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-dark-800/90">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Location Data</h3>
                  <p className="text-dark-400 max-w-md">
                    Import location data via Smart Import to visualize movement patterns.
                    Supported formats: GPS logs, Cell Tower data, WiFi locations.
                  </p>
                </div>
              </div>
            )}
            
            {/* Map Loading State */}
            {!mapLoaded ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                <span className="ml-3">Loading map...</span>
              </div>
            ) : (
              <div ref={mapRef} className="h-full w-full" />
            )}
            
            {/* Map Overlay Controls */}
            {mapLoaded && filteredLocations.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4" style={{ zIndex: 10000 }}>
                {/* Progress Bar */}
                <div className="bg-dark-800/95 backdrop-blur-md rounded-lg p-3 shadow-xl border border-dark-600">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-dark-400 w-8">{currentIndex + 1}</span>
                    <div className="flex-1 h-2 bg-dark-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-dark-400 w-8 text-right">{filteredLocations.length}</span>
                  </div>
                  
                  {/* Playback Controls */}
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleReset} disabled={filteredLocations.length === 0}>
                      <SkipBack size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handlePrevious} disabled={currentIndex === 0}>
                      <ChevronLeft size={16} />
                    </Button>
                    <Button
                      variant="primary"
                      onClick={isPlaying ? () => setIsPlaying(false) : handlePlay}
                      disabled={filteredLocations.length === 0}
                      className="px-4"
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleNext} disabled={currentIndex >= filteredLocations.length - 1}>
                      <ChevronRight size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleEnd} disabled={filteredLocations.length === 0}>
                      <SkipForward size={16} />
                    </Button>
                    
                    <div className="w-px h-6 bg-dark-600 mx-2" />
                    
                    {/* Speed Control */}
                    <div className="flex items-center gap-1">
                      <Gauge size={14} className="text-dark-400" />
                      <select
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                        className="bg-dark-700 border border-dark-600 rounded px-2 py-1 text-xs"
                      >
                        {SPEED_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-px h-6 bg-dark-600 mx-2" />
                    
                    {/* Follow Mode Toggle */}
                    <Button
                      variant={followMode ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setFollowMode(!followMode)}
                      title={followMode ? 'Follow Mode: ON' : 'Follow Mode: OFF'}
                    >
                      {followMode ? <Eye size={16} /> : <EyeOff size={16} />}
                    </Button>
                    
                    {/* Center on Current */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const loc = filteredLocations[currentIndex];
                        if (loc && mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo([loc.lat, loc.lng], 15, { duration: 0.5 });
                        }
                      }}
                      title="Center on Current Point"
                    >
                      <Crosshair size={16} />
                    </Button>
                    
                    <div className="w-px h-6 bg-dark-600 mx-2" />
                    
                    {/* Fullscreen Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Timeline Panel - Hidden in fullscreen */}
        {!isFullscreen && (
        <div className="col-span-1 flex flex-col gap-4">
          {/* Current Location Info */}
          {selectedLocation && (
            <Card className="p-4 bg-primary-500/10 border-primary-500/30">
              <div className="flex items-start gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl animate-pulse"
                  style={{ background: SOURCE_CONFIG[selectedLocation.source].color }}
                >
                  {SOURCE_CONFIG[selectedLocation.source].icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-dark-700 px-2 py-0.5 rounded">
                      #{currentIndex + 1}
                    </span>
                    <Badge variant="info" className="text-xs">
                      {SOURCE_CONFIG[selectedLocation.source].label}
                    </Badge>
                  </div>
                  <h3 className="font-semibold mt-1">{selectedLocation.label}</h3>
                  <p className="text-sm text-dark-400">{selectedLocation.address || 'No address'}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-dark-400">
                    <Clock size={12} />
                    {selectedLocation.timestamp.toLocaleString('en-US')}
                  </div>
                  {selectedLocation.personName && (
                    <Badge variant="warning" className="mt-2">
                      👤 {selectedLocation.personName}
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
                Timeline
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {filteredLocations.map((loc, index) => {
                  const isActive = index === currentIndex;
                  const isPast = index < currentIndex;
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
                          setIsPlaying(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          isActive 
                            ? 'bg-primary-500/20 border-2 border-primary-500' 
                            : isPast
                              ? 'bg-dark-700/50 border border-dark-600'
                              : 'bg-dark-800 hover:bg-dark-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                              isActive ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-dark-900' : ''
                            }`}
                            style={{ 
                              background: config.color,
                              opacity: isPast || isActive ? 1 : 0.5
                            }}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm truncate ${isPast || isActive ? 'text-white' : 'text-dark-400'}`}>
                              {loc.label}
                            </div>
                            <div className="text-xs text-dark-400 truncate">{loc.address}</div>
                            <div className="text-xs text-dark-500 mt-1">
                              {loc.timestamp.toLocaleString('en-US')}
                            </div>
                          </div>
                          {isActive && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
        )}
      </div>

      {/* Legend - Hidden in fullscreen */}
      {!isFullscreen && (
      <Card className="p-3">
        <div className="flex items-center gap-6 justify-center flex-wrap">
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
          <div className="w-px h-4 bg-dark-600" />
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <div className="w-8 h-0.5 bg-dark-500" style={{ borderBottom: '2px dashed #6b7280' }} />
            <span>Full Route</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <div className="w-8 h-1 bg-primary-500 rounded" />
            <span>Traveled Path</span>
          </div>
        </div>
      </Card>
      )}

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px] p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="text-primary-400" />
              Add New Location
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
                <label className="text-sm text-dark-400 block mb-1">Location Name</label>
                <input type="text" className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2" placeholder="Suspect's residence" />
              </div>
              <div>
                <label className="text-sm text-dark-400 block mb-1">Date Time</label>
                <input type="datetime-local" className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2" />
              </div>
              <div>
                <label className="text-sm text-dark-400 block mb-1">Data Source</label>
                <select className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2">
                  {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.icon} {config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-dark-400 block mb-1">Notes</label>
                <textarea rows={2} className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2 resize-none" placeholder="Additional details..." />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1" onClick={() => setShowAddModal(false)}>
                  <Plus size={16} className="mr-2" />
                  Add Location
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
