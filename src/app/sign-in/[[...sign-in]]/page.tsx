import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080C18] px-4">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#F59E0B',
            colorBackground: '#1E2A3B',
            colorText: '#F1F5F9',
            colorTextSecondary: '#CBD5E1',
            colorInputBackground: '#0F172A',
            colorInputText: '#F1F5F9',
            colorNeutral: '#CBD5E1',
            colorDanger: '#F87171',
            colorSuccess: '#34D399',
            colorTextOnPrimaryBackground: '#0F172A',
            borderRadius: '10px',
            fontFamily: 'inherit',
            fontSize: '15px',
          },
        }}
      />
    </div>
  );
}
