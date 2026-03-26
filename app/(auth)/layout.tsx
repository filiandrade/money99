import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-lg">$</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Money<span className="text-indigo-400">99</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-2">
            Controle financeiro inteligente e simples
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
