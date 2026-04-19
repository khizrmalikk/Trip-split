import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0F1E] via-[#0D1530] to-[#0A0F1E] px-4">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#F59E0B',
            colorBackground: '#111827',
            colorText: '#F8FAFC',
            colorTextSecondary: '#94A3B8',
            colorInputBackground: '#1E293B',
            colorInputText: '#F8FAFC',
            colorNeutral: '#94A3B8',
            borderRadius: '0.75rem',
            fontFamily: 'inherit',
          },
          elements: {
            card: 'shadow-2xl shadow-black/60',
            headerTitle: 'text-white font-bold',
            headerSubtitle: 'text-slate-400',
            formButtonPrimary: 'bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold',
            footerActionLink: 'text-amber-400 hover:text-amber-300',
            identityPreviewEditButton: 'text-amber-400',
            formFieldLabel: 'text-slate-300 font-medium',
            formFieldInput: 'bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-amber-500',
            dividerLine: 'bg-slate-700',
            dividerText: 'text-slate-500',
            socialButtonsBlockButton: 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700',
            socialButtonsBlockButtonText: 'text-slate-200',
            formFieldInputShowPasswordButton: 'text-slate-400',
            alert: 'bg-red-950 border-red-800 text-red-300',
            alertText: 'text-red-300',
          },
        }}
      />
    </div>
  );
}
