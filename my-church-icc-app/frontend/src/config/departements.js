/**
 * Cartes de la page d'accueil « Choisissez votre département ».
 * 👉 Pour ajouter une carte : copier un bloc, changer le titre, l'icône
 *    (voir https://lucide.dev/icons), la couleur et le lien.
 */
import {
  UserCheck, TrendingUp, Users, BookOpen, Shield, ShieldCheck, Heart, Star, BarChart3, CalendarDays,
} from 'lucide-react';

export const DEPARTEMENTS_ACCUEIL = [
  { titre: 'Accueil et Intégration', description: 'Consultation de la liste des nouveaux arrivants',
    icone: UserCheck, couleur: 'from-blue-400 to-blue-600', lien: '/accueil' },
  { titre: 'Promotions & Discipolat', description: 'Parcours de disciple, modules et mentorat',
    icone: TrendingUp, couleur: 'from-purple-400 to-purple-600', lien: '/discipolat' },
  { titre: "Familles d'Impact", description: 'Gestion des cellules de prière et suivi des membres',
    icone: Users, couleur: 'from-green-400 to-green-600', lien: '/familles' },
  { titre: 'MPI', sousTitre: 'Ministère de la Prière', description: 'Programmes et planning de prière',
    icone: BookOpen, couleur: 'from-amber-400 to-orange-500', lien: '/services/mpi' },
  { titre: 'Accès Spécifiques', description: 'Tableau de bord Pasteur et Super Admin',
    icone: Shield, couleur: 'from-red-400 to-red-600', lien: '/tableau-de-bord' },
  { titre: "Accès Bergers d'Église", description: "Responsables d'Église - Gestion des fidèles",
    icone: ShieldCheck, couleur: 'from-fuchsia-400 to-pink-600', lien: '/fideles' },
  { titre: "Dynamique d'Évangélisation", description: 'Nouveaux convertis, phoning et suivi',
    icone: Heart, couleur: 'from-rose-400 to-pink-600', lien: '/evangelisation' },
  { titre: 'Ministère des STARS', description: "Suivi et bien-être des stars de l'église",
    icone: Star, couleur: 'from-yellow-400 to-orange-500', lien: '/services/stars' },
  { titre: 'Statistiques', description: 'Effectifs des cultes, MR / MF, personnes reçues',
    icone: BarChart3, couleur: 'from-sky-400 to-cyan-600', lien: '/statistiques' },
  { titre: "Agenda de l'Église", description: 'Événements et activités à venir',
    icone: CalendarDays, couleur: 'from-indigo-400 to-indigo-600', lien: '/agenda' },
];
