import { jsPDF } from 'jspdf'

function num(val) {
  const n = Number(String(val || 0).replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? 0 : n
}

function fmtCurrency(val) {
  return `$${num(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function generateNeedAnalysisPDF(form, lead, agent) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 48
  let y = margin

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  const drawHeader = () => {
    doc.setFillColor(7, 54, 164)
    doc.rect(0, 0, pageWidth, 70, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('Need Analysis Report', margin, 32)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 52)

    doc.setTextColor(15, 23, 42)
    y = 100
  }

  const sectionTitle = (icon, title) => {
    ensureSpace(36)
    doc.setFillColor(241, 245, 249)
    doc.rect(margin, y, pageWidth - margin * 2, 28, 'F')
    doc.setTextColor(7, 54, 164)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(`${icon}  ${title.toUpperCase()}`, margin + 8, y + 18)
    y += 40
  }

  const labelValue = (label, value) => {
    ensureSpace(18)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(label.toUpperCase(), margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(value || '—', margin + 160, y)
    y += 20
  }

  const paragraph = (text) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(51, 65, 85)
    const lines = doc.splitTextToSize(text || '—', pageWidth - margin * 2)
    ensureSpace(lines.length * 14 + 4)
    doc.text(lines, margin, y)
    y += lines.length * 14 + 4
  }

  drawHeader()

  // Lead Information
  sectionTitle('1', 'Client Information')
  labelValue('Lead Name', lead?.name)
  labelValue('Lead ID', lead?.leadId || '—')
  labelValue('Email', lead?.email || '—')
  labelValue('Phone', lead?.phone || '—')
  if (agent) {
    labelValue('Prepared By', `${agent.name || 'Agent'}${agent.email ? ` (${agent.email})` : ''}`)
  }
  y += 8

  // Assets
  sectionTitle('2', 'Assets')
  if (form.ownHouse) {
    labelValue('House Value', fmtCurrency(form.houseValue))
    labelValue('Mortgage Remaining', fmtCurrency(form.mortgageRemaining))
  } else {
    labelValue('Owns House', 'No')
  }
  labelValue('RRSP', fmtCurrency(form.rrsp))
  labelValue('TFSA', fmtCurrency(form.tfsa))
  labelValue('Life Insurance for Kids', form.lifeInsuranceForKids ? 'Yes' : 'No')
  if (form.educationPlansRESP) {
    labelValue('RESP Saved', fmtCurrency(form.educationPlanAmount))
  }
  if (form.otherAssets && form.otherAssets.length > 0) {
    form.otherAssets.forEach((a, i) => {
      if (a.description || a.value) {
        labelValue(`Other Asset #${i + 1}`, `${a.description || '—'} — ${fmtCurrency(a.value)}`)
      }
    })
  }
  y += 8

  // Liabilities
  sectionTitle('3', 'Liabilities')
  labelValue('Outstanding Mortgage', fmtCurrency(form.outstandingMortgage))
  labelValue('Line of Credit', fmtCurrency(form.lineOfCredit))
  labelValue('Credit Card Debt', fmtCurrency(form.creditCardDebt))
  labelValue('Car Loan', fmtCurrency(form.carLoan))
  labelValue('Monthly Expenses', fmtCurrency(form.monthlyExpenses))
  y += 8

  // Income
  sectionTitle('4', 'Income')
  labelValue('Annual Income (Primary)', fmtCurrency(form.annualIncomePrimary))
  labelValue('Annual Income (Spouse)', fmtCurrency(form.annualIncomeSpouse))
  labelValue('Total Household Income', fmtCurrency(form.totalHouseholdIncome))
  y += 8

  // Existing Insurance
  sectionTitle('5', 'Existing Insurance')
  const insTypes = [
    ['Life Insurance', form.lifeInsurance],
    ['Critical Illness', form.criticalIllness],
    ['Disability', form.disability],
    ['Group Insurance', form.groupInsurance],
  ]
  insTypes.forEach(([label, has]) => labelValue(label, has ? 'Yes' : 'No'))
  if (form.groupInsurance) {
    labelValue('Group Insurance Coverage', fmtCurrency(form.groupInsuranceCoverage))
    labelValue('Group Insurance Company', form.groupInsuranceCompany)
  }
  if (form.existingPolicies && form.existingPolicies.length > 0) {
    form.existingPolicies.forEach((p, i) => {
      if (p.provider || p.type) {
        labelValue(
          `Policy #${i + 1}`,
          `${p.provider || '—'} (${p.type || '—'}) — Coverage: ${fmtCurrency(p.coverageAmount)}, Premium: ${fmtCurrency(p.premium)}/mo`
        )
      }
    })
  }
  y += 8

  // Family Details
  sectionTitle('6', 'Family Details')
  if (lead?.maritalStatus === 'Married') {
    labelValue('Spouse Name', form.spouseName)
    labelValue('Spouse DOB', form.spouseDOB)
    labelValue('Spouse Occupation', form.spouseOccupation)
    labelValue('Spouse Income', fmtCurrency(form.spouseIncome))
  } else {
    paragraph(`Marital Status: ${lead?.maritalStatus || 'N/A'}. Spouse details are not applicable.`)
  }
  if (form.children && form.children.length > 0) {
    form.children.forEach((c, i) => {
      if (c.name) {
        labelValue(`Child #${i + 1}`, `${c.name}${c.dob ? ` (DOB: ${c.dob})` : ''}`)
      }
    })
  }
  y += 8

  // Coverage Requirements
  sectionTitle('7', 'Coverage Requirements')
  labelValue('Desired Coverage', fmtCurrency(form.desiredCoverage))
  labelValue('Monthly Budget', fmtCurrency(form.budgetMonthly))
  if (form.coverageNotes) {
    paragraph(form.coverageNotes)
  }

  // Recommended Insurance Products
  if (form.recommendedProducts && form.recommendedProducts.length > 0) {
    ensureSpace(30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(7, 54, 164)
    doc.text('RECOMMENDED PRODUCTS', margin, y)
    y += 16

    // Table header
    ensureSpace(40)
    doc.setFillColor(241, 245, 249)
    doc.rect(margin, y, pageWidth - margin * 2, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('PRODUCT', margin + 6, y + 12)
    doc.text('COVERAGE', margin + 220, y + 12)
    doc.text('PROPOSED PREMIUM', margin + 360, y + 12)
    y += 22

    form.recommendedProducts.forEach((r) => {
      if (!r.product) return
      ensureSpace(16)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(15, 23, 42)
      doc.text(r.product, margin + 6, y + 10)
      doc.text(fmtCurrency(r.coverageAmount), margin + 220, y + 10)
      doc.text(`${fmtCurrency(r.proposedPremium)}/mo`, margin + 360, y + 10)
      y += 16
    })
  }
  y += 8

  // Financial Summary
  const totalAssets =
    num(form.rrsp) + num(form.tfsa) + num(form.houseValue) +
    (form.otherAssets || []).reduce((s, a) => s + num(a.value), 0)
  const totalLiabilities =
    num(form.outstandingMortgage) + num(form.lineOfCredit) +
    num(form.creditCardDebt) + num(form.carLoan)
  const netWorth = totalAssets - totalLiabilities

  sectionTitle('8', 'Financial Summary')
  ensureSpace(80)
  doc.setFillColor(248, 250, 252)
  doc.rect(margin, y, pageWidth - margin * 2, 80, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.rect(margin, y, pageWidth - margin * 2, 80, 'S')

  const colW = (pageWidth - margin * 2) / 4
  const summary = [
    { label: 'Total Assets', value: fmtCurrency(totalAssets), color: [34, 197, 94] },
    { label: 'Total Liabilities', value: fmtCurrency(totalLiabilities), color: [239, 68, 68] },
    { label: 'Net Worth', value: fmtCurrency(netWorth), color: [7, 54, 164] },
    { label: 'Coverage Needed', value: fmtCurrency(form.desiredCoverage), color: [147, 51, 234] },
  ]
  summary.forEach((s, i) => {
    const x = margin + i * colW + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(s.label.toUpperCase(), x, y + 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...s.color)
    doc.text(s.value, x, y + 50)
  })
  y += 96

  // Disclosure
  sectionTitle('9', 'Important Disclosure')

  const disclosureLines = [
    'DISCLAIMER — FOR INFORMATIONAL PURPOSES ONLY',
    '',
    'This Need Analysis Report is prepared for general informational and educational purposes only. ' +
    'The information contained herein is based on the details provided by the client and is accurate only ' +
    'as of the date of preparation. This report does not constitute financial, legal, tax, or insurance advice.',
    '',
    'The coverage recommendations, premium estimates, and financial summaries presented in this report are ' +
    'approximations based on the information known at the time of preparation and may not reflect the most ' +
    'current market conditions, underwriting criteria, or regulatory requirements.',
    '',
    'Clients are strongly encouraged to consult with a licensed financial advisor or insurance professional ' +
    'before making any decisions regarding insurance coverage. All final policy terms, conditions, premiums, ' +
    'and eligibility are subject to the underwriting review and approval by the respective insurance provider.',
  ]

  // Pre-calculate the height the disclosure text will need
  const disclosureContentWidth = pageWidth - margin * 2 - 20
  let disclosureTextHeight = 0
  for (let i = 1; i < disclosureLines.length; i++) {
    if (disclosureLines[i] === '') {
      disclosureTextHeight += 6
      continue
    }
    const wrapped = doc.splitTextToSize(disclosureLines[i], disclosureContentWidth)
    disclosureTextHeight += wrapped.length * 11
  }
  const disclosurePaddingTop = 16
  const disclosureTitleGap = 8
  const disclosurePaddingBottom = 12
  const disclosureBoxHeight = disclosurePaddingTop + 10 + disclosureTitleGap + disclosureTextHeight + disclosurePaddingBottom

  ensureSpace(disclosureBoxHeight + 36)
  doc.setFillColor(255, 251, 235)
  doc.rect(margin, y, pageWidth - margin * 2, disclosureBoxHeight, 'F')
  doc.setDrawColor(253, 230, 138)
  doc.rect(margin, y, pageWidth - margin * 2, disclosureBoxHeight, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(146, 64, 14)
  doc.text(disclosureLines[0].toUpperCase(), margin + 10, y + disclosurePaddingTop)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(113, 63, 18)
  let disclosureY = y + disclosurePaddingTop + 10 + disclosureTitleGap
  for (let i = 1; i < disclosureLines.length; i++) {
    if (disclosureLines[i] === '') {
      disclosureY += 6
      continue
    }
    const lines = doc.splitTextToSize(disclosureLines[i], disclosureContentWidth)
    lines.forEach((line) => {
      doc.text(line, margin + 10, disclosureY)
      disclosureY += 11
    })
  }
  y += disclosureBoxHeight + 16

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Need Analysis Report — ${lead?.name || 'Lead'} — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    )
  }

  return doc
}

export function downloadNeedAnalysisPDF(form, lead, agent) {
  const doc = generateNeedAnalysisPDF(form, lead, agent)
  const filename = `Need_Analysis_${(lead?.name || 'Lead').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
  return filename
}

export function getNeedAnalysisPDFBlob(form, lead, agent) {
  const doc = generateNeedAnalysisPDF(form, lead, agent)
  return doc.output('blob')
}

export function previewNeedAnalysisPDF(form, lead, agent) {
  const doc = generateNeedAnalysisPDF(form, lead, agent)
  const blobUrl = doc.output('bloburl')
  window.open(blobUrl, '_blank')
}
