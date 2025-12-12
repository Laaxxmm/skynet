
import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { extractAgreementData } from '../services/geminiService';
import { saveAgreement } from '../services/databaseService';
import { Agreement, AgreementStatus } from '../types';

interface UploaderProps {
  onUploadComplete: (agreement: Agreement) => void;
  onCancel: () => void;
}

export const Uploader: React.FC<UploaderProps> = ({ onUploadComplete, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const mimeType = file.type;

        try {
          const data = await extractAgreementData(base64, mimeType);

          const today = new Date();
          const expiry = new Date(data.expiryDate || '');
          const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          let status = AgreementStatus.ACTIVE;
          if (isNaN(diffDays) || diffDays < 0) status = AgreementStatus.EXPIRED;
          else if (diffDays < 60) status = AgreementStatus.EXPIRING_SOON;

          const newAgreement: Agreement = {
            id: crypto.randomUUID(),
            fileName: file.name,
            type: data.type || "Unknown Agreement",
            partyA: data.partyA || "Unknown",
            partyB: data.partyB || "Unknown",
            startDate: data.startDate || today.toISOString().split('T')[0],
            renewalDate: data.renewalDate || "",
            expiryDate: data.expiryDate || "",
            location: data.location || "Unknown",
            status: status,
            riskScore: status === AgreementStatus.EXPIRED ? 90 : 10,
            summary: data.summary,
            rawContent: data.fullText // Storing the OCR'd text for high-fidelity renewal
          };

          // Save to Supabase
          try {
            const { error: dbError } = await saveAgreement(newAgreement);
            if (dbError) {
              console.error("Failed to save to database:", dbError);
              setError(`Saved locally, but failed to sync to database: ${dbError.message}`);
            }
          } catch (e: any) {
            console.error("Unexpected DB Error:", e);
            setError("Database connection failed.");
          }

          onUploadComplete(newAgreement);
        } catch (err) {
          setError("Failed to extract data using AI. Please try again.");
          console.error(err);
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (e) {
      setError("Error reading file.");
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-xl p-8 shadow-2xl relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Agreement</h2>
        <p className="text-slate-500 mb-6">Upload a PDF or Image. Our AI will extract metadata and preserve the original text for renewals.</p>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-indigo-700 font-medium text-lg">Analyzing document...</p>
            <p className="text-indigo-400 text-sm">Extracting clauses and formatting...</p>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-xl py-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
              }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="bg-indigo-100 p-4 rounded-full mb-4">
              <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-lg font-medium text-slate-700">Click to upload or drag and drop</p>
            <p className="text-slate-400 text-sm mt-1">PDF, PNG, JPG (Max 10MB)</p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center text-sm border border-red-100">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
