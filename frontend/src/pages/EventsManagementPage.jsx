import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Calendar, List, Mail, MessageSquare } from 'lucide-react';
import { getUser } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const EventsManagementPage = () => {
  const user = getUser();
  const navigate = useNavigate();

  // Check access
  const allowedRoles = ['super_admin', 'pasteur', 'responsable_eglise', 'gestion_projet'];
  if (!allowedRoles.includes(user?.role)) {
    return (
      <Layout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Accès refusé - Rôle non autorisé</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          {/* Communication */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/events/communication')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-500" />
                Communication en Masse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Envoyer des emails et SMS en masse avec suivi des réponses RSVP
              </p>
              <Button className="mt-4 w-full" variant="outline">
                Envoyer des Messages →
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
    </Layout>
  );
};

export default EventsManagementPage;
