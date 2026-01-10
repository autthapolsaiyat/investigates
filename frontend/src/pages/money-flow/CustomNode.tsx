/**
 * CustomNode - Professional node display for Money Flow
 * Shows icon, label, amount, and risk indicator
 */
import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Building2, 
  Wallet, 
  User, 
  Building, 
  ArrowLeftRight,
  AlertTriangle,
  Shield,
  HelpCircle
} from 'lucide-react';

interface CustomNodeData {
  id: number;
  label: string;
  node_type: string;
  identifier?: string;
  bank_name?: string;
  account_name?: string;
  is_suspect: boolean;
  is_victim: boolean;
  risk_score?: number;
  notes?: string;
  color: string;
}

interface CustomNodeProps {
  data: CustomNodeData;
  selected: boolean;
}

// Icon mapping for node types
const getNodeIcon = (nodeType: string, isSuspect: boolean, isVictim: boolean) => {
  if (isSuspect) return AlertTriangle;
  if (isVictim) return Shield;
  
  switch (nodeType) {
    case 'bank_account':
      return Building2;
    case 'crypto_wallet':
      return Wallet;
    case 'person':
      return User;
    case 'company':
      return Building;
    case 'exchange':
      return ArrowLeftRight;
    default:
      return HelpCircle;
  }
};

// Get risk level color
const getRiskColor = (score: number = 0) => {
  if (score >= 70) return '#EF4444'; // Red - High Risk
  if (score >= 40) return '#F59E0B'; // Amber - Medium Risk
  if (score >= 20) return '#FBBF24'; // Yellow - Low Risk
  return '#10B981'; // Green - Safe
};

// Get risk level text
const getRiskText = (score: number = 0) => {
  if (score >= 70) return 'สูง';
  if (score >= 40) return 'ปานกลาง';
  if (score >= 20) return 'ต่ำ';
  return 'ปลอดภัย';
};

export const CustomNode = memo(({ data, selected }: CustomNodeProps) => {
  const Icon = getNodeIcon(data.node_type, data.is_suspect, data.is_victim);
  const riskColor = getRiskColor(data.risk_score);
  const hasRisk = (data.risk_score || 0) > 0;

  return (
    <>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-dark-600 border-2 border-dark-400"
      />

      {/* Node Container */}
      <div
        className={`
          relative flex flex-col items-center p-3 rounded-xl
          transition-all duration-200 cursor-pointer
          ${selected 
            ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-dark-900 scale-105' 
            : 'hover:scale-105'
          }
        `}
        style={{
          backgroundColor: `${data.color}20`,
          borderWidth: 2,
          borderColor: data.color,
          minWidth: 120,
        }}
      >
        {/* Risk Badge - Top Right */}
        {hasRisk && (
          <div 
            className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-lg"
            style={{ backgroundColor: riskColor }}
          >
            {data.risk_score}
          </div>
        )}

        {/* Suspect/Victim Badge */}
        {(data.is_suspect || data.is_victim) && (
          <div 
            className={`
              absolute -top-2 -left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-lg
              ${data.is_suspect ? 'bg-red-500' : 'bg-cyan-500'}
            `}
          >
            {data.is_suspect ? 'ผู้ต้องสงสัย' : 'ผู้เสียหาย'}
          </div>
        )}

        {/* Icon Circle */}
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-lg"
          style={{ backgroundColor: data.color }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Label */}
        <div className="text-center">
          <div className="text-sm font-semibold text-white truncate max-w-[100px]">
            {data.label}
          </div>
          
          {/* Sub-label (bank name or type) */}
          {data.bank_name && (
            <div className="text-xs text-dark-400 truncate max-w-[100px]">
              {data.bank_name}
            </div>
          )}
          
          {/* Node Type Badge */}
          <div 
            className="mt-1 px-2 py-0.5 rounded text-xs font-medium"
            style={{ 
              backgroundColor: `${data.color}30`,
              color: data.color 
            }}
          >
            {data.node_type === 'bank_account' ? 'บัญชีธนาคาร' :
             data.node_type === 'crypto_wallet' ? 'Crypto Wallet' :
             data.node_type === 'person' ? 'บุคคล' :
             data.node_type === 'company' ? 'บริษัท' :
             data.node_type === 'exchange' ? 'Exchange' : 'อื่นๆ'}
          </div>
        </div>

        {/* Risk Indicator Bar */}
        {hasRisk && (
          <div className="w-full mt-2">
            <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${Math.min(data.risk_score || 0, 100)}%`,
                  backgroundColor: riskColor 
                }}
              />
            </div>
            <div className="text-xs text-center mt-0.5" style={{ color: riskColor }}>
              ความเสี่ยง: {getRiskText(data.risk_score)}
            </div>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-dark-600 border-2 border-dark-400"
      />
    </>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
