/**
 * Call Analysis - วิเคราะห์ข้อมูลโทรศัพท์ (CDR/Call Detail Records)
 * สำหรับงาน Digital Forensic
 * 
 * Features:
 * - CDR Import & Analysis
 * - Call/SMS Timeline
 * - Contact Network Graph
 * - Frequent Contacts
 * - Location Analysis (Cell Tower)
 * - Communication Pattern Detection
 */
import { useState, useEffect, useRef } from 'react';
import {
  Phone, MessageSquare, Clock, Users, MapPin,
  Search, Upload, Download, FileText, Network, BarChart3,
  ArrowUpRight, ArrowDownLeft, PhoneIncoming, PhoneOutgoing,
  PhoneMissed, Calendar, Eye, AlertTriangle,
  Loader2,
  TrendingUp, Smartphone
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';

// Types
interface CallRecord {
  id: string;
  datetime: string;
  fromNumber: string;
  toNumber: string;
  type: 'call_in' | 'call_out' | 'call_missed' | 'sms_in' | 'sms_out';
  duration: number; // seconds
  message?: string;
  cellTower?: string;
  imei?: string;
  status: 'answered' | 'missed' | 'busy' | 'sent' | 'delivered';
}

interface Contact {
  number: string;
  name?: string;
  callCount: number;
  smsCount: number;
  totalDuration: number;
  firstContact: string;
  lastContact: string;
  type: 'suspect' | 'victim' | 'witness' | 'unknown';
  riskLevel: 'low' | 'medium' | 'high';
}

interface TimelineData {
  hour: number;
  calls: number;
  sms: number;
}

interface DailyStats {
  date: string;
  calls: number;
  sms: number;
  duration: number;
}

// Sample data generator
const generateSampleCDR = (targetNumber: string): CallRecord[] => {
  const records: CallRecord[] = [];
  const contacts = [
    '081-111-1111', '082-222-2222', '083-333-3333', '084-444-4444',
    '085-555-5555', '086-666-6666', '087-777-7777', '088-888-8888'
  ];
  
  const now = Date.now();
  for (let i = 0; i < 150; i++) {
    const isOutgoing = Math.random() > 0.4;
    const isSMS = Math.random() > 0.6;
    const contact = contacts[Math.floor(Math.random() * contacts.length)];
    
    let type: CallRecord['type'];
    if (isSMS) {
      type = isOutgoing ? 'sms_out' : 'sms_in';
    } else {
      if (isOutgoing) {
        type = 'call_out';
      } else {
        type = Math.random() > 0.8 ? 'call_missed' : 'call_in';
      }
    }
    
    records.push({
      id: `CDR-${i.toString().padStart(5, '0')}`,
      datetime: new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      fromNumber: isOutgoing ? targetNumber : contact,
      toNumber: isOutgoing ? contact : targetNumber,
      type,
      duration: isSMS ? 0 : Math.floor(Math.random() * 600),
      message: isSMS ? (Math.random() > 0.5 ? 'ยอดวันนี้ ' + Math.floor(Math.random() * 100000) : 'OK รับแล้ว') : undefined,
      cellTower: `BKK-${Math.floor(Math.random() * 50).toString().padStart(3, '0')}`,
      imei: `35${Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0')}`,
      status: type === 'call_missed' ? 'missed' : (isSMS ? 'delivered' : 'answered')
    });
  }
  
  return records.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
};

export const CallAnalysis = () => {
  const [targetNumber, setTargetNumber] = useState('');
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'contacts' | 'graph' | 'patterns' | 'export'>('timeline');
  const [filterType, setFilterType] = useState<'all' | 'calls' | 'sms'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  
  const graphRef = useRef<HTMLDivElement>(null);

  // Analyze CDR data
  const analyzeCDR = async () => {
    if (!targetNumber.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const cdrData = generateSampleCDR(targetNumber);
    setRecords(cdrData);
    
    // Build contacts list
    const contactMap = new Map<string, Contact>();
    cdrData.forEach(record => {
      const otherNumber = record.fromNumber === targetNumber ? record.toNumber : record.fromNumber;
      
      if (!contactMap.has(otherNumber)) {
        contactMap.set(otherNumber, {
          number: otherNumber,
          callCount: 0,
          smsCount: 0,
          totalDuration: 0,
          firstContact: record.datetime,
          lastContact: record.datetime,
          type: 'unknown',
          riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
        });
      }
      
      const contact = contactMap.get(otherNumber)!;
      if (record.type.includes('call')) {
        contact.callCount++;
        contact.totalDuration += record.duration;
      } else {
        contact.smsCount++;
      }
      
      if (new Date(record.datetime) < new Date(contact.firstContact)) {
        contact.firstContact = record.datetime;
      }
      if (new Date(record.datetime) > new Date(contact.lastContact)) {
        contact.lastContact = record.datetime;
      }
    });
    
    const contactList = Array.from(contactMap.values())
      .sort((a, b) => (b.callCount + b.smsCount) - (a.callCount + a.smsCount));
    setContacts(contactList);
    
    // Build timeline data (hourly)
    const hourlyData: TimelineData[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      calls: 0,
      sms: 0
    }));
    
    cdrData.forEach(record => {
      const hour = new Date(record.datetime).getHours();
      if (record.type.includes('call')) {
        hourlyData[hour].calls++;
      } else {
        hourlyData[hour].sms++;
      }
    });
    setTimelineData(hourlyData);
    
    // Build daily stats
    const dailyMap = new Map<string, DailyStats>();
    cdrData.forEach(record => {
      const date = record.datetime.split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, calls: 0, sms: 0, duration: 0 });
      }
      const stats = dailyMap.get(date)!;
      if (record.type.includes('call')) {
        stats.calls++;
        stats.duration += record.duration;
      } else {
        stats.sms++;
      }
    });
    setDailyStats(Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)));
    
    setIsLoading(false);
  };

  // Render network graph
  useEffect(() => {
    if (activeTab === 'graph' && contacts.length > 0 && graphRef.current && window.vis) {
      renderContactGraph();
    }
  }, [activeTab, contacts]);

  const renderContactGraph = () => {
    if (!graphRef.current || !window.vis) return;

    const nodes = [
      {
        id: targetNumber,
        label: targetNumber,
        color: { background: '#3B82F6', border: '#1D4ED8' },
        size: 40,
        font: { color: '#fff', size: 12 },
        shape: 'diamond'
      },
      ...contacts.slice(0, 20).map(contact => ({
        id: contact.number,
        label: contact.name || contact.number,
        color: {
          background: contact.riskLevel === 'high' ? '#DC2626' :
                      contact.riskLevel === 'medium' ? '#F59E0B' : '#22C55E',
          border: contact.riskLevel === 'high' ? '#991B1B' :
                  contact.riskLevel === 'medium' ? '#B45309' : '#15803D'
        },
        size: 15 + Math.min(contact.callCount + contact.smsCount, 30),
        font: { color: '#fff', size: 10 },
        shape: 'dot'
      }))
    ];

    const edges = contacts.slice(0, 20).map(contact => ({
      from: targetNumber,
      to: contact.number,
      width: Math.min(1 + (contact.callCount + contact.smsCount) / 10, 5),
      label: `${contact.callCount}📞 ${contact.smsCount}💬`,
      color: { color: contact.riskLevel === 'high' ? '#DC2626' : '#6B7280' },
      font: { color: '#fff', size: 8 }
    }));

    const data = {
      nodes: new window.vis.DataSet(nodes),
      edges: new window.vis.DataSet(edges)
    };

    const options = {
      nodes: { borderWidth: 2, shadow: true },
      edges: { smooth: { type: 'curvedCW', roundness: 0.2 }, arrows: 'to' },
      physics: { barnesHut: { gravitationalConstant: -2000, springLength: 150 } },
      interaction: { hover: true, tooltipDelay: 100 }
    };

    new window.vis.Network(graphRef.current, data, options);
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get icon for record type
  const getTypeIcon = (type: CallRecord['type']) => {
    switch (type) {
      case 'call_in': return <PhoneIncoming className="text-green-400" size={16} />;
      case 'call_out': return <PhoneOutgoing className="text-blue-400" size={16} />;
      case 'call_missed': return <PhoneMissed className="text-red-400" size={16} />;
      case 'sms_in': return <MessageSquare className="text-green-400" size={16} />;
      case 'sms_out': return <MessageSquare className="text-blue-400" size={16} />;
    }
  };

  // Filter records
  const filteredRecords = records.filter(record => {
    if (filterType === 'calls' && record.type.includes('sms')) return false;
    if (filterType === 'sms' && record.type.includes('call')) return false;
    
    const recordDate = record.datetime.split('T')[0];
    if (recordDate < dateRange.start || recordDate > dateRange.end) return false;
    
    return true;
  });

  // Stats
  const stats = {
    totalCalls: records.filter(r => r.type.includes('call')).length,
    totalSMS: records.filter(r => r.type.includes('sms')).length,
    totalDuration: records.reduce((sum, r) => sum + r.duration, 0),
    uniqueContacts: contacts.length,
    missedCalls: records.filter(r => r.type === 'call_missed').length,
    highRiskContacts: contacts.filter(c => c.riskLevel === 'high').length
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-dark-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Phone className="text-primary-500" />
            Call Analysis
          </h1>
          <p className="text-dark-400 mt-1">
            วิเคราะห์ข้อมูล CDR - Call Detail Records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">
            <Upload size={18} className="mr-2" />
            Import CDR
          </Button>
          <Button variant="secondary">
            <Download size={18} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm text-dark-400 mb-1 block">หมายเลขโทรศัพท์เป้าหมาย</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
              <input
                type="text"
                placeholder="08x-xxx-xxxx"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyzeCDR()}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-dark-400 mb-1 block">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-dark-400 mb-1 block">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div className="pt-5">
            <Button onClick={analyzeCDR} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  กำลังวิเคราะห์...
                </>
              ) : (
                <>
                  <Search size={18} className="mr-2" />
                  วิเคราะห์
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-dark-500">ตัวอย่าง:</span>
          <button
            onClick={() => setTargetNumber('081-111-1111')}
            className="text-primary-400 hover:underline"
          >
            081-111-1111 (หัวหน้าเครือข่าย)
          </button>
          <span className="text-dark-600">|</span>
          <button
            onClick={() => setTargetNumber('082-222-2222')}
            className="text-primary-400 hover:underline"
          >
            082-222-2222 (Operator)
          </button>
        </div>
      </Card>

      {/* Results */}
      {records.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-6 gap-4">
            <Card className="p-4 text-center">
              <Phone className="mx-auto text-blue-400 mb-2" size={24} />
              <p className="text-2xl font-bold">{stats.totalCalls}</p>
              <p className="text-xs text-dark-400">สายทั้งหมด</p>
            </Card>
            <Card className="p-4 text-center">
              <MessageSquare className="mx-auto text-green-400 mb-2" size={24} />
              <p className="text-2xl font-bold">{stats.totalSMS}</p>
              <p className="text-xs text-dark-400">SMS ทั้งหมด</p>
            </Card>
            <Card className="p-4 text-center">
              <Clock className="mx-auto text-yellow-400 mb-2" size={24} />
              <p className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</p>
              <p className="text-xs text-dark-400">เวลาสนทนารวม</p>
            </Card>
            <Card className="p-4 text-center">
              <Users className="mx-auto text-purple-400 mb-2" size={24} />
              <p className="text-2xl font-bold">{stats.uniqueContacts}</p>
              <p className="text-xs text-dark-400">ผู้ติดต่อ</p>
            </Card>
            <Card className="p-4 text-center">
              <PhoneMissed className="mx-auto text-red-400 mb-2" size={24} />
              <p className="text-2xl font-bold">{stats.missedCalls}</p>
              <p className="text-xs text-dark-400">สายที่ไม่ได้รับ</p>
            </Card>
            <Card className="p-4 text-center">
              <AlertTriangle className="mx-auto text-red-400 mb-2" size={24} />
              <p className="text-2xl font-bold text-red-400">{stats.highRiskContacts}</p>
              <p className="text-xs text-dark-400">ผู้ติดต่อเสี่ยงสูง</p>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-dark-700">
            {[
              { id: 'timeline', label: 'Timeline', icon: Clock },
              { id: 'contacts', label: 'ผู้ติดต่อ', icon: Users },
              { id: 'graph', label: 'เครือข่าย', icon: Network },
              { id: 'patterns', label: 'รูปแบบการใช้งาน', icon: BarChart3 },
              { id: 'export', label: 'Export', icon: Download },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-400 bg-dark-800'
                    : 'border-transparent text-dark-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'timeline' && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="text-primary-400" />
                  Timeline ({filteredRecords.length} รายการ)
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="calls">เฉพาะสาย</option>
                    <option value="sms">เฉพาะ SMS</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredRecords.slice(0, 50).map((record) => (
                  <div key={record.id} className="flex items-center gap-4 p-3 bg-dark-800 rounded-lg hover:bg-dark-750">
                    <div className="p-2 bg-dark-700 rounded-lg">
                      {getTypeIcon(record.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">
                          {record.fromNumber === targetNumber ? record.toNumber : record.fromNumber}
                        </span>
                        {record.type.includes('out') ? (
                          <ArrowUpRight className="text-blue-400" size={14} />
                        ) : (
                          <ArrowDownLeft className="text-green-400" size={14} />
                        )}
                      </div>
                      {record.message && (
                        <p className="text-sm text-dark-400 mt-1 truncate max-w-md">
                          "{record.message}"
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-dark-300">
                        {new Date(record.datetime).toLocaleDateString('th-TH')}
                      </p>
                      <p className="text-dark-500">
                        {new Date(record.datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      {record.type.includes('call') ? (
                        <Badge variant={record.status === 'missed' ? 'danger' : 'success'}>
                          {record.status === 'missed' ? 'ไม่รับ' : formatDuration(record.duration)}
                        </Badge>
                      ) : (
                        <Badge variant="info">SMS</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredRecords.length > 50 && (
                <p className="text-center text-dark-400 text-sm mt-4">
                  แสดง 50 จาก {filteredRecords.length} รายการ
                </p>
              )}
            </Card>
          )}

          {activeTab === 'contacts' && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="text-primary-400" />
                ผู้ติดต่อ ({contacts.length} ราย)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-800">
                    <tr>
                      <th className="text-left px-4 py-3">หมายเลข</th>
                      <th className="text-center px-4 py-3">📞 สาย</th>
                      <th className="text-center px-4 py-3">💬 SMS</th>
                      <th className="text-center px-4 py-3">⏱️ เวลารวม</th>
                      <th className="text-left px-4 py-3">ติดต่อครั้งแรก</th>
                      <th className="text-left px-4 py-3">ติดต่อล่าสุด</th>
                      <th className="text-center px-4 py-3">ความเสี่ยง</th>
                      <th className="text-center px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {contacts.map((contact) => (
                      <tr key={contact.number} className="hover:bg-dark-800/50">
                        <td className="px-4 py-3 font-mono">{contact.number}</td>
                        <td className="px-4 py-3 text-center">{contact.callCount}</td>
                        <td className="px-4 py-3 text-center">{contact.smsCount}</td>
                        <td className="px-4 py-3 text-center">{formatDuration(contact.totalDuration)}</td>
                        <td className="px-4 py-3 text-dark-400">
                          {new Date(contact.firstContact).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-4 py-3 text-dark-400">
                          {new Date(contact.lastContact).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={
                            contact.riskLevel === 'high' ? 'danger' :
                            contact.riskLevel === 'medium' ? 'warning' : 'success'
                          }>
                            {contact.riskLevel === 'high' ? 'สูง' :
                             contact.riskLevel === 'medium' ? 'กลาง' : 'ต่ำ'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="sm">
                            <Eye size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'graph' && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Network className="text-primary-400" />
                เครือข่ายการติดต่อ
              </h3>
              <div 
                ref={graphRef}
                className="bg-dark-950 rounded-lg border border-dark-700"
                style={{ height: '500px' }}
              />
              <div className="mt-4 p-3 bg-dark-800 rounded-lg">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500" />
                    <span>หมายเลขเป้าหมาย</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500" />
                    <span>เสี่ยงสูง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500" />
                    <span>เสี่ยงปานกลาง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500" />
                    <span>เสี่ยงต่ำ</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'patterns' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Hourly Pattern */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="text-primary-400" />
                  รูปแบบการใช้งานรายชั่วโมง
                </h3>
                <div className="space-y-2">
                  {timelineData.map((data) => {
                    const total = data.calls + data.sms;
                    const maxTotal = Math.max(...timelineData.map(t => t.calls + t.sms));
                    return (
                      <div key={data.hour} className="flex items-center gap-2">
                        <span className="text-xs text-dark-400 w-12">
                          {data.hour.toString().padStart(2, '0')}:00
                        </span>
                        <div className="flex-1 h-4 bg-dark-700 rounded overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                            style={{ width: `${(total / maxTotal) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs w-8 text-right">{total}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Daily Stats */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="text-primary-400" />
                  สถิติรายวัน
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {dailyStats.slice(-14).map((data) => (
                    <div key={data.date} className="flex items-center justify-between p-2 bg-dark-800 rounded">
                      <span className="text-sm">
                        {new Date(data.date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-blue-400" />
                          {data.calls}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} className="text-green-400" />
                          {data.sms}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-yellow-400" />
                          {formatDuration(data.duration)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Insights */}
              <Card className="p-4 col-span-2">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="text-primary-400" />
                  ข้อสังเกตที่พบ
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">🕐 ช่วงเวลาที่ใช้งานมากที่สุด</h4>
                    <p className="text-2xl font-bold text-primary-400">
                      {timelineData.reduce((max, d) => d.calls + d.sms > max.calls + max.sms ? d : max, timelineData[0]).hour}:00
                    </p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">📞 ผู้ติดต่อบ่อยที่สุด</h4>
                    <p className="text-lg font-bold text-green-400">
                      {contacts[0]?.number || '-'}
                    </p>
                    <p className="text-xs text-dark-400">
                      {contacts[0] ? `${contacts[0].callCount} สาย, ${contacts[0].smsCount} SMS` : ''}
                    </p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">⚠️ ความเสี่ยงที่ตรวจพบ</h4>
                    {stats.highRiskContacts > 0 ? (
                      <p className="text-lg font-bold text-red-400">
                        พบ {stats.highRiskContacts} ผู้ติดต่อเสี่ยงสูง
                      </p>
                    ) : (
                      <p className="text-lg font-bold text-green-400">
                        ไม่พบความผิดปกติ
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'export' && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Download className="text-primary-400" />
                Export ข้อมูล
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <button className="p-6 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors text-left">
                  <FileText className="text-red-400 mb-3" size={32} />
                  <h4 className="font-medium">PDF Report</h4>
                  <p className="text-xs text-dark-400 mt-1">รายงานสำหรับส่งศาล</p>
                </button>
                <button className="p-6 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors text-left">
                  <BarChart3 className="text-green-400 mb-3" size={32} />
                  <h4 className="font-medium">Excel/CSV</h4>
                  <p className="text-xs text-dark-400 mt-1">ข้อมูล CDR ทั้งหมด</p>
                </button>
                <button className="p-6 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors text-left">
                  <Network className="text-blue-400 mb-3" size={32} />
                  <h4 className="font-medium">Graph Image</h4>
                  <p className="text-xs text-dark-400 mt-1">ภาพเครือข่ายการติดต่อ</p>
                </button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {records.length === 0 && !isLoading && (
        <Card className="p-12 text-center">
          <Phone size={64} className="mx-auto text-dark-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">วิเคราะห์ข้อมูลโทรศัพท์</h2>
          <p className="text-dark-400 mb-6">
            ใส่หมายเลขโทรศัพท์เป้าหมายเพื่อวิเคราะห์ข้อมูล CDR
          </p>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg">
              <Phone size={18} className="text-blue-400" />
              <span className="text-sm">Call Records</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg">
              <MessageSquare size={18} className="text-green-400" />
              <span className="text-sm">SMS Records</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg">
              <MapPin size={18} className="text-yellow-400" />
              <span className="text-sm">Location Data</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CallAnalysis;
