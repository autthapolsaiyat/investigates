/**
 * Legend - Visual legend for node types and colors
 */
import { 
  Building2, 
  Wallet, 
  User, 
  Building, 
  ArrowLeftRight,
  AlertTriangle,
  Shield
} from 'lucide-react';

const legendItems = [
  { icon: Building2, label: 'บัญชีธนาคาร', color: '#3B82F6' },
  { icon: Wallet, label: 'Crypto Wallet', color: '#F59E0B' },
  { icon: User, label: 'บุคคล', color: '#10B981' },
  { icon: Building, label: 'บริษัท', color: '#8B5CF6' },
  { icon: ArrowLeftRight, label: 'Exchange', color: '#EC4899' },
  { icon: AlertTriangle, label: 'ผู้ต้องสงสัย', color: '#EF4444' },
  { icon: Shield, label: 'ผู้เสียหาย', color: '#06B6D4' },
];

const riskLevels = [
  { label: 'สูง (70+)', color: '#EF4444' },
  { label: 'ปานกลาง (40-69)', color: '#F59E0B' },
  { label: 'ต่ำ (20-39)', color: '#FBBF24' },
  { label: 'ปลอดภัย (<20)', color: '#10B981' },
];

export const Legend = () => {
  return (
    <div className="bg-dark-800/95 backdrop-blur-sm border border-dark-600 rounded-xl p-3 shadow-xl">
      <h4 className="text-xs font-semibold text-dark-300 mb-2">สัญลักษณ์</h4>
      
      {/* Node Types */}
      <div className="space-y-1.5 mb-3">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: item.color }}
            >
              <item.icon size={10} className="text-white" />
            </div>
            <span className="text-xs text-dark-300">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-dark-600 pt-2 mt-2">
        <h4 className="text-xs font-semibold text-dark-300 mb-2">ระดับความเสี่ยง</h4>
        <div className="space-y-1">
          {riskLevels.map((level, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: level.color }}
              />
              <span className="text-xs text-dark-400">{level.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Legend;
