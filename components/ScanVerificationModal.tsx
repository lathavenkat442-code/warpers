import React from 'react';

interface ScanVerificationModalProps {
  data: any[];
  onClose: () => void;
  onSave: (data: any[]) => void;
  language: string;
}

export const ScanVerificationModal: React.FC<ScanVerificationModalProps> = ({ data, onClose, onSave, language }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto space-y-4">
        <h2 className="text-lg font-bold">{language === 'ta' ? 'ஸ்கேன் செய்யப்பட்ட விவரங்கள்' : 'Scanned Details'}</h2>
        {data.map((entry, index) => (
          <div key={index} className={`p-4 rounded-xl border ${entry.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <p className="font-bold">{entry.weaverName} - {entry.color}</p>
            <p className="text-sm">{language === 'ta' ? 'தேதி' : 'Date'}: {entry.date}</p>
            <p className="text-sm">{language === 'ta' ? 'இலை' : 'Ends'}: {entry.ends}</p>
            <p className="text-sm">{language === 'ta' ? 'எடை' : 'Weight'}: {entry.weight} kg</p>
            {!entry.isValid && (
              <p className="text-sm text-red-600 font-bold mt-2">
                {language === 'ta' ? 'தவறு! எதிர்பார்க்கப்பட்ட எடை' : 'Error! Expected weight'}: {entry.expectedWeight.toFixed(2)} kg
              </p>
            )}
            {entry.isValid && (
              <p className="text-sm text-emerald-600 font-bold mt-2">
                {language === 'ta' ? 'சரியாக உள்ளது' : 'Correct'}
              </p>
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-4">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-200 rounded-xl font-bold">{language === 'ta' ? 'ரத்து' : 'Cancel'}</button>
          <button onClick={() => onSave(data)} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold">{language === 'ta' ? 'சேமி' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
};
