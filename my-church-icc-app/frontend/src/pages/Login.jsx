import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { SITE } from '../config/site';
import { ErrorMsg, Field } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate(location.state?.from || '/tableau-de-bord', { replace: true });
    } catch (err) {
      setErreur(err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <img src={SITE.logo} alt="" className="mx-auto h-20 w-20" />
          <h1 className="mt-3 text-2xl font-black">{SITE.nom}</h1>
          <p className="text-sm text-slate-500">Connexion à {SITE.nomApplication}</p>
        </div>
        <ErrorMsg error={erreur} />
        <Field label="Identifiant"><input className="input" autoFocus required value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
        <Field label="Mot de passe"><input type="password" className="input" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <button className="btn-primary w-full">Se connecter</button>
        <p className="text-center text-sm"><Link to="/" className="text-indigo-600 hover:underline">← Retour à l'accueil</Link></p>
      </form>
    </div>
  );
}
