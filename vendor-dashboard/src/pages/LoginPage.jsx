import React, { useState } from 'react';
import api from '../api/client';

export default function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOTP = async () => {
    setLoading(true); setError('');
    try {
      const fullPhone = phone.startsWith('+233') ? phone : `+233${phone.replace(/^0/, '')}`;
      await api.post('/auth/send-otp', { phone: fullPhone });
      setPhone(fullPhone);
      setStep('otp');
    } catch (err) { setError(err.response?.data?.error || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/verify-otp', { phone, code: otp });
      if (res.data.user.role !== 'VENDOR') { setError('This login is for vendors only'); return; }
      onLogin(res.data.token);
    } catch (err) { setError(err.response?.data?.error || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-green-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🍚</div>
          <h1 className="text-2xl font-bold text-gray-800">CampusBite</h1>
          <p className="text-gray-500 mt-1">Vendor Dashboard</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">{error}</div>}

        {step === 'phone' ? (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <div className="flex border-2 border-green-500 rounded-xl overflow-hidden mb-4">
              <div className="px-3 bg-green-50 flex items-center text-sm font-semibold">🇬🇭 +233</div>
              <input className="flex-1 px-3 py-3 text-lg font-semibold outline-none" placeholder="XX XXX XXXX" value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} />
            </div>
            <button onClick={sendOTP} disabled={loading} className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 disabled:opacity-60 transition-colors">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-4">Enter the 6-digit OTP sent to {phone}</p>
            <input className="w-full border-2 border-green-500 rounded-xl px-4 py-3 text-2xl font-bold text-center tracking-widest mb-4 outline-none" placeholder="000000" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} />
            <button onClick={verifyOTP} disabled={loading} className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 disabled:opacity-60 transition-colors">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button onClick={() => setStep('phone')} className="w-full mt-3 text-gray-500 py-2 text-sm">← Back</button>
          </>
        )}
      </div>
    </div>
  );
}
