'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Chrome } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Este e-mail já está cadastrado. Tente fazer login.');
      } else {
        toast.error('Erro ao criar conta. Tente novamente.');
      }
      return;
    }

    toast.success('Conta criada! Verifique seu e-mail para confirmar o cadastro.', {
      duration: 6000,
    });
    router.push('/login');
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
        <CardTitle className="text-xl text-white">Criar sua conta</CardTitle>
        <CardDescription className="text-slate-400">
          Comece a controlar suas finanças hoje mesmo, grátis
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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
          Cadastrar com Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="bg-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-slate-500">ou cadastre com e-mail</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-slate-300">Nome completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="fullName"
                placeholder="Seu nome"
                className="pl-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                {...register('fullName')}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-red-400">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">E-mail</Label>
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
            <Label htmlFor="password" className="text-slate-300">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                className="pl-9 pr-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300">Confirmar senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repita a senha"
                className="pl-9 pr-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
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
                Criando conta...
              </>
            ) : (
              'Criar conta grátis'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-slate-400 text-center w-full">
          Já tem uma conta?{' '}
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Entrar
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
