import React, { useState, useEffect } from 'react';
import EventsLayout from '../components/EventsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Calendar, List, Mail, MessageSquare, LogOut } from 'lucide-react';
import { getUser } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const EventsManagementPage = () => {
  const user = getUser();
  const navigate = useNavigate();

  // Check if user is logged in
  if (!user) {
    // Not logged in - redirect to login
    useEffect(() => {
      navigate('/login');
    }, [navigate]);
    return null;
  }

  // Check access - ONLY super_admin, pasteur, responsable_eglise, gestion_projet
  const allowedRoles = ['super_admin', 'pasteur', 'responsable_eglise', 'gestion_projet'];
  if (!allowedRoles.includes(user?.role)) {
    return (
      <EventsLayout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">🔒</div>
                <h2 className="text-2xl font-bold text-gray-800">Accès réservé</h2>
                <p className="text-gray-600">
                  Vous êtes actuellement connecté en tant que <strong>{user.role}</strong>.
                </p>
                <p className="text-gray-600">
                  Ce module est réservé aux rôles suivants :
                </p>
                <div className="bg-blue-50 p-4 rounded-lg inline-block">
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Pasteur</li>
                    <li>✓ Super Admin</li>
                    <li>✓ Responsable d'Église</li>
                    <li>✓ Gestion Projet</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Veuillez vous déconnecter et vous reconnecter avec un compte autorisé.
                </p>
                <div className="flex gap-3 justify-center mt-6">
                  <Button 
                    onClick={() => {
                      localStorage.clear();
                      navigate('/events-login');
                    }}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </EventsLayout>
    );
  }

  return (
    <EventsLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-indigo-600" />
              My Events Church
            </h1>
            <p className="text-gray-500 mt-1">Gestion de Projets & Communication</p>
          </div>
        </div>

        {/* Quick Actions Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Planning des Activités */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/events/planning')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Planning des Activités
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Planifier et suivre vos activités par ville avec statuts et commentaires
              </p>
              <Button className="mt-4 w-full" variant="outline">
                Accéder au Planning →
              </Button>
            </CardContent>
          </Card>

          {/* Projets/Événements */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/events/projets')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5 text-blue-500" />
                Projets & Événements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Créer et gérer vos projets, tâches, budgets et suivre l'avancement
              </p>
              <Button className="mt-4 w-full" variant="outline">
                Accéder aux Projets →
              </Button>
            </CardContent>
          </Card>

          {/* Email */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/events/email')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                📧 Emails en Masse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Envoyer des emails personnalisés avec images et RSVP
              </p>
              <Button className="mt-4 w-full" variant="outline">
                Envoyer des Emails →
              </Button>
            </CardContent>
          </Card>

          {/* SMS */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/events/sms')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                📱 SMS en Masse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Envoyer des SMS personnalisés via Brevo avec RSVP
              </p>
              <Button className="mt-4 w-full" variant="outline">
                Envoyer des SMS →
              </Button>
            </CardContent>
          </Card>

          {/* Liens RSVP */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/events/rsvp-links')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-pink-500" />
                🔗 Liens RSVP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Créer des liens RSVP partageables avec photos et voir les statistiques
              </p>
              <Button className="mt-4 w-full" variant="outline">
                Créer un Lien →
              </Button>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/events/stats')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                Statistiques RSVP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Voir les réponses et statistiques de vos campagnes de communication
              </p>
              <Button className="mt-4 w-full" variant="outline">
                Voir les Stats →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 text-white p-2 rounded">
                ℹ️
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Bienvenue dans My Events Church</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Ce module vous permet de gérer vos projets d'église, organiser des événements, 
                  et communiquer efficacement avec votre communauté via email et SMS.
                </p>
                <ul className="text-sm text-blue-800 mt-2 list-disc list-inside">
                  <li>Créez des projets avec tâches et deadlines</li>
                  <li>Envoyez des invitations avec réponses RSVP automatiques</li>
                  <li>Suivez l'avancement et les budgets en temps réel</li>
                  <li>Collaborez avec toute votre équipe</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </EventsLayout>
  );
};

export default EventsManagementPage;