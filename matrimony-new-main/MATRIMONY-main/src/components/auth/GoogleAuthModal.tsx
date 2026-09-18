import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { X, Calendar, Phone, Heart, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { decodeGoogleIdToken, extractNameFromEmail } from '../../utils/nameUtils';
import { getMaxDobDateString, isAtLeast18YearsOld } from '../../utils/validationSchemas';

export interface GoogleExtraData {
  gender?: string;
  date_of_birth?: string;
  phone?: string;
}

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToken?: (idToken: string, extraData?: GoogleExtraData) => void;
  mode?: 'login' | 'register';
  initialGender?: string;
  initialDob?: string;
  initialPhone?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessToken,
  mode = 'login',
  initialGender = 'Male',
  initialDob = '',
  initialPhone = ''
}) => {
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<{ name?: string; email?: string; picture?: string } | null>(null);

  const [gender, setGender] = useState(initialGender || 'Male');
  const [dob, setDob] = useState(initialDob || '');
  const [phone, setPhone] = useState(initialPhone || '');
  const [dobError, setDobError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const maxAllowedDob = getMaxDobDateString();

  if (!isOpen) return null;

  const handleGoogleSuccess = (credentialResponse: any) => {
    const idToken = credentialResponse.credential;
    if (!idToken) return;

    // If in Login mode OR user already entered their real DOB on the form, complete immediately
    if (mode === 'login' || (initialDob && isAtLeast18YearsOld(initialDob))) {
      onSuccessToken?.(idToken, {
        gender: initialGender || 'Male',
        date_of_birth: initialDob,
        phone: initialPhone
      });
      return;
    }

    // In Register mode without DOB: decode user and ask for real DOB & Gender
    const decoded = decodeGoogleIdToken(idToken);
    const email = decoded?.email || '';
    const fullName = decoded?.name || extractNameFromEmail(email);
    setGoogleUser({
      name: fullName,
      email: email,
      picture: decoded?.picture
    });
    setGoogleToken(idToken);
  };

  const handleCompleteRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setDobError('');
    setPhoneError('');

    if (!dob) {
      setDobError('Please select your date of birth.');
      return;
    }
    if (!isAtLeast18YearsOld(dob)) {
      setDobError('You must be at least 18 years old to register.');
      return;
    }

    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (googleToken && onSuccessToken) {
      onSuccessToken(googleToken, {
        gender: gender || 'Male',
        date_of_birth: dob,
        phone: cleanPhone
      });
    }
  };

  const handleClose = () => {
    setGoogleToken(null);
    setGoogleUser(null);
    setDobError('');
    setPhoneError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {!googleToken ? (
          /* STEP 1: Google OAuth Button */
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xl border border-blue-100 shadow-sm">
                G
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                {mode === 'register' ? 'Register with Google' : 'Sign in with Google'}
              </h3>
              <p className="text-xs text-stone-500">
                {mode === 'register'
                  ? 'Quick & secure registration with your verified Google account'
                  : 'Authenticate securely with your Google Account'}
              </p>
            </div>

            <div className="flex justify-center py-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.warn('Google Sign In Failed');
                }}
                shape="pill"
                theme="outline"
                size="large"
                text={mode === 'register' ? 'signup_with' : 'continue_with'}
                width="100%"
              />
            </div>

            <div className="pt-2 text-center text-[10px] text-stone-400 border-t border-stone-100">
              Google will verify your account and return secure credentials to Vivah Matrimony.
            </div>
          </div>
        ) : (
          /* STEP 2: Required Basic Details (Gender, DOB, Phone) */
          <form onSubmit={handleCompleteRegister} className="space-y-4">
            <div className="text-center space-y-1">
              {googleUser?.picture ? (
                <img
                  src={googleUser.picture}
                  alt={googleUser.name}
                  className="w-12 h-12 rounded-full mx-auto border-2 border-primary shadow-xs object-cover"
                />
              ) : (
                <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-1 font-bold text-lg border border-rose-100">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              )}
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Welcome, {googleUser?.name || 'Member'}!
              </h3>
              <p className="text-[11px] text-stone-500">
                Please enter your real Date of Birth & Gender to complete your profile registration
              </p>
            </div>

            {/* Gender Selection */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-800">
                Gender <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="Male">Male (Groom)</option>
                  <option value="Female">Female (Bride)</option>
                </select>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-800">
                Date of Birth <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                <input
                  type="date"
                  max={maxAllowedDob}
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value);
                    if (dobError) setDobError('');
                  }}
                  className={`w-full pl-9 pr-3 py-2 text-xs font-medium border rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    dobError ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-stone-300'
                  }`}
                />
              </div>
              {dobError && <p className="text-[10px] font-semibold text-rose-600">{dobError}</p>}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-800">
                Mobile Number <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    if (phoneError) setPhoneError('');
                  }}
                  className={`w-full pl-9 pr-3 py-2 text-xs font-medium border rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    phoneError ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-stone-300'
                  }`}
                />
              </div>
              {phoneError && <p className="text-[10px] font-semibold text-rose-600">{phoneError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <span>Complete Registration</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
