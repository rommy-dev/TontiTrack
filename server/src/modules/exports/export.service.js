import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Cycle } from '../cycles/cycle.model.js';
import { Contribution } from '../contributions/contribution.model.js';
import { Transaction } from '../transactions/transaction.model.js';
import { Group } from '../groups/group.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/ApiError.js';
import { formatCents, convertAndFormat } from '../../utils/currency.js';

function fmtDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

function safeFilename(value) {
  return String(value || 'export')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function assertGroupAccess(groupId, userId) {
  const group = await Group.findById(groupId);
  if (!group) throw new NotFoundError('Groupe');
  if (!group.hasMember(userId)) throw new ForbiddenError('Accès refusé');
  return group;
}

function fullName(user) {
  if (!user) return 'Inconnu';
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Inconnu';
}

function ensurePdfSpace(doc, currentY, requiredHeight, drawHeader) {
  if (currentY + requiredHeight <= doc.page.height - 55) return currentY;
  doc.addPage();
  drawHeader();
  return 95;
}

export const exportService = {
  async generateCyclePdf({ groupId, cycleId, userId, preferredCurrency, res }) {
    if (!groupId) throw new ValidationError('groupId est requis');

    const group = await assertGroupAccess(groupId, userId);
    const cycle = await Cycle.findById(cycleId).populate('beneficiaryId', 'firstName lastName email');

    if (!cycle || !cycle.groupId.equals(groupId)) {
      throw new NotFoundError('Cycle');
    }

    const contributions = await Contribution.find({ cycleId })
      .populate('userId', 'firstName lastName email')
      .sort({ status: 1, createdAt: 1 });
    const sourceCurrency = cycle.currency || group.settings.currency || 'XAF';
    const displayCurrency = preferredCurrency || sourceCurrency;

    const fmt = (amountCents) => convertAndFormat(amountCents, sourceCurrency, displayCurrency);

    const totalPaid = contributions.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const totalExpected = contributions.reduce((sum, c) => sum + (c.expectedAmount || 0), 0);
    const totalPenalties = contributions.reduce((sum, c) => sum + (c.penaltyAmount || 0), 0);
    const paidCount = contributions.filter((c) => c.status === 'paid').length;
    const completionRate = contributions.length > 0
      ? Math.round((paidCount / contributions.length) * 100)
      : 0;

    const doc = new PDFDocument({
      size: 'A4',
      bufferPages: true,
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Rapport cycle ${cycle.cycleNumber} - ${group.name}`,
        Author: 'TontiTrack',
        Creator: 'TontiTrack',
      },
    });

    const filename = `tontitrack-cycle-${cycle.cycleNumber}-${safeFilename(group.name)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const colors = {
      primary: '#2f9e73',
      primaryDark: '#257f5c',
      success: '#15803d',
      danger: '#dc2626',
      warning: '#d97706',
      gray: '#78716c',
      light: '#fafaf9',
      dark: '#1c1917',
      white: '#ffffff',
    };

    const drawHeader = () => {
      doc.rect(0, 0, doc.page.width, 72).fill(colors.primaryDark);
      doc.fillColor(colors.white).font('Helvetica-Bold').fontSize(21).text('TontiTrack', 50, 18);
      doc.font('Helvetica').fontSize(10).text(`Rapport de cycle - Géneré le ${fmtDate(new Date())}`, 50, 45);
    };

    const drawFooter = () => {
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i += 1) {
        doc.switchToPage(i);
        doc.font('Helvetica').fontSize(8).fillColor(colors.gray).text(
          `TontiTrack - Document confidentiel - ${fmtDate(new Date())}`,
          50,
          doc.page.height - doc.page.margins.bottom - 20,
          { align: 'center', width: doc.page.width - 100 }
        );
      }
    };

    drawHeader();

    doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(16).text(group.name, 50, 100);
    doc.font('Helvetica').fontSize(10).fillColor(colors.gray)
      .text(`${group.type} - ${displayCurrency}`, 50, 121);

    const infoY = 150;
    doc.roundedRect(50, infoY, doc.page.width - 100, 92, 4).fill(colors.light);
    const infos = [
      ['Cycle', `#${cycle.cycleNumber}`],
      ['Statut', cycle.status.toUpperCase()],
      ['Debut', fmtDate(cycle.startDate)],
      ['Echeance', fmtDate(cycle.dueDate)],
      ['Beneficiaire', cycle.beneficiaryId ? fullName(cycle.beneficiaryId) : 'Caisse commune'],
      ['Objectif', fmt(cycle.targetAmount)],
    ];

    const colW = (doc.page.width - 120) / 3;
    infos.forEach(([label, value], index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 62 + col * colW;
      const y = infoY + 14 + row * 40;
      doc.font('Helvetica').fontSize(8).fillColor(colors.gray).text(label.toUpperCase(), x, y);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.dark).text(value, x, y + 13, { width: colW - 8 });
    });

    const summaryY = 268;
    doc.font('Helvetica-Bold').fontSize(13).fillColor(colors.dark).text('Resume financier', 50, summaryY);
    const cards = [
      ['Total collecte', fmt(totalPaid), colors.success],
      ['Total attendu', fmt(totalExpected), colors.primary],
      ['Penalites', fmt(totalPenalties), colors.warning],
      ['Completion', `${completionRate}%`, colors.primary],
    ];
    const cardW = (doc.page.width - 118) / 4;
    cards.forEach(([label, value, color], index) => {
      const x = 50 + index * (cardW + 6);
      const y = summaryY + 24;
      doc.rect(x, y, cardW, 55).fill(colors.white);
      doc.rect(x, y, 4, 55).fill(color);
      doc.font('Helvetica').fontSize(8).fillColor(colors.gray).text(label.toUpperCase(), x + 12, y + 10, { width: cardW - 18 });
      doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.dark).text(value, x + 12, y + 28, { width: cardW - 18 });
    });

    let y = summaryY + 100;
    doc.font('Helvetica-Bold').fontSize(13).fillColor(colors.dark).text('Detail des contributions', 50, y);
    y += 24;

    const cols = [
      { label: 'Membre', x: 50, w: 158 },
      { label: 'Attendu', x: 208, w: 88 },
      { label: 'Paye', x: 296, w: 88 },
      { label: 'Penalite', x: 384, w: 82 },
      { label: 'Statut', x: 466, w: 78 },
    ];

    const drawTableHeader = () => {
      doc.rect(50, y, doc.page.width - 100, 21).fill(colors.primary);
      cols.forEach((col) => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.white)
          .text(col.label, col.x + 4, y + 7, { width: col.w - 6 });
      });
      y += 21;
    };

    drawTableHeader();

    const statusLabels = {
      paid: 'PAYE',
      partial: 'PARTIEL',
      pending: 'ATTENTE',
      late: 'RETARD',
      defaulted: 'IMPAYE',
    };

    contributions.forEach((contribution, index) => {
      y = ensurePdfSpace(doc, y, 24, drawHeader);
      if (y === 95) {
        drawTableHeader();
      }

      doc.rect(50, y, doc.page.width - 100, 23).fill(index % 2 === 0 ? colors.white : colors.light);
      doc.font('Helvetica').fontSize(8).fillColor(colors.dark)
        .text(fullName(contribution.userId), cols[0].x + 4, y + 7, { width: cols[0].w - 6 })
        .text(fmt(contribution.expectedAmount), cols[1].x + 4, y + 7, { width: cols[1].w - 6 })
        .text(fmt(contribution.paidAmount), cols[2].x + 4, y + 7, { width: cols[2].w - 6 })
        .text(fmt(contribution.penaltyAmount), cols[3].x + 4, y + 7, { width: cols[3].w - 6 })
        .text(statusLabels[contribution.status] || contribution.status, cols[4].x + 4, y + 7, { width: cols[4].w - 6 });
      y += 23;
    });

    y = ensurePdfSpace(doc, y, 24, drawHeader);
    doc.rect(50, y, doc.page.width - 100, 23).fill(colors.primaryDark);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.white)
      .text('TOTAL', cols[0].x + 4, y + 7)
      .text(fmt(totalExpected), cols[1].x + 4, y + 7)
      .text(fmt(totalPaid), cols[2].x + 4, y + 7)
      .text(fmt(totalPenalties), cols[3].x + 4, y + 7)
      .text(`${paidCount}/${contributions.length}`, cols[4].x + 4, y + 7);

    drawFooter();
    doc.end();
  },

  async generateTransactionExcel({ groupId, userId, res }) {
    const group = await assertGroupAccess(groupId, userId);
    const transactions = await Transaction.find({ groupId })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const currency = group.settings.currency || 'XAF';
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TontiTrack';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('Resume');
    summarySheet.columns = [
      { header: 'Indicateur', key: 'label', width: 28 },
      { header: 'Valeur', key: 'value', width: 28 },
    ];

    const totalIn = transactions
      .filter((tx) => tx.amountCents > 0)
      .reduce((sum, tx) => sum + tx.amountCents, 0);
    const totalOut = transactions
      .filter((tx) => tx.amountCents < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amountCents), 0);

    [
      ['Groupe', group.name],
      ['Type', group.type],
      ['Devise', currency],
      ['Membres actifs', group.members.filter((member) => member.status === 'active').length],
      ['Total transactions', transactions.length],
      ['Total entrant', formatCents(totalIn, currency)],
      ['Total sortant', formatCents(totalOut, currency)],
      ['Solde net', formatCents(totalIn - totalOut, currency)],
      ['Exporte le', fmtDate(new Date())],
    ].forEach(([label, value]) => summarySheet.addRow({ label, value }));

    const transactionsSheet = workbook.addWorksheet('Transactions', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    transactionsSheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Membre', key: 'member', width: 26 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Type', key: 'type', width: 18 },
      { header: `Montant (${currency})`, key: 'amount', width: 18 },
      { header: 'Description', key: 'description', width: 44 },
    ];

    const styleHeader = (sheet) => {
      const header = sheet.getRow(1);
      header.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      header.height = 24;
    };
    styleHeader(summarySheet);
    styleHeader(transactionsSheet);

    const typeLabels = {
      contribution: 'Contribution',
      penalty: 'Penalite',
      payout: 'Versement',
      refund: 'Remboursement',
    };

    transactions.forEach((tx, index) => {
      const row = transactionsSheet.addRow({
        date: fmtDate(tx.createdAt),
        member: fullName(tx.userId),
        email: tx.userId?.email || '',
        type: typeLabels[tx.type] || tx.type,
        amount: tx.amountCents / 100,
        description: tx.description || '',
      });
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' },
        };
        cell.alignment = { vertical: 'middle' };
      });
      row.getCell('amount').numFmt = `#,##0" ${currency}"`;
      row.getCell('amount').font = {
        color: { argb: tx.amountCents < 0 ? 'FFEF4444' : 'FF111827' },
        bold: tx.amountCents < 0,
      };
    });

    summarySheet.eachRow((row, index) => {
      if (index > 1 && index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
        });
      }
    });

    const filename = `tontitrack-${safeFilename(group.name)}-transactions.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  },
};
