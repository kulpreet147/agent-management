import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Keyboard, FileText, ShieldCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../utils/auth.js';
import { saveAgentSignedDocument, updateAgentOnboardingStatus } from '../../utils/agents.js';

const DOCUMENTS = [
  {
    id: 'advisor_contract',
    name: 'Advisor Contract',
    status: 'Pending',
    icon: FileText,
    contractId: 'ACT-884-2024',
    title: 'Independent Advisor Agreement',
    requiresSignature: true,
    requiresAcceptance: false,
    acceptanceText: 'I agree that this is a legally binding electronic signature and have read and understood all terms and conditions in this agreement.',
    content: [
      {
        section: '1. Scope of Services',
        text: 'This Advisor shall provide strategic consulting, administrative support, and market analysis as specifically detailed in Exhibit A attached hereto. Advisor represents that they have the required expertise and compliance certifications to perform these duties within the regulatory framework of the financial services sector.'
      },
      {
        section: '2. Compensation & Billing',
        text: 'Advisor shall be compensated at the rates specified in the Fee Schedule. Invoices must be submitted monthly via the Agent Portal. Payments shall be disbursed within fifteen (15) business days of invoice approval, net of any applicable local tax withholdings as required by law.'
      },
      {
        section: '3. Confidentiality & Non-Disclosure',
        text: 'Advisor acknowledges that they will have access to "Confidential Information," including trade secrets, customer data, and proprietary algorithms. Advisor agrees to maintain strict confidentiality and not disclose such information to any third party without express written consent. This obligation survives the termination of this Agreement for a period of five (5) years.'
      },
      {
        section: '4. Termination',
        text: 'Either party may terminate this Agreement with thirty (30) days written notice. In the event of a material breach, the non-breaching party may terminate immediately. Upon termination, Advisor shall return all Company property and data within forty-eight (48) hours.'
      }
    ]
  },
  {
    id: 'code_of_conduct',
    name: 'Code of Conduct',
    status: 'Pending',
    icon: ShieldCheck,
    contractId: 'COC-445-2024',
    title: 'Professional Code of Conduct',
    requiresSignature: false,
    requiresAcceptance: true,
    acceptanceText: 'I have read and agree to follow the Code of Conduct.',
    content: [
      {
        section: '1. Professional Standards',
        text: `All advisors are expected to maintain the highest standards of professionalism, integrity, and ethical conduct while representing the organization. Advisors must always act honestly, provide accurate information, and place the interests of clients above personal gain. Any recommendation, communication, or advice provided to clients should be clear, transparent, and based on sound professional judgment. Advisors are expected to maintain appropriate professional qualifications and stay informed about industry developments, regulatory requirements, and company policies. Respectful behavior toward clients, colleagues, and business partners is mandatory at all times. Advisors must avoid conflicts of interest and immediately disclose any situation that could influence their objectivity or decision-making. Professional conduct extends to all forms of communication, including in-person meetings, phone calls, emails, messaging platforms, and social media. Any behavior that damages the reputation of the organization or violates ethical standards may result in disciplinary action. The company reserves the right to investigate complaints and take appropriate corrective measures, including suspension or termination of contracts, where necessary.`
      },
      {
        section: '2. Client Confidentiality',
        text: `Protecting client information is a fundamental responsibility of every advisor. All personal, financial, and business information obtained during the course of providing services must be treated as strictly confidential. Advisors may only access client information when required to perform authorized duties and must not disclose, share, sell, or misuse such information for personal benefit. Client records should be stored securely and protected against unauthorized access, loss, theft, or disclosure. Electronic data must be safeguarded using approved security measures, including strong passwords, secure networks, and encryption where applicable. Confidential information should only be shared with authorized personnel who have a legitimate business need to access it. Advisors must comply with all applicable privacy and data protection laws and immediately report any suspected data breach or security incident. Confidentiality obligations continue even after an advisor's employment or contractual relationship ends. Failure to protect client information may result in disciplinary action, legal consequences, financial penalties, and damage to the trust that clients place in the organization.`
      },
      {
        section: '3. Anti-Discrimination Policy',
        text: `The organization is committed to maintaining a workplace and business environment that promotes equality, dignity, respect, and inclusion for all individuals. Discrimination, harassment, or unfair treatment based on race, color, religion, gender, age, disability, marital status, national origin, sexual orientation, or any other protected characteristic is strictly prohibited. Advisors are expected to treat clients, coworkers, vendors, and partners fairly and professionally regardless of their background or personal characteristics. Decisions related to hiring, promotions, assignments, compensation, training, and business opportunities must be based solely on qualifications, performance, and legitimate business considerations. Harassment, offensive language, inappropriate jokes, intimidation, or exclusionary behavior will not be tolerated. The organization encourages individuals to report any concerns regarding discrimination or harassment without fear of retaliation. All complaints will be investigated promptly, fairly, and confidentially to the extent possible. Violations of this policy may result in disciplinary measures, including warnings, suspension, termination of employment, or other corrective actions deemed appropriate by management.`
      },
      {
        section: '4. Compliance & Reporting',
        text: `All advisors are responsible for complying with applicable laws, regulations, industry standards, and internal company policies. Compliance is essential to maintaining trust, protecting clients, and ensuring the long-term success of the organization. Advisors must understand and follow the procedures relevant to their roles and participate in any required compliance training programs. Any suspected violation of company policy, unethical behavior, fraud, misconduct, security concern, or regulatory breach must be reported immediately through the appropriate reporting channels. Reports should be made in good faith and supported by accurate information whenever possible. The organization strictly prohibits retaliation against any individual who reports concerns honestly or participates in an investigation. All reported matters will be reviewed and investigated promptly and objectively. Advisors are expected to cooperate fully with compliance reviews, audits, and investigations. Failure to comply with reporting requirements or attempts to conceal misconduct may result in disciplinary action. By following compliance requirements and reporting concerns responsibly, advisors contribute to a culture of accountability, transparency, and ethical business practices throughout the organization.`
      }
    ]
  },
  {
    id: 'privacy_policy',
    name: 'Privacy Policy',
    status: 'Not started',
    icon: Lock,
    contractId: 'PP-778-2024',
    title: 'Privacy & Data Protection Policy',
    requiresSignature: false,
    requiresAcceptance: true,
    acceptanceText: 'I have read and agree to follow the Code of Conduct.',
    content: [
      {
        section: '1. Data Collection & Usage',
        text: 'We collect personal data necessary to provide our services and improve user experience. This data is collected only with user consent and is used solely for the stated purposes. We employ industry-standard security measures to protect all collected data from unauthorized access, alteration, or destruction.'
      },
      {
        section: '2. Third-Party Sharing',
        text: 'Personal data is never sold to third parties. We may share data with service providers who assist in operations, but only under strict confidentiality agreements. Users have the right to request information about what data is collected and how it is used.'
      },
      {
        section: '3. Data Retention & Deletion',
        text: 'Data is retained only as long as necessary for the stated purposes. Users may request deletion of their data at any time, subject to legal and regulatory requirements. Upon termination of services, all user data is securely deleted within thirty (30) days.'
      },
      {
        section: '4. User Rights & Access',
        text: 'Users have the right to access, correct, or delete their personal data. Users may also request a copy of their data in a portable format. All such requests must be submitted in writing and will be processed within thirty (30) days in compliance with applicable data protection laws.'
      }
    ]
  }
];

function normalizeSavedDocuments(savedDocuments = {}) {
  return Object.entries(savedDocuments).reduce((documents, [documentId, document]) => {
    documents[documentId] = {
      accepted: Boolean(document.accepted),
      acceptanceText: document.acceptanceText,
      signature: document.signature,
      timestamp: document.submittedAt || document.timestamp,
      type: document.signatureType || (document.signature ? 'type' : 'acceptance')
    };
    return documents;
  }, {});
}

function buildDraftsFromSavedDocuments(savedDocuments = {}) {
  return Object.entries(savedDocuments).reduce((drafts, [documentId, document]) => {
    drafts[documentId] = {
      signatureType: document.signatureType || 'type',
      typeSignature: document.signature || '',
      agree: Boolean(document.accepted),
    };
    return drafts;
  }, {});
}

const DocumentSigningPage = () => {
  const navigate = useNavigate();
  const session = auth.get();
  const [activeDoc, setActiveDoc] = useState(0);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signedDocuments, setSignedDocuments] = useState(() =>
    normalizeSavedDocuments(session?.signedDocuments)
  );
  const [documentDrafts, setDocumentDrafts] = useState(() =>
    buildDraftsFromSavedDocuments(session?.signedDocuments)
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const currentDocument = DOCUMENTS[activeDoc];
  const currentDocSigned = signedDocuments[currentDocument.id];
  const currentDraft = documentDrafts[currentDocument.id] || {
    signatureType: 'type',
    typeSignature: '',
    agree: false,
  };
  const signatureType = currentDraft.signatureType;
  const typeSignature = currentDraft.typeSignature;
  const agree = currentDraft.agree;
  const requiresSignature = currentDocument.requiresSignature;
  const requiresAcceptance = currentDocument.requiresAcceptance;
  const advisorDraft = documentDrafts.advisor_contract || {
    signatureType: 'type',
    typeSignature: '',
  };
  const advisorSignature = advisorDraft.typeSignature?.trim() || '';
  const bothAcceptanceChecked =
    Boolean(documentDrafts.code_of_conduct?.agree) &&
    Boolean(documentDrafts.privacy_policy?.agree);
  const canSubmitCurrentDocument = Boolean(advisorSignature && bothAcceptanceChecked);

  // Real-time signature preview
  const liveSignaturePreview = typeSignature.trim() || '';

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && signatureType === 'draw') {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [signatureType, activeDoc]);

  // Handle canvas drawing
  const startDrawing = (e) => {
    if (signatureType !== 'draw') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left || (e.touches && e.touches[0].clientX - rect.left);
    const y = e.clientY - rect.top || (e.touches && e.touches[0].clientY - rect.top);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || signatureType !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left || (e.touches && e.touches[0].clientX - rect.left);
    const y = e.clientY - rect.top || (e.touches && e.touches[0].clientY - rect.top);

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e40af';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    setDocumentDrafts((prev) => ({
      ...prev,
      [currentDocument.id]: {
        signatureType: 'type',
        typeSignature: '',
        agree: false,
      },
    }));
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const updateCurrentDraft = (patch) => {
    setDocumentDrafts((prev) => ({
      ...prev,
      [currentDocument.id]: {
        signatureType: 'type',
        typeSignature: '',
        agree: false,
        ...prev[currentDocument.id],
        ...patch,
      },
    }));
  };

  const handleSubmitSignature = async (e) => {
    e.preventDefault();

    if (!bothAcceptanceChecked) {
      alert('Please agree to the Code of Conduct and Privacy acknowledgements before submitting your signature');
      return;
    }

    if (!advisorSignature) {
      alert('Please type your signature');
      return;
    }

    if (requiresSignature && signatureType === 'draw') {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL('image/png');
      if (imageData === 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==') {
        alert('Please draw your signature');
        return;
      }
    }

    setLoading(true);
    try {
      const submittedAt = new Date().toISOString();
      const documentPayloads = DOCUMENTS.map((doc) => {
        const isAdvisorContract = doc.id === 'advisor_contract';
        return {
          documentId: doc.id,
          documentName: doc.name,
          accepted: isAdvisorContract ? bothAcceptanceChecked : Boolean(documentDrafts[doc.id]?.agree),
          acceptanceText: doc.acceptanceText,
          signature: isAdvisorContract ? advisorSignature : null,
          signatureType: isAdvisorContract ? advisorDraft.signatureType || 'type' : null,
          metadata: {
            contractId: doc.contractId,
            title: doc.title
          }
        };
      });

      if (session?.id) {
        await Promise.all(
          documentPayloads.map((payload) => saveAgentSignedDocument(session.id, payload))
        );
      }

      const nextSignedDocuments = documentPayloads.reduce((documents, payload) => {
        documents[payload.documentId] = {
          accepted: payload.accepted,
          acceptanceText: payload.acceptanceText,
          signature: payload.signature,
          timestamp: submittedAt,
          type: payload.signatureType || (payload.signature ? 'type' : 'acceptance')
        };
        return documents;
      }, {});
      const allDocumentsSigned = DOCUMENTS.every((doc) => nextSignedDocuments[doc.id]);

      setSignedDocuments(nextSignedDocuments);
      auth.update({ signedDocuments: nextSignedDocuments });

      if (allDocumentsSigned && session?.id) {
        await updateAgentOnboardingStatus(session.id, 4);
        auth.update({ onboardingStatus: 4 });
      }

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        clearSignature();

        if (allDocumentsSigned) {
          navigate('/agent/onboarding-progress');
          return;
        }

        const nextUnsignedIndex = DOCUMENTS.findIndex(
          (doc, idx) => idx > activeDoc && !nextSignedDocuments[doc.id]
        );
        if (nextUnsignedIndex !== -1) {
          setActiveDoc(nextUnsignedIndex);
        }
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = Object.keys(signedDocuments).length;
  const totalCount = DOCUMENTS.length;

  const getStatusIcon = (status) => {
    if (signedDocuments[currentDocument.id]) {
      return '✓';
    }
    return status === 'Not started' ? '○' : '⏳';
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 text-slate-950 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 bg-white shadow-sm flex items-center px-6 shrink-0">
        <div className="mx-4 h-4 w-px bg-slate-200" />
        <div className="text-[10px] font-semibold text-slate-500">Document Signing</div>
      </header>

      {/* Main Content */}
      <main className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Sidebar - Documents List */}
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Your Documents</h2>
            <p className="mt-1 text-[10px] text-slate-500">Review and sign your contracts</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-2">
            {DOCUMENTS.map((doc, index) => {
              const isSigned = signedDocuments[doc.id];
              const isActive = activeDoc === index;
              const IconComponent = doc.icon;

              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    setActiveDoc(index);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-150 text-left ${isActive
                      ? 'border-l-4 border-blue-700 bg-blue-50 text-blue-700'
                      : isSigned
                        ? 'hover:bg-slate-50 text-green-700 bg-green-50/50'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold truncate">{doc.name}</div>
                    <div className="text-[9px] mt-1 flex items-center gap-1">
                      {isSigned ? '✓ Signed' : doc.status}
                    </div>
                  </div>
                  <IconComponent size={14} className="flex-shrink-0 ml-2" />
                </button>
              );
            })}
          </nav>

          {/* Progress Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 m-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-[10px] font-bold text-slate-700">Completion Progress</div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-blue-700 transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 mt-2">
              {completedCount} of {totalCount} documents signed
            </div>
          </div>
        </aside>

        {/* Right Panel - Document Content */}
        <section className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
          {/* Document Preview */}
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-3 custom-scrollbar">
            <div className="mx-auto max-w-2xl bg-white rounded-sm shadow-lg p-10 min-h-[calc(100vh-250px)] border border-slate-200">
              {/* Header */}
              <div className="mb-8 flex justify-between text-[8px] font-bold text-slate-400">
                <span>LEGAL DOCUMENT</span>
                <span>CONTRACT ID: {currentDocument.contractId}</span>
              </div>

              {/* Title */}
              <h1 className="text-center text-lg font-bold underline mb-8 text-slate-900">
                {currentDocument.title}
              </h1>

              {/* Content */}
              <div className="max-h-[calc(100vh-430px)] space-y-6 overflow-y-auto pr-2 text-slate-700 text-sm leading-relaxed custom-scrollbar">
                {currentDocument.content.map((paragraph, idx) => (
                  <div key={idx}>
                    <h3 className="font-bold text-slate-900 mb-2">{paragraph.section}</h3>
                    <p className="text-xs leading-relaxed text-slate-600">{paragraph.text}</p>
                  </div>
                ))}
              </div>

              {/* Signature Section in Document */}
              {requiresSignature && (
                <div className="mt-16 pt-8 border-t-2 border-slate-300">
                  <div className="flex justify-between items-end">
                    {/* Company Signature */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-900">Authorized Signatory</p>
                      <div className="w-40 h-10 bg-slate-100 rounded flex items-center justify-center text-[9px] italic text-slate-500">
                        Michael Sterling
                      </div>
                      <p className="text-[9px] text-slate-600">COO, Agent Management</p>
                    </div>

                    {/* Advisor Signature Preview */}
                    <div className="space-y-3 text-right">
                      <p className="text-xs font-bold text-slate-900">Advisor Signature</p>
                      <div className="w-56 h-20 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center relative bg-blue-50/30 overflow-hidden">
                        {signedDocuments[currentDocument.id] ? (
                          <div className="text-center">
                            <div
                              className={`text-2xl font-bold text-blue-700 ${signedDocuments[currentDocument.id].type === 'type'
                                  ? "font-['Dancing_Script']"
                                  : 'font-bold'
                                }`}
                            >
                              {signedDocuments[currentDocument.id].signature}
                            </div>
                            <div className="text-[8px] text-green-600 font-semibold mt-1">✓ SIGNED</div>
                          </div>
                        ) : liveSignaturePreview ? (
                          <div className="text-2xl font-['Dancing_Script'] text-blue-700 font-bold italic">
                            {liveSignaturePreview}
                          </div>
                        ) : (
                          <span className="text-[10px] opacity-40 uppercase tracking-widest font-bold">
                            Sign Below
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-600">Your Signature</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Signature Input Section */}
          {!signedDocuments[currentDocument.id] && (
            <form
              onSubmit={handleSubmitSignature}
              className="shrink-0 border-t border-slate-200 bg-white p-5 shadow-lg"
            >
              <div className="max-w-3xl mx-auto">
                {/* {requiresSignature && (
                  <div className="flex gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        updateCurrentDraft({ signatureType: 'type' });
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${signatureType === 'type'
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                      <Keyboard size={13} />
                      Type
                    </button>
                  </div>
                )} */}

                {/* Type Input */}
                {requiresSignature && signatureType === 'type' && (
                  <div className="mb-4">
                    <input
                      type="text"
                      value={typeSignature}
                      onChange={(e) => updateCurrentDraft({ typeSignature: e.target.value })}
                      placeholder="Type your full name..."
                      className="w-full max-w-md border-b-2 border-slate-300 focus:border-blue-700 focus:ring-0 text-2xl font-['Dancing_Script'] text-center bg-transparent outline-none transition-colors"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4 items-start">
                  {requiresAcceptance && (
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="legal-consent"
                        checked={agree}
                        onChange={(e) => updateCurrentDraft({ agree: e.target.checked })}
                        className="mt-1 w-4 h-4 border-slate-300 rounded cursor-pointer accent-blue-700"
                      />
                      <label htmlFor="legal-consent" className="text-[10px] mt-1 text-slate-600 leading-relaxed">
                        {currentDocument.acceptanceText}
                      </label>
                    </div>
                  )}
                  {!requiresAcceptance && (
                    <div className="text-[10px] text-slate-500 leading-relaxed">
                      Code of Conduct and Privacy acknowledgements are required before submitting.
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={loading || !canSubmitCurrentDocument}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-[11px] font-bold rounded-lg transition-all"
                    >
                      <Send size={13} />
                      {loading ? 'Submitting...' : 'Submit Signature'}
                    </button>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-all border border-slate-300"
                    >
                      <Trash2 size={13} />
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Signed State */}
          {signedDocuments[currentDocument.id] && (
            <div className="shrink-0 border-t border-slate-200 bg-green-50 p-5 shadow-lg">
              <div className="max-w-3xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-900">Document Signed Successfully</p>
                    <p className="text-xs text-green-700">
                      Signed on {new Date(signedDocuments[currentDocument.id].timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDoc((prev) => (prev + 1) % DOCUMENTS.length);
                    clearSignature();
                  }}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-[11px] font-bold rounded-lg transition-all"
                >
                  Next Document
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm animate-in fade-in zoom-in-95">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <div className="text-3xl font-bold text-green-600">✓</div>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Document Signed</h2>
              <p className="text-sm text-slate-600">
                {currentDocument.name} has been successfully signed and submitted.
              </p>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes zoom-in-95 {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-in {
          animation: fade-in 0.3s ease-in-out;
        }

        .fade-in {
          animation: fade-in 0.3s ease-in-out;
        }

        .zoom-in-95 {
          animation: zoom-in-95 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default DocumentSigningPage;
