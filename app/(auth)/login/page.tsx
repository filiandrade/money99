'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, Chrome } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth_callback_failed') {
      toast.error('Erro na autenticação. Tente novamente.');
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginForm) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('E-mail ou senha incorretos.');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Por favor, confirme seu e-mail antes de entrar.');
      } else {
        toast.error('Erro ao entrar. Tente novamente.');
      }
      return;
    }

    toast.success('Bem-vindo de volta!');
    router.push('/dashboard');
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error('Erro ao entrar com Google. Tente novamente.');
      setIsLoadingGoogle(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-sm shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl text-white">Entrar na sua conta</CardTitle>
        <CardDescription className="text-slate-400">
          Acesse seu painel financeiro
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Login com Google */}
        <Button
          variant="outline"
          className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
          onClick={handleGoogleLogin}
          disabled={isLoadingGoogle || isSubmitting}
        >
          {isLoadingGoogle ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Chrome className="mr-2 h-4 w-4" />
          )}
          Continuar com Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="bg-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-slate-500">ou continue com e-mail</span>
          </div>
        </div>

        {/* Formulário Email/Senha */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="pl-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                autoComplete="email"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-300">
                Senha
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-9 pr-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
            disabled={isSubmitting || isLoadingGoogle}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-slate-400 text-center w-full">
          Não tem uma conta?{' '}
          <Link
            href="/register"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Criar conta grátis
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
