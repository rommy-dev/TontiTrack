import { useMutation } from '@tanstack/react-query';
import { useNavigate }           from 'react-router-dom';
import toast                     from 'react-hot-toast';
import { authApi }               from '../api/auth.api.js';
import { useAuthStore }          from '../store/authStore.js';

export function useLogin() {
  const setAuth   = useAuthStore((s) => s.setAuth);
  const navigate  = useNavigate();

  return useMutation({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: ({ data }) => {
      setAuth({ user: data.data.user, accessToken: data.data.accessToken });
      toast.success(`Bienvenue, ${data.data.user.firstName} !`);
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Identifiants incorrects');
    },
  });
}

export function useRegister() {
  const setAuth   = useAuthStore((s) => s.setAuth);
  const navigate  = useNavigate();

  return useMutation({
    mutationFn: (data) => authApi.register(data),
    onSuccess: ({ data }) => {
      setAuth({ user: data.data.user, accessToken: data.data.accessToken });
      toast.success('Compte créé avec succès !');
      navigate('/dashboard');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error(msg);
    },
  });
}