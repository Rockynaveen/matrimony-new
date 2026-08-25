import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { X } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToken?: (idToken: string) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessToken
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl border border-blue-100 shadow-sm">
            G
          </div>
          <h3 className="font-serif text-xl font-bold text-stone-900">Sign in with Google</h3>
          <p className="text-xs text-stone-500">Authenticate securely with your Google Account</p>
        </div>

        {/* Official Google OAuth Button */}
        <div className="flex justify-center py-2">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential && onSuccessToken) {
                onSuccessToken(credentialResponse.credential);
              }
            }}
            onError={() => {
              console.warn('Google Sign In Failed');
            }}
            shape="pill"
            theme="outline"
            size="large"
            text="continue_with"
            width="100%"
          />
        </div>

        <div className="pt-2 text-center text-[10px] text-stone-400 border-t border-stone-100">
          Google will verify your account and return secure credentials to Vivah Matrimony.
        </div>
      </div>
    </div>
  );
};
