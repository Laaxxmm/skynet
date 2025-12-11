import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Agreement, AgreementStatus } from '../types';
import { ArrowLeft, Calendar, MapPin, Users, FileText, AlertTriangle, RefreshCw, CheckCircle, Edit3, Save, Download, Send, Eye } from 'lucide-react';
import { generateRenewalDraft } from '../services/geminiService';

interface AgreementDetailProps {
  agreement: Agreement;
  onBack: () => void;
  onUpdate: (updatedAgreement: Agreement) => void;
}

export const AgreementDetail: React.FC<AgreementDetailProps> = ({ agreement, onBack, onUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showOriginalModal, setShowOriginalModal] = useState(false);

  const [draftContent, setDraftContent] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [approvalSent, setApprovalSent] = useState(false);
  const [signerName, setSignerName] = useState('');

  const handleGenerateRenewal = async () => {
    setIsGenerating(true);
    try {
      const draft = await generateRenewalDraft(agreement);
      setDraftContent(draft);
      setShowRenewalModal(true);
      setIsEditing(false); // Default to read mode first
      setIsSigned(false);
      setApprovalSent(false);
      setSignerName('');
    } catch (e: any) {
      console.error("Renewal Error:", e);
      alert(`Failed to generate renewal: ${e.message || "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSign = () => {
    if (!signerName.trim()) {
      alert("Please enter the name of the authorized signatory.");
      return;
    }
    setIsSigned(true);
    setIsEditing(false);
  };

  const handleSubmitForApproval = () => {
    setApprovalSent(true);
    setTimeout(() => {
      onUpdate({
        ...agreement,
        status: AgreementStatus.PENDING_APPROVAL,
        // We don't update dates yet until approved
      });
      setShowRenewalModal(false);
      alert("Agreement Signed and Sent for Approval!");
    }, 1000);
  };

  const handleDownload = () => {
    alert("Downloading PDF...");
  };

  const handleDownloadOriginal = () => {
    alert(`Downloading original file: ${agreement.fileName}`);
  };

  const statusColors = {
    [AgreementStatus.ACTIVE]: 'bg-green-100 text-green-700 border-green-200',
    [AgreementStatus.EXPIRING_SOON]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    [AgreementStatus.EXPIRED]: 'bg-red-100 text-red-700 border-red-200',
    [AgreementStatus.PENDING_APPROVAL]: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mb-3 ${statusColors[agreement.status]}`}>
              {agreement.status === AgreementStatus.EXPIRING_SOON && <AlertTriangle className="w-3 h-3 mr-1" />}
              {agreement.status}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{agreement.partyB}</h1>
            <p className="text-slate-500 mt-1 flex items-center">
              <span className="font-semibold mr-2">{agreement.type}</span> • {agreement.location}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownloadOriginal}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" /> Download Original
            </button>
            <button
              onClick={() => setShowOriginalModal(true)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" /> View Original
            </button>
            {(agreement.status === AgreementStatus.EXPIRING_SOON || agreement.status === AgreementStatus.EXPIRED) && (
              <button
                onClick={handleGenerateRenewal}
                disabled={isGenerating}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md shadow-indigo-200 transition-all flex items-center"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                {isGenerating ? 'Draft Renewal...' : 'Renew Agreement'}
              </button>
            )}
            {agreement.status === AgreementStatus.PENDING_APPROVAL && (
              <button disabled className="px-4 py-2 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-medium opacity-75 cursor-not-allowed">
                Approval Pending
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Metadata */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:col-span-1 space-y-6 h-fit">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Key Dates</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase font-semibold">Start Date</label>
              <div className="flex items-center text-slate-700 mt-1">
                <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                {agreement.startDate}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase font-semibold">Expiry Date</label>
              <div className={`flex items-center mt-1 font-medium ${agreement.status === AgreementStatus.EXPIRED ? 'text-red-600' : 'text-slate-700'}`}>
                <Calendar className="w-4 h-4 mr-2 text-red-500" />
                {agreement.expiryDate}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase font-semibold">Renewal Date</label>
              <div className="flex items-center text-slate-700 mt-1">
                <RefreshCw className="w-4 h-4 mr-2 text-green-500" />
                {agreement.renewalDate || "Not Specified"}
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 pt-4">Parties</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase font-semibold">Party A (Us)</label>
              <div className="flex items-center text-slate-700 mt-1">
                <Users className="w-4 h-4 mr-2 text-indigo-500" />
                {agreement.partyA}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase font-semibold">Party B (Them)</label>
              <div className="flex items-center text-slate-700 mt-1">
                <Users className="w-4 h-4 mr-2 text-indigo-500" />
                {agreement.partyB}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase font-semibold">Location</label>
              <div className="flex items-center text-slate-700 mt-1">
                <MapPin className="w-4 h-4 mr-2 text-indigo-500" />
                {agreement.location}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Summary & Clauses */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Summary & Analysis</h3>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed mb-6">
              {agreement.summary}
            </p>

            <h4 className="font-semibold text-slate-800 mb-2">Key Clauses & Risks:</h4>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
              {agreement.status === 'Expiring Soon' && <li className="text-orange-600 font-medium">Agreement is expiring within 60 days. Immediate renewal action recommended.</li>}
              {agreement.type.includes("Distributor") && <li>Contains strict "Cross Regional Sales" penalty clauses (Clause 4.7 & 4.8).</li>}
              {agreement.type.includes("Rental") && <li>Includes annual escalation clause of 5% on rent.</li>}
              <li>Jurisdiction locked to Karnataka courts.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Original PDF View Modal */}
      {showOriginalModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
              <h2 className="text-lg font-medium flex items-center"><FileText className="mr-2 w-5 h-5" /> Original Document: {agreement.fileName}</h2>
              <button onClick={() => setShowOriginalModal(false)} className="hover:bg-slate-700 p-1 rounded">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-200 p-4 md:p-8 flex justify-center">
              <div className="bg-white shadow-lg border border-slate-300 h-fit w-full max-w-[210mm] min-h-[297mm] p-10 md:p-16 mx-auto text-slate-900 font-serif text-justify leading-relaxed break-words prose prose-sm max-w-none">
                <ReactMarkdown>{agreement.rawContent || "Document content unavailable."}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renewal Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Renewal Agreement Draft</h2>
                <p className="text-xs text-slate-500">
                  {isSigned ? 'Signed Document Preview' : 'Review & Edit Draft'}
                </p>
              </div>
              <button onClick={() => setShowRenewalModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-200 p-4 md:p-8 flex justify-center">
              <div className="bg-white shadow-lg border border-slate-300 h-fit w-full max-w-[210mm] p-10 md:p-16 transition-all relative mx-auto">

                {/* Signed Stamp Overlay */}
                {isSigned && (
                  <div className="absolute bottom-20 right-20 border-4 border-green-600 text-green-600 rounded-lg p-4 rotate-[-10deg] opacity-80 pointer-events-none z-10">
                    <div className="text-xs uppercase font-bold tracking-widest text-center">Digitally Signed</div>
                    <div className="text-sm font-bold text-center mt-1">{signerName}</div>
                    <div className="text-[10px] text-center">{new Date().toLocaleDateString()}</div>
                  </div>
                )}

                {isEditing ? (
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    className="w-full h-full min-h-[60vh] p-4 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-serif text-slate-800 text-base leading-7 resize-y whitespace-pre-wrap"
                  />
                ) : (
                  <div className="font-serif text-slate-900 text-base leading-7 text-justify break-words prose prose-sm max-w-none">
                    <ReactMarkdown>{draftContent}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex flex-col md:flex-row justify-between items-center gap-4">

              {!isSigned ? (
                <>
                  <div className="flex items-center text-xs text-slate-500">
                    <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                    Please review all clauses carefully before signing.
                  </div>
                  <div className="flex gap-3 w-full md:w-auto items-center">
                    <div className="w-48 mr-2">
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="Signatory Name"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`flex-1 md:flex-none px-4 py-2 border rounded-lg font-medium flex items-center justify-center transition-colors ${isEditing ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                      {isEditing ? <><Save className="w-4 h-4 mr-2" /> Save Changes</> : <><Edit3 className="w-4 h-4 mr-2" /> Edit Draft</>}
                    </button>
                    <button
                      onClick={handleSign}
                      className="flex-1 md:flex-none px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg transition-all flex items-center justify-center"
                    >
                      <FileText className="w-4 h-4 mr-2" /> E-Sign Document
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center text-xs text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Document Signed by {signerName}. Ready for approval.
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button
                      onClick={() => { setIsSigned(false); setIsEditing(true); }}
                      disabled={approvalSent}
                      className="px-4 py-2 text-slate-500 hover:text-slate-800 font-medium text-sm"
                    >
                      Edit (Revert Sign)
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download PDF
                    </button>
                    <button
                      onClick={handleSubmitForApproval}
                      disabled={approvalSent}
                      className={`px-6 py-2 rounded-lg text-white font-medium shadow-lg transition-all flex items-center justify-center ${approvalSent ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                      {approvalSent ? <CheckCircle className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      {approvalSent ? 'Sent for Approval' : 'Submit for Approval'}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
