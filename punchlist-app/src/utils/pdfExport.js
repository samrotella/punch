import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getStatusLabel } from './statusHelpers';

export const exportToPDF = async (items, projectName, filters = {}) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235); // Blue
  doc.text('Punch List Report', 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(projectName, 14, 28);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // Gray
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
  
  // Summary stats
  const totalItems = items.length;
  const openItems = items.filter(i => i.status === 'open').length;
  const inProgressItems = items.filter(i => i.status === 'in-progress').length;
  const readyForReview = items.filter(i => i.status === 'ready-for-review').length;
  const completedItems = items.filter(i => i.status === 'completed').length;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Items: ${totalItems}`, 14, 45);
  doc.text(`Open: ${openItems}`, 60, 45);
  doc.text(`In Progress: ${inProgressItems}`, 90, 45);
  doc.text(`Ready for Review: ${readyForReview}`, 130, 45);
  doc.text(`Completed: ${completedItems}`, 175, 45);
  
  // Applied filters
  if (filters.status && filters.status !== 'all') {
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Filter: ${getStatusLabel(filters.status)} items only`, 14, 52);
  }
  if (filters.trade && filters.trade !== 'all') {
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Trade: ${filters.trade}`, 14, 57);
  }
  
  // Table
  const tableData = items.map(item => [
    getStatusLabel(item.status),
    item.trade,
    item.description,
    item.location,
    item.assigned_to || '-',
    new Date(item.created_at).toLocaleDateString()
  ]);
  
  doc.autoTable({
    startY: filters.status !== 'all' || filters.trade !== 'all' ? 62 : 55,
    head: [['Status', 'Trade', 'Description', 'Location', 'Assigned To', 'Created']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235], // Blue
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 22 },
      2: { cellWidth: 60 },
      3: { cellWidth: 30 },
      4: { cellWidth: 35 },
      5: { cellWidth: 23 }
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2,
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    }
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Generate filename
  const safeProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `punchlist_${safeProjectName}_${dateStr}.pdf`;
  
  // Save
  doc.save(filename);
};