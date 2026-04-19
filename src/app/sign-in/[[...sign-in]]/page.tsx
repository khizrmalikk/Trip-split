import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0F1E] via-[#0D1530] to-[#0A0F1E] px-4">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#F59E0B',
            colorBackground: '#0D1530',
            colorText: '#F8FAFC',
            colorTextSecondary: '#94A3B8',
            colorInputBackground: 'rgba(255,255,255,0.06)',
            colorInputText: '#F8FAFC',
            borderRadius: '0.75rem',
          },
          elements: {
            card: 'bg-[#0D1530]/95 border border-white/10 shadow-2xl shadow-black/40 backdrop-blur-xl',
            headerTitle: 'text-white',
            headerSubtitle: 'text-slate-400',
            formButtonPrimary: 'bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold',
            footerActionLink: 'text-amber-400 hover:text-amber-300',
            identityPreviewEditButton: 'text-amber-400',
            formFieldLabel: 'text-slate-300',
          },
        }}
      />
    </div>
  );
}
