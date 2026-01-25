import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Modal, Button, Tag, Space, Descriptions, Table, Divider,
  message, Popconfirm, Row, Col, Progress, Input, Radio
} from 'antd';
import {
  EditOutlined, SendOutlined, CheckCircleOutlined,
  CloseCircleOutlined, FileTextOutlined, ShoppingCartOutlined,
  ArrowLeftOutlined, FilePdfOutlined, PrinterOutlined, SearchOutlined
} from '@ant-design/icons';
import QuotationFlowProgress from '../../components/quotation/QuotationFlowProgress';
import QuotationPrintPreview from '../../components/quotation/QuotationPrintPreview';
import { PurchaseOrderPrintPreview, GoodsReceiptPrintPreview, TaxInvoicePrintPreview, ReceiptPrintPreview } from '../../components/print';
import { quotationsApi, purchaseOrdersApi, salesInvoicesApi, goodsReceiptsApi, suppliersApi, warehousesApi } from '../../services/api';
import type { Quotation, QuotationItem, QuotationType, QuotationStatus } from '../../types/quotation';
import { useActiveQuotation } from '../../contexts/ActiveQuotationContext';

const typeLabels: Record<QuotationType, { text: string; color: string; icon: string }> = {
  STANDARD: { text: 'Accustandard/PT', color: 'blue', icon: '🧪' },
  FORENSIC: { text: 'นิติวิทยาศาสตร์', color: 'purple', icon: '🔬' },
  MAINTENANCE: { text: 'บำรุงรักษา', color: 'green', icon: '🔧' },
  LAB: { text: 'เครื่องมือวิทยาศาสตร์', color: 'orange', icon: '🏭' },
};

const statusLabels: Record<QuotationStatus, { text: string; color: string }> = {
  DRAFT: { text: 'ร่าง', color: 'default' },
  PENDING: { text: 'รออนุมัติ', color: 'orange' },
  APPROVED: { text: 'อนุมัติแล้ว', color: 'green' },
  SENT: { text: 'ส่งแล้ว', color: 'blue' },
  CONFIRMED: { text: 'ยืนยันแล้ว', color: 'cyan' },
  PARTIALLY_CLOSED: { text: 'ปิดบางส่วน', color: 'geekblue' },
  CLOSED: { text: 'ปิดแล้ว', color: 'green' },
  CANCELLED: { text: 'ยกเลิก', color: 'red' },
};

const itemStatusLabels: Record<string, { text: string; color: string }> = {
  PENDING: { text: 'รอสั่งซื้อ', color: 'default' },
  ORDERED: { text: 'สั่งซื้อแล้ว', color: 'processing' },
  PARTIAL: { text: 'รับบางส่วน', color: 'warning' },
  RECEIVED: { text: 'รับครบ', color: 'success' },
  SOLD: { text: 'ขายแล้ว', color: 'green' },
  CANCELLED: { text: 'ยกเลิก', color: 'error' },
};

const QuotationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setActiveQuotation } = useActiveQuotation();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [poPrintOpen, setPoPrintOpen] = useState(false);
  const [grPrintOpen, setGrPrintOpen] = useState(false);
  const [invPrintOpen, setInvPrintOpen] = useState(false);
  const [receiptPrintOpen, setReceiptPrintOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<'QT' | 'PO' | 'GR' | 'INV' | 'PAID'>('QT');
  const [relatedDocs, setRelatedDocs] = useState<{
    purchaseOrders: any[];
    goodsReceipts: any[];
    invoices: any[];
  }>({ purchaseOrders: [], goodsReceipts: [], invoices: [] });
  
  // Supplier selection modal
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [creatingPO, setCreatingPO] = useState(false);
  const [supplierSearchText, setSupplierSearchText] = useState('');
  
  // Warehouse selection modal (for GR)
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [creatingGR, setCreatingGR] = useState(false);
  const [warehouseSearchText, setWarehouseSearchText] = useState('');
  
  // Payment modal (for Mark Paid)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('TRANSFER');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (id) {
      loadQuotation(parseInt(id));
    }
  }, [id]);
  
  useEffect(() => {
    // Load suppliers when modal opens
    if (supplierModalOpen) {
      loadSuppliers();
    }
  }, [supplierModalOpen]);
  
  useEffect(() => {
    // Load warehouses when modal opens
    if (warehouseModalOpen) {
      loadWarehouses();
    }
  }, [warehouseModalOpen]);
  
  const loadSuppliers = async () => {
    try {
      const res = await suppliersApi.getAll();
      setSuppliers(res.data || []);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };
  
  const loadWarehouses = async () => {
    try {
      const res = await warehousesApi.getAll();
      setWarehouses(res.data || []);
      // Auto-select first warehouse if only one
      if (res.data?.length === 1) {
        setSelectedWarehouseId(res.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    }
  };

  const loadQuotation = async (quotationId: number) => {
    setLoading(true);
    try {
      const response = await quotationsApi.getById(quotationId);
      setQuotation(response.data);
      
      // Load related documents
      const [poRes, grRes, invRes] = await Promise.all([
        purchaseOrdersApi.getByQuotation(quotationId).catch(() => ({ data: [] })),
        goodsReceiptsApi.getByQuotation(quotationId).catch(() => ({ data: [] })),
        salesInvoicesApi.getByQuotation(quotationId).catch(() => ({ data: [] })),
      ]);
      
      setRelatedDocs({
        purchaseOrders: Array.isArray(poRes.data) ? poRes.data : [],
        goodsReceipts: Array.isArray(grRes.data) ? grRes.data : [],
        invoices: Array.isArray(invRes.data) ? invRes.data : [],
      });

      // Set active quotation for floating progress bar
      const q = response.data;
      const pos = Array.isArray(poRes.data) ? poRes.data : [];
      const grs = Array.isArray(grRes.data) ? grRes.data : [];
      const invs = Array.isArray(invRes.data) ? invRes.data : [];
      
      setActiveQuotation({
        id: q.id,
        docFullNo: q.docFullNo || '',
        status: q.status || 'DRAFT',
        customerName: q.customerName || '',
        grandTotal: Number(q.grandTotal) || 0,
        relatedDocs: {
          po: pos[0] ? { id: pos[0].id, docNo: pos[0].docFullNo, status: pos[0].status } : undefined,
          gr: grs[0] ? { id: grs[0].id, docNo: grs[0].docFullNo, status: grs[0].status } : undefined,
          inv: invs.find((i: any) => i.status === 'PAID') || invs.find((i: any) => i.status === 'POSTED') || invs[0] 
            ? { id: (invs.find((i: any) => i.status === 'PAID') || invs.find((i: any) => i.status === 'POSTED') || invs[0]).id, 
                docNo: (invs.find((i: any) => i.status === 'PAID') || invs.find((i: any) => i.status === 'POSTED') || invs[0]).docFullNo, 
                status: (invs.find((i: any) => i.status === 'PAID') || invs.find((i: any) => i.status === 'POSTED') || invs[0]).status } 
            : undefined,
        },
      });
    } catch (error) {
      message.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      await quotationsApi.send(parseInt(id!));
      message.success('ส่งใบเสนอราคาสำเร็จ');
      loadQuotation(parseInt(id!));
    } catch (error) {
      message.error('ไม่สามารถส่งได้');
    }
  };

  const handleConfirm = async () => {
    try {
      await quotationsApi.confirm(parseInt(id!));
      message.success('ยืนยันใบเสนอราคาสำเร็จ');
      loadQuotation(parseInt(id!));
    } catch (error) {
      message.error('ไม่สามารถยืนยันได้');
    }
  };

  const handleRevision = () => {
    Modal.confirm({
      title: 'สร้าง Revision ใหม่',
      content: 'คุณต้องการสร้าง Revision ใหม่ของใบเสนอราคานี้ใช่หรือไม่? Revision ใหม่จะถูกสร้างเป็นร่างและสามารถแก้ไขได้',
      okText: 'สร้าง Revision',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          const res = await quotationsApi.createRevision(parseInt(id!), 'แก้ไขจากหน้า UI');
          message.success('สร้าง Revision สำเร็จ');
          navigate('/quotations/' + res.data.id);
        } catch (error: any) {
          message.error(error.response?.data?.message || 'ไม่สามารถสร้าง Revision ได้');
        }
      },
    });
  };

  const handleCancel = async () => {
    try {
      await quotationsApi.cancel(parseInt(id!));
      message.success('ยกเลิกใบเสนอราคาสำเร็จ');
      loadQuotation(parseInt(id!));
    } catch (error) {
      message.error('ไม่สามารถยกเลิกได้');
    }
  };

  const handleCreatePO = () => {
    // Open modal to select supplier
    setSelectedSupplierId(null);
    setSupplierModalOpen(true);
  };
  
  const handleConfirmCreatePO = async () => {
    if (!selectedSupplierId) {
      message.warning('กรุณาเลือกผู้จำหน่าย');
      return;
    }
    
    setCreatingPO(true);
    try {
      await purchaseOrdersApi.createFromQuotation(parseInt(id!), selectedSupplierId);
      message.success('สร้างใบสั่งซื้อสำเร็จ');
      setSupplierModalOpen(false);
      setSupplierSearchText('');
      // Reload quotation to update timeline
      await loadQuotation(parseInt(id!));
    } catch (error: any) {
      message.error(error.response?.data?.message || 'ไม่สามารถสร้างใบสั่งซื้อได้');
    } finally {
      setCreatingPO(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      await salesInvoicesApi.createFromQuotation(parseInt(id!));
      message.success('สร้างใบแจ้งหนี้สำเร็จ');
      // Reload quotation to update timeline
      await loadQuotation(parseInt(id!));
    } catch (error: any) {
      message.error(error.response?.data?.message || 'ไม่สามารถสร้างใบแจ้งหนี้ได้');
    }
  };

  // Open payment modal
  const handleMarkPaid = () => {
    const inv = relatedDocs.invoices.find(i => i.status === "POSTED") || relatedDocs.invoices[0];
    if (!inv) {
      message.error("ไม่พบใบแจ้งหนี้ที่สามารถบันทึกชำระได้");
      return;
    }
    setPaymentMethod('TRANSFER');
    setPaymentReference('');
    setPaymentModalOpen(true);
  };
  
  // Confirm payment
  const handleConfirmPayment = async () => {
    const inv = relatedDocs.invoices.find(i => i.status === "POSTED") || relatedDocs.invoices[0];
    if (!inv) return;
    
    setProcessingPayment(true);
    try {
      await salesInvoicesApi.markPaid(inv.id, { paymentMethod, paymentReference });
      message.success("บันทึกชำระเงินสำเร็จ");
      setPaymentModalOpen(false);
      await loadQuotation(parseInt(id!));
    } catch (error: any) {
      message.error(error.response?.data?.message || "ไม่สามารถบันทึกชำระเงินได้");
    } finally {
      setProcessingPayment(false);
    }
  };

  // NEW: Approve PO from QT Detail
  const handleApprovePO = async () => {
    const po = relatedDocs.purchaseOrders.find(p => p.status === 'DRAFT' || p.status === 'PENDING_APPROVAL');
    if (!po) {
      message.error("ไม่พบใบสั่งซื้อที่รออนุมัติ");
      return;
    }
    try {
      await purchaseOrdersApi.approve(po.id);
      message.success("อนุมัติใบสั่งซื้อสำเร็จ");
      await loadQuotation(parseInt(id!));
    } catch (error: any) {
      message.error(error.response?.data?.message || "ไม่สามารถอนุมัติได้");
    }
  };

  // Open warehouse modal for GR
  const handleCreateGR = () => {
    const po = relatedDocs.purchaseOrders.find(p => p.status === 'APPROVED' || p.status === 'SENT');
    if (!po) {
      message.error("ไม่พบใบสั่งซื้อที่อนุมัติแล้ว");
      return;
    }
    setSelectedWarehouseId(null);
    setWarehouseModalOpen(true);
  };
  
  // Confirm create GR with selected warehouse
  const handleConfirmCreateGR = async () => {
    if (!selectedWarehouseId) {
      message.warning('กรุณาเลือกคลังสินค้า');
      return;
    }
    
    const po = relatedDocs.purchaseOrders.find(p => p.status === 'APPROVED' || p.status === 'SENT');
    if (!po) return;
    
    setCreatingGR(true);
    try {
      await goodsReceiptsApi.createFromPO(po.id, { warehouseId: selectedWarehouseId });
      message.success("สร้างใบรับสินค้าสำเร็จ");
      setWarehouseModalOpen(false);
      setWarehouseSearchText('');
      await loadQuotation(parseInt(id!));
    } catch (error: any) {
      message.error(error.response?.data?.message || "ไม่สามารถสร้างใบรับสินค้าได้");
    } finally {
      setCreatingGR(false);
    }
  };

  // NEW: Post GR
  const handlePostGR = async () => {
    const gr = relatedDocs.goodsReceipts.find(g => g.status === 'DRAFT');
    if (!gr) {
      message.error("ไม่พบใบรับสินค้าที่รอบันทึก");
      return;
    }
    try {
      await goodsReceiptsApi.post(gr.id);
      message.success("บันทึกรับสินค้าสำเร็จ");
      await loadQuotation(parseInt(id!));
    } catch (error: any) {
      message.error(error.response?.data?.message || "ไม่สามารถบันทึกได้");
    }
  };

  // NEW: Post Invoice
  const handlePostInvoice = async () => {
    const inv = relatedDocs.invoices.find(i => i.status === 'DRAFT');
    if (!inv) {
      message.error("ไม่พบใบแจ้งหนี้ที่รอบันทึก");
      return;
    }
    try {
      await salesInvoicesApi.post(inv.id);
      message.success("บันทึกใบแจ้งหนี้สำเร็จ");
      await loadQuotation(parseInt(id!));
    } catch (error: any) {
      message.error(error.response?.data?.message || "ไม่สามารถบันทึกได้");
    }
  };

  if (loading || !quotation) {
    return <div style={{ padding: 24, textAlign: 'center' }}>กำลังโหลด...</div>;
  }

  const typeConfig = typeLabels[quotation.quotationType] || { text: quotation.quotationType, color: "default", icon: "📄" };
  const statusConfig = statusLabels[quotation.status] || { text: quotation.status, color: "default" };

  const totalItems = quotation.items?.length || 0;
  const soldItems = quotation.items?.filter(i => i.itemStatus === 'SOLD').length || 0;
  const fulfillmentPercent = totalItems > 0 ? (soldItems / totalItems) * 100 : 0;

  const itemColumns = [
    {
      title: '#',
      dataIndex: 'lineNo',
      width: 50,
      align: 'center' as const,
    },
    {
      title: 'สินค้า',
      dataIndex: 'itemName',
      render: (text: string, record: QuotationItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.sourceType === 'TEMP' && <Tag color="orange">🔶</Tag>}
            {text}
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.itemCode}</div>
        </div>
      ),
    },
    {
      title: 'จำนวน',
      dataIndex: 'qty',
      width: 80,
      align: 'center' as const,
      render: (val: number, record: QuotationItem) => (
        <span>{val} {record.unit}</span>
      ),
    },
    {
      title: 'ราคา/หน่วย',
      dataIndex: 'unitPrice',
      width: 120,
      align: 'right' as const,
      render: (val: number) => `฿${Number(val || 0).toLocaleString()}`,
    },
    {
      title: 'Margin',
      dataIndex: 'expectedMarginPercent',
      width: 80,
      align: 'center' as const,
      render: (val: number) => {
        const percent = Number(val || 0);
        return (
          <Tag color={percent < 10 ? 'warning' : percent >= 20 ? 'green' : 'blue'}>
            {percent.toFixed(1)}%
          </Tag>
        );
      },
    },
    {
      title: 'รวม',
      dataIndex: 'lineTotal',
      width: 120,
      align: 'right' as const,
      render: (val: number) => `฿${Number(val || 0).toLocaleString()}`,
    },
    {
      title: 'สถานะ',
      dataIndex: 'itemStatus',
      width: 100,
      render: (status: string) => {
        const config = itemStatusLabels[status] || { text: status, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  // Render detail card based on selected step
  const renderStepDetail = () => {
    const po = relatedDocs.purchaseOrders[0];
    const gr = relatedDocs.goodsReceipts[0];
    const inv = relatedDocs.invoices.find(i => i.status === 'PAID') || relatedDocs.invoices.find(i => i.status === 'POSTED') || relatedDocs.invoices[0];

    const statusColors: Record<string, string> = {
      DRAFT: 'default', CONFIRMED: 'cyan', APPROVED: 'green', POSTED: 'green', 
      PAID: 'green', PENDING: 'orange', SENT: 'blue', CANCELLED: 'red'
    };

    switch (selectedStep) {
      case 'PO':
        if (!po) return <Card><div style={{ textAlign: 'center', color: '#666', padding: 40 }}>ยังไม่มีใบสั่งซื้อ</div></Card>;
        return (
          <Card title={<span>🛒 ใบสั่งซื้อ: {po.docFullNo}</span>} extra={<Button icon={<PrinterOutlined />} onClick={() => setPoPrintOpen(true)}>พิมพ์</Button>}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Card type="inner" title="📋 ข้อมูลเอกสาร" size="small" style={{ marginBottom: 16 }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="เลขที่">{po.docFullNo}</Descriptions.Item>
                    <Descriptions.Item label="สถานะ"><Tag color={statusColors[po.status]}>{po.status}</Tag></Descriptions.Item>
                    <Descriptions.Item label="วันที่">{po.docDate ? new Date(po.docDate).toLocaleDateString('th-TH') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="กำหนดส่ง">{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('th-TH') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="ยอดรวม"><strong style={{ color: '#1890ff', fontSize: 16 }}>฿{Number(po.grandTotal || 0).toLocaleString()}</strong></Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card type="inner" title="🏭 ข้อมูลผู้จำหน่าย" size="small" style={{ marginBottom: 16 }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="ชื่อ"><strong>{po.supplierName || '-'}</strong></Descriptions.Item>
                    <Descriptions.Item label="ที่อยู่">{po.supplierAddress || '-'}</Descriptions.Item>
                    <Descriptions.Item label="ติดต่อ">{po.supplierContact || po.contactPerson || '-'}</Descriptions.Item>
                    <Descriptions.Item label="โทร">{po.supplierPhone || '-'}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
            {po.items && po.items.length > 0 && (
              <Table
                dataSource={po.items}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: 'สินค้า', dataIndex: 'itemName', ellipsis: true },
                  { title: 'จำนวน', dataIndex: 'qty', width: 80, align: 'center' as const, render: (v: number, r: any) => `${v} ${r.unit}` },
                  { title: 'ราคา/หน่วย', dataIndex: 'unitPrice', width: 100, align: 'right' as const, render: (v: number) => `฿${Number(v||0).toLocaleString()}` },
                  { title: 'รวม', dataIndex: 'lineTotal', width: 100, align: 'right' as const, render: (v: number) => `฿${Number(v||0).toLocaleString()}` },
                ]}
              />
            )}
          </Card>
        );

      case 'GR':
        if (!gr) return <Card><div style={{ textAlign: 'center', color: '#666', padding: 40 }}>ยังไม่มีใบรับสินค้า</div></Card>;
        return (
          <Card title={<span>📦 ใบรับสินค้า: {gr.docFullNo}</span>} extra={<Button icon={<PrinterOutlined />} onClick={() => setGrPrintOpen(true)}>พิมพ์</Button>}>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="เลขที่">{gr.docFullNo}</Descriptions.Item>
              <Descriptions.Item label="สถานะ"><Tag color={statusColors[gr.status]}>{gr.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="คลังสินค้า">{gr.warehouseName || '-'}</Descriptions.Item>
              <Descriptions.Item label="วันที่รับ">{gr.receiveDate ? new Date(gr.receiveDate).toLocaleDateString('th-TH') : '-'}</Descriptions.Item>
              <Descriptions.Item label="ยอดรวม">฿{Number(gr.grandTotal || 0).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="จำนวนรายการ">{gr.items?.length || gr.totalItems || 0} รายการ</Descriptions.Item>
            </Descriptions>
            {gr.items && gr.items.length > 0 && (
              <Table
                style={{ marginTop: 16 }}
                dataSource={gr.items}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: 'สินค้า', dataIndex: 'itemName', ellipsis: true },
                  { title: 'จำนวนรับ', dataIndex: 'qty', width: 80, align: 'center' as const, render: (v: number, r: any) => `${v} ${r.unit}` },
                  { title: 'ต้นทุน', dataIndex: 'unitCost', width: 100, align: 'right' as const, render: (v: number) => `฿${Number(v||0).toLocaleString()}` },
                ]}
              />
            )}
          </Card>
        );

      case 'INV':
        if (!inv) return <Card><div style={{ textAlign: 'center', color: '#666', padding: 40 }}>ยังไม่มีใบแจ้งหนี้</div></Card>;
        return (
          <Card title={<span>📄 ใบแจ้งหนี้: {inv.docFullNo}</span>} extra={<Button icon={<PrinterOutlined />} onClick={() => setInvPrintOpen(true)}>พิมพ์ใบกำกับภาษี</Button>}>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="เลขที่">{inv.docFullNo}</Descriptions.Item>
              <Descriptions.Item label="สถานะ"><Tag color={statusColors[inv.status]}>{inv.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="ลูกค้า">{inv.customerName || quotation.customerName}</Descriptions.Item>
              <Descriptions.Item label="วันที่">{inv.docDate ? new Date(inv.docDate).toLocaleDateString('th-TH') : '-'}</Descriptions.Item>
              <Descriptions.Item label="ยอดรวม">฿{Number(inv.grandTotal || 0).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="จำนวนรายการ">{inv.items?.length || inv.totalItems || 0} รายการ</Descriptions.Item>
            </Descriptions>
            {inv.items && inv.items.length > 0 && (
              <Table
                style={{ marginTop: 16 }}
                dataSource={inv.items}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: 'สินค้า', dataIndex: 'itemName', ellipsis: true },
                  { title: 'จำนวน', dataIndex: 'qty', width: 80, align: 'center' as const, render: (v: number, r: any) => `${v} ${r.unit}` },
                  { title: 'ราคา', dataIndex: 'unitPrice', width: 100, align: 'right' as const, render: (v: number) => `฿${Number(v||0).toLocaleString()}` },
                ]}
              />
            )}
          </Card>
        );

      case 'PAID':
        if (!inv || inv.status !== 'PAID') return <Card><div style={{ textAlign: 'center', color: '#666', padding: 40 }}>ยังไม่ได้ชำระเงิน</div></Card>;
        return (
          <Card title={<span>💰 การชำระเงิน</span>} extra={<Button icon={<PrinterOutlined />} onClick={() => setReceiptPrintOpen(true)}>พิมพ์ใบเสร็จ</Button>}>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="ใบแจ้งหนี้">{inv.docFullNo}</Descriptions.Item>
              <Descriptions.Item label="สถานะ"><Tag color="green">ชำระแล้ว</Tag></Descriptions.Item>
              <Descriptions.Item label="ยอดชำระ">฿{Number(inv.grandTotal || 0).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="วิธีชำระ">{inv.paymentMethod || 'เงินสด'}</Descriptions.Item>
              <Descriptions.Item label="วันที่ชำระ">{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('th-TH') : '-'}</Descriptions.Item>
              <Descriptions.Item label="อ้างอิง">{inv.paymentReference || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        );

      default: // QT
        return (
          <>
            <Card title="ข้อมูลลูกค้า" style={{ marginBottom: 16 }}>
              <Descriptions column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="ลูกค้า">{quotation.customerName}</Descriptions.Item>
                <Descriptions.Item label="ผู้ติดต่อ">{quotation.contactPerson}</Descriptions.Item>
                <Descriptions.Item label="โทรศัพท์">{quotation.contactPhone}</Descriptions.Item>
                <Descriptions.Item label="อีเมล">{quotation.contactEmail}</Descriptions.Item>
                <Descriptions.Item label="ที่อยู่" span={2}>{quotation.customerAddress}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="รายการสินค้า" style={{ marginBottom: 16 }}>
              <Table
                columns={itemColumns}
                dataSource={quotation.items}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>

            <Card title="สรุปยอด">
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="วันที่">
                      {new Date(quotation.docDate).toLocaleDateString('th-TH')}
                    </Descriptions.Item>
                    <Descriptions.Item label="ยืนราคา">{quotation.validDays} วัน</Descriptions.Item>
                    <Descriptions.Item label="กำหนดส่งมอบ">{quotation.deliveryDays} วัน</Descriptions.Item>
                    <Descriptions.Item label="เครดิต">{quotation.creditTermDays} วัน</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={24} md={12}>
                  <div style={{ fontSize: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>รวมสินค้า:</span>
                      <span>฿{Number(quotation.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {Number(quotation.discountAmount || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#f5222d' }}>
                        <span>ส่วนลด:</span>
                        <span>-฿{Number(quotation.discountAmount).toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>VAT {quotation.taxRate}%:</span>
                      <span>฿{Number(quotation.taxAmount || 0).toLocaleString()}</span>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 18 }}>
                      <span>ยอดสุทธิ:</span>
                      <span>฿{Number(quotation.grandTotal || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </>
        );
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/quotations')}
            style={{ marginBottom: 8 }}
          >
            กลับ
          </Button>
          <h1 style={{ margin: 0, fontSize: 24 }}>
            📋 {quotation.docFullNo}
          </h1>
          <Space style={{ marginTop: 8 }}>
            <Tag color={typeConfig.color}>{typeConfig.icon} {typeConfig.text}</Tag>
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
          </Space>
        </div>
        
        {/* Actions */}
        <Space wrap>
          {quotation.status === 'DRAFT' && (
            <>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/quotations/${id}/edit`)}>
                แก้ไข
              </Button>
              <Popconfirm title="ส่งใบเสนอราคาให้ลูกค้า?" onConfirm={handleSend}>
                <Button type="primary" icon={<SendOutlined />}>
                  ส่งลูกค้า
                </Button>
              </Popconfirm>
            </>
          )}
          
          {quotation.status === 'SENT' && (
            <>
              <Popconfirm title="ลูกค้ายืนยันรับงาน?" onConfirm={handleConfirm}>
                <Button type="primary" icon={<CheckCircleOutlined />}>
                  ยืนยันรับงาน
                </Button>
              </Popconfirm>
              <Button icon={<EditOutlined />} onClick={handleRevision} style={{ borderColor: '#fbbf24', color: '#fbbf24' }}>
                สร้าง Revision
              </Button>
            </>
          )}
          
          {(['CONFIRMED', 'PARTIALLY_CLOSED'] as string[]).includes(quotation.status) && (
            <>
              <Button type="primary" icon={<FileTextOutlined />} onClick={handleCreatePO}>
                สร้าง PO
              </Button>
              <Button icon={<ShoppingCartOutlined />} onClick={handleCreateInvoice}>
                สร้างใบแจ้งหนี้
              </Button>
              <Button icon={<EditOutlined />} onClick={handleRevision} style={{ borderColor: '#fbbf24', color: '#fbbf24' }}>
                สร้าง Revision
              </Button>
            </>
          )}
          
          {quotation.status === 'DRAFT' && (
            <Popconfirm title="ยกเลิกใบเสนอราคา?" onConfirm={handleCancel}>
              <Button danger icon={<CloseCircleOutlined />}>
                ยกเลิก
              </Button>
            </Popconfirm>
          )}
          
          <Button icon={<FilePdfOutlined />} onClick={() => setPrintPreviewOpen(true)}>
            พิมพ์ PDF
          </Button>
        </Space>
      </div>
      

      {/* Flow Progress */}
      <QuotationFlowProgress
        quotation={{
          docFullNo: quotation.docFullNo || "",
          status: quotation.status || "DRAFT",
          customerName: quotation.customerName || "",
          grandTotal: Number(quotation.grandTotal),
          docDate: quotation.docDate || "",
        }}
        relatedDocs={{
          po: relatedDocs.purchaseOrders[0] ? {
            id: relatedDocs.purchaseOrders[0].id,
            docNo: relatedDocs.purchaseOrders[0].docFullNo,
            status: relatedDocs.purchaseOrders[0].status,
          } : undefined,
          gr: relatedDocs.goodsReceipts[0] ? {
            id: relatedDocs.goodsReceipts[0].id,
            docNo: relatedDocs.goodsReceipts[0].docFullNo,
            status: relatedDocs.goodsReceipts[0].status,
          } : undefined,
          inv: (() => { const best = relatedDocs.invoices.find(i => i.status === "PAID") || relatedDocs.invoices.find(i => i.status === "POSTED") || relatedDocs.invoices[0]; return best ? {
            id: best.id,
            docNo: best.docFullNo,
            status: best.status,
          } : undefined; })(),
        }}
    	        onNavigate={(type, _docId) => {
          if (type === "po") navigate(`/purchase-orders`);
          if (type === "gr") navigate(`/goods-receipts`);
          if (type === "inv") navigate(`/sales-invoices`);
        }}
        selectedStep={selectedStep}
        onStepClick={setSelectedStep}
        onCreatePO={handleCreatePO}
        onApprovePO={handleApprovePO}
        onCreateGR={handleCreateGR}
        onPostGR={handlePostGR}
        onCreateInvoice={handleCreateInvoice}
        onPostInvoice={handlePostInvoice}
        onMarkPaid={handleMarkPaid}
      />
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          {renderStepDetail()}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="ความคืบหน้า" style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Progress
                type="circle"
                percent={Math.round(fulfillmentPercent)}
                format={() => `${soldItems}/${totalItems}`}
              />
            </div>
            <div style={{ textAlign: 'center', color: '#888' }}>
              รายการที่ขายแล้ว
            </div>
          </Card>

          <Card title="เอกสารที่เกี่ยวข้อง" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <strong>📦 ใบสั่งซื้อ (PO):</strong>
              {relatedDocs.purchaseOrders.length > 0 ? (
                relatedDocs.purchaseOrders.map(po => (
                  <Button key={po.id} type="link" size="small" onClick={() => setSelectedStep('PO')}>
                    {po.docFullNo}
                  </Button>
                ))
              ) : (
                <span style={{ color: '#888', marginLeft: 8 }}>ยังไม่มี</span>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>📥 ใบรับสินค้า (GR):</strong>
              {relatedDocs.goodsReceipts.length > 0 ? (
                relatedDocs.goodsReceipts.map(gr => (
                  <Button key={gr.id} type="link" size="small" onClick={() => setSelectedStep('GR')}>
                    {gr.docFullNo}
                  </Button>
                ))
              ) : (
                <span style={{ color: '#888', marginLeft: 8 }}>ยังไม่มี</span>
              )}
            </div>
            <div>
              <strong>🧾 ใบแจ้งหนี้ (INV):</strong>
              {relatedDocs.invoices.length > 0 ? (
                relatedDocs.invoices.map(inv => (
                  <Button key={inv.id} type="link" size="small" onClick={() => setSelectedStep('INV')}>
                    {inv.docFullNo}
                  </Button>
                ))
              ) : (
                <span style={{ color: '#888', marginLeft: 8 }}>ยังไม่มี</span>
              )}
            </div>
          </Card>
        </Col>
      </Row>
      
      {quotation && (
        <QuotationPrintPreview
          open={printPreviewOpen}
          onClose={() => setPrintPreviewOpen(false)}
          quotation={{
            docFullNo: quotation.docFullNo || "",
            docDate: quotation.docDate || "",
            validDays: quotation.validDays,
            deliveryDays: quotation.deliveryDays,
            creditTermDays: quotation.creditTermDays,
            contactPerson: quotation.contactPerson,
            publicNote: quotation.publicNote,
            subtotal: Number(quotation.subtotal) || 0,
            discountAmount: Number(quotation.discountAmount) || 0,
            afterDiscount: Number(quotation.afterDiscount) || 0,
            taxAmount: Number(quotation.taxAmount) || 0,
            grandTotal: Number(quotation.grandTotal) || 0,
          }}
          items={quotation.items || []}
          customer={{ name: quotation.customerName, address: quotation.customerAddress }}
        />
      )}

      {/* PO Print */}
      <PurchaseOrderPrintPreview
        open={poPrintOpen}
        onClose={() => setPoPrintOpen(false)}
        purchaseOrder={relatedDocs.purchaseOrders[0]}
      />

      {/* GR Print */}
      <GoodsReceiptPrintPreview
        open={grPrintOpen}
        onClose={() => setGrPrintOpen(false)}
        goodsReceipt={relatedDocs.goodsReceipts[0]}
      />

      {/* Invoice Print */}
      <TaxInvoicePrintPreview
        open={invPrintOpen}
        onClose={() => setInvPrintOpen(false)}
        invoice={relatedDocs.invoices.find(i => i.status === 'PAID') || relatedDocs.invoices.find(i => i.status === 'POSTED') || relatedDocs.invoices[0]}
      />

      {/* Receipt Print */}
      <ReceiptPrintPreview
        open={receiptPrintOpen}
        onClose={() => setReceiptPrintOpen(false)}
        invoice={relatedDocs.invoices.find(i => i.status === 'PAID') || relatedDocs.invoices[0]}
      />

      {/* Supplier Selection Modal for PO */}
      <Modal
        title="🏭 เลือกผู้จำหน่าย"
        open={supplierModalOpen}
        onCancel={() => {
          setSupplierModalOpen(false);
          setSupplierSearchText('');
          setSelectedSupplierId(null);
        }}
        onOk={handleConfirmCreatePO}
        okText="✓ สร้างใบสั่งซื้อ"
        cancelText="ยกเลิก"
        confirmLoading={creatingPO}
        okButtonProps={{ disabled: !selectedSupplierId }}
        width={600}
      >
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: 0, opacity: 0.7 }}>เลือกผู้จำหน่ายสำหรับใบสั่งซื้อนี้:</p>
        </div>
        
        {/* Search Box */}
        <Input
          placeholder="🔍 ค้นหาผู้จำหน่าย..."
          prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
          value={supplierSearchText}
          onChange={(e) => setSupplierSearchText(e.target.value)}
          allowClear
          style={{ marginBottom: 12 }}
        />
        
        {/* Supplier Radio List */}
        <div style={{ 
          maxHeight: 300, 
          overflowY: 'auto', 
          border: '1px solid var(--border-color, #d9d9d9)', 
          borderRadius: 8,
          background: 'var(--bg-card, #fafafa)'
        }}>
          <Radio.Group 
            value={selectedSupplierId} 
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            style={{ width: '100%' }}
          >
            {suppliers
              .filter(s => 
                s.name?.toLowerCase().includes(supplierSearchText.toLowerCase()) ||
                s.phone?.toLowerCase().includes(supplierSearchText.toLowerCase()) ||
                s.email?.toLowerCase().includes(supplierSearchText.toLowerCase())
              )
              .map((supplier, index, arr) => (
                <div 
                  key={supplier.id}
                  style={{ 
                    padding: '12px 16px',
                    borderBottom: index < arr.length - 1 ? '1px solid var(--border-color, #e8e8e8)' : 'none',
                    background: selectedSupplierId === supplier.id ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => setSelectedSupplierId(supplier.id)}
                >
                  <Radio value={supplier.id} style={{ width: '100%' }}>
                    <div style={{ marginLeft: 8 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>
                        {supplier.name}
                        {selectedSupplierId === supplier.id && (
                          <Tag color="purple" style={{ marginLeft: 8 }}>เลือกแล้ว</Tag>
                        )}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                        {supplier.phone && <span style={{ marginRight: 12 }}>📞 {supplier.phone}</span>}
                        {supplier.email && <span style={{ marginRight: 12 }}>📧 {supplier.email}</span>}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
                        {supplier.paymentTermDays && (
                          <span style={{ marginRight: 12 }}>💳 เครดิต {supplier.paymentTermDays} วัน</span>
                        )}
                        {supplier.address && (
                          <span>📍 {supplier.address.length > 40 ? supplier.address.substring(0, 40) + '...' : supplier.address}</span>
                        )}
                      </div>
                    </div>
                  </Radio>
                </div>
              ))}
            {suppliers.filter(s => 
              s.name?.toLowerCase().includes(supplierSearchText.toLowerCase()) ||
              s.phone?.toLowerCase().includes(supplierSearchText.toLowerCase()) ||
              s.email?.toLowerCase().includes(supplierSearchText.toLowerCase())
            ).length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', opacity: 0.5 }}>
                ไม่พบผู้จำหน่าย
              </div>
            )}
          </Radio.Group>
        </div>
        
        {/* Product Summary */}
        {quotation?.items && quotation.items.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>📦 สินค้าในใบเสนอราคานี้:</div>
            <div style={{ 
              background: 'var(--bg-card, #f5f5f5)', 
              border: '1px solid var(--border-color, #e8e8e8)',
              borderRadius: 8, 
              padding: 12,
              maxHeight: 100,
              overflowY: 'auto'
            }}>
              {quotation.items.map((item: any, idx: number) => (
                <div key={idx} style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                  • {item.itemName || item.productName || item.tempProductName || 'สินค้า'} ({Number(item.qty).toLocaleString()} {item.unit || item.unitName || 'ชิ้น'})
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Warehouse Selection Modal for GR */}
      <Modal
        title="🏭 เลือกคลังสินค้า"
        open={warehouseModalOpen}
        onCancel={() => {
          setWarehouseModalOpen(false);
          setWarehouseSearchText('');
        }}
        onOk={handleConfirmCreateGR}
        okText="✓ สร้างใบรับสินค้า"
        cancelText="ยกเลิก"
        confirmLoading={creatingGR}
        okButtonProps={{ disabled: !selectedWarehouseId }}
        width={550}
      >
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: 0, opacity: 0.7 }}>เลือกคลังสินค้าสำหรับรับสินค้า:</p>
        </div>
        
        {/* Search Box */}
        <Input
          placeholder="🔍 ค้นหาคลังสินค้า..."
          prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
          value={warehouseSearchText}
          onChange={(e) => setWarehouseSearchText(e.target.value)}
          allowClear
          style={{ marginBottom: 12 }}
        />
        
        {/* Warehouse Radio List */}
        <div style={{ 
          maxHeight: 280, 
          overflowY: 'auto', 
          border: '1px solid var(--border-color, #d9d9d9)', 
          borderRadius: 8,
          background: 'var(--bg-card, #fafafa)'
        }}>
          <Radio.Group 
            value={selectedWarehouseId} 
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            style={{ width: '100%' }}
          >
            {warehouses
              .filter(w => 
                w.name?.toLowerCase().includes(warehouseSearchText.toLowerCase()) ||
                w.code?.toLowerCase().includes(warehouseSearchText.toLowerCase()) ||
                w.address?.toLowerCase().includes(warehouseSearchText.toLowerCase())
              )
              .map((warehouse, index, arr) => (
                <div 
                  key={warehouse.id}
                  style={{ 
                    padding: '12px 16px',
                    borderBottom: index < arr.length - 1 ? '1px solid var(--border-color, #e8e8e8)' : 'none',
                    background: selectedWarehouseId === warehouse.id ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => setSelectedWarehouseId(warehouse.id)}
                >
                  <Radio value={warehouse.id} style={{ width: '100%' }}>
                    <div style={{ marginLeft: 8 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>
                        {warehouse.name}
                        {warehouse.code && (
                          <span style={{ opacity: 0.5, marginLeft: 8, fontSize: 12 }}>({warehouse.code})</span>
                        )}
                        {selectedWarehouseId === warehouse.id && (
                          <Tag color="purple" style={{ marginLeft: 8 }}>เลือกแล้ว</Tag>
                        )}
                      </div>
                      {warehouse.address && (
                        <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                          📍 {warehouse.address.length > 50 ? warehouse.address.substring(0, 50) + '...' : warehouse.address}
                        </div>
                      )}
                    </div>
                  </Radio>
                </div>
              ))}
            {warehouses.filter(w => 
              w.name?.toLowerCase().includes(warehouseSearchText.toLowerCase()) ||
              w.code?.toLowerCase().includes(warehouseSearchText.toLowerCase()) ||
              w.address?.toLowerCase().includes(warehouseSearchText.toLowerCase())
            ).length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', opacity: 0.5 }}>
                ไม่พบคลังสินค้า
              </div>
            )}
          </Radio.Group>
        </div>
        
        {/* PO Info Summary */}
        {relatedDocs.purchaseOrders.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>📋 ใบสั่งซื้อที่เกี่ยวข้อง:</div>
            <div style={{ 
              background: 'var(--bg-card, #f5f5f5)', 
              border: '1px solid var(--border-color, #e8e8e8)',
              borderRadius: 8, 
              padding: 12
            }}>
              <div style={{ fontSize: 13 }}>
                <strong>{relatedDocs.purchaseOrders[0]?.docFullNo}</strong>
                <span style={{ opacity: 0.6, marginLeft: 8 }}>
                  ({relatedDocs.purchaseOrders[0]?.items?.length || 0} รายการ)
                </span>
              </div>
              {relatedDocs.purchaseOrders[0]?.supplier?.name && (
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  🏭 {relatedDocs.purchaseOrders[0].supplier.name}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        title="💰 บันทึกการชำระเงิน"
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        onOk={handleConfirmPayment}
        okText="บันทึกชำระเงิน"
        cancelText="ยกเลิก"
        confirmLoading={processingPayment}
      >
        <div style={{ marginBottom: 16 }}>
          <p><strong>ยอดชำระ:</strong> <span style={{ color: '#52c41a', fontSize: 18 }}>฿{Number(relatedDocs.invoices.find(i => i.status === 'POSTED')?.grandTotal || 0).toLocaleString()}</span></p>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8 }}><strong>วิธีการชำระเงิน:</strong></p>
          <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <Radio.Button value="TRANSFER">โอนเงิน</Radio.Button>
            <Radio.Button value="CASH">เงินสด</Radio.Button>
            <Radio.Button value="CHEQUE">เช็ค</Radio.Button>
            <Radio.Button value="CREDIT_CARD">บัตรเครดิต</Radio.Button>
          </Radio.Group>
        </div>
        
        <div>
          <p style={{ marginBottom: 8 }}><strong>เลขที่อ้างอิง:</strong></p>
          <Input
            placeholder={paymentMethod === 'TRANSFER' ? 'เลขที่รายการโอน' : paymentMethod === 'CHEQUE' ? 'เลขที่เช็ค' : 'เลขที่อ้างอิง (ถ้ามี)'}
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default QuotationDetail;
