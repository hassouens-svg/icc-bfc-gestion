import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Heart, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const EvangelisationPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [eglise, setEglise] = useState({
    nombre_gagneurs_ame: 0,
    nombre_personnes_receptives: 0,
    nombre_priere_salut: 0,
    nombre_contacts_pris: 0,
    nombre_ames_invitees: 0,
    nombre_miracles: 0,
    commentaire: ''
  });
  
  const [famillesImpact, setFamillesImpact] = useState({
    nombre_gagneurs_ame: 0,
    nombre_personnes_receptives: 0,
    nombre_priere_salut: 0,
    nombre_contacts_pris: 0,
    nombre_ames_invitees: 0,
    nombre_miracles: 0,
    commentaire: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'responsable_evangelisation') {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/evangelisation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          date,
          ville: user.city,
          eglise: {
            type: 'eglise',
            ...eglise
          },
          familles_impact: {
            type: 'familles_impact',
            ...famillesImpact
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement');
      }
      
      toast.success('Données enregistrées avec succès!');
      
      // Reset form
      setEglise({
        nombre_gagneurs_ame: 0,
        nombre_personnes_receptives: 0,
        nombre_priere_salut: 0,
        nombre_contacts_pris: 0,
        nombre_ames_invitees: 0,
        nombre_miracles: 0,
        commentaire: ''
      });
      setFamillesImpact({
        nombre_gagneurs_ame: 0,
        nombre_personnes_receptives: 0,
        nombre_priere_salut: 0,
        nombre_contacts_pris: 0,
        nombre_ames_invitees: 0,
        nombre_miracles: 0,
        commentaire: ''
      });
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dynamique d'Évangélisation</h1>
            <p className="text-gray-500 mt-1">{user?.city}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </CardContent>
          </Card>

          {/* Évangélisation de l'Église */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Heart className="h-5 w-5" />
                Évangélisation de l'Église
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Gagneurs d'âme</Label>
                  <Input
                    type="number"
                    min="0"
                    value={eglise.nombre_gagneurs_ame}
                    onChange={(e) => setEglise({...eglise, nombre_gagneurs_ame: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Personnes réceptives</Label>
                  <Input
                    type="number"
                    min="0"
                    value={eglise.nombre_personnes_receptives}
                    onChange={(e) => setEglise({...eglise, nombre_personnes_receptives: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Prières du salut</Label>
                  <Input
                    type="number"
                    min="0"
                    value={eglise.nombre_priere_salut}
                    onChange={(e) => setEglise({...eglise, nombre_priere_salut: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Contacts pris</Label>
                  <Input
                    type="number"
                    min="0"
                    value={eglise.nombre_contacts_pris}
                    onChange={(e) => setEglise({...eglise, nombre_contacts_pris: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Âmes invitées à l'église</Label>
                  <Input
                    type="number"
                    min="0"
                    value={eglise.nombre_ames_invitees}
                    onChange={(e) => setEglise({...eglise, nombre_ames_invitees: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Miracles</Label>
                  <Input
                    type="number"
                    min="0"
                    value={eglise.nombre_miracles}
                    onChange={(e) => setEglise({...eglise, nombre_miracles: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div>
                <Label>Commentaire</Label>
                <Textarea
                  value={eglise.commentaire}
                  onChange={(e) => setEglise({...eglise, commentaire: e.target.value})}
                  placeholder="Commentaires..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Évangélisation des Familles d'Impact */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Users className="h-5 w-5" />
                Évangélisation des Familles d'Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Gagneurs d'âme</Label>
                  <Input
                    type="number"
                    min="0"
                    value={famillesImpact.nombre_gagneurs_ame}
                    onChange={(e) => setFamillesImpact({...famillesImpact, nombre_gagneurs_ame: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Personnes réceptives</Label>
                  <Input
                    type="number"
                    min="0"
                    value={famillesImpact.nombre_personnes_receptives}
                    onChange={(e) => setFamillesImpact({...famillesImpact, nombre_personnes_receptives: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Prières du salut</Label>
                  <Input
                    type="number"
                    min="0"
                    value={famillesImpact.nombre_priere_salut}
                    onChange={(e) => setFamillesImpact({...famillesImpact, nombre_priere_salut: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Contacts pris</Label>
                  <Input
                    type="number"
                    min="0"
                    value={famillesImpact.nombre_contacts_pris}
                    onChange={(e) => setFamillesImpact({...famillesImpact, nombre_contacts_pris: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Âmes invitées à l'église</Label>
                  <Input
                    type="number"
                    min="0"
                    value={famillesImpact.nombre_ames_invitees}
                    onChange={(e) => setFamillesImpact({...famillesImpact, nombre_ames_invitees: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Miracles</Label>
                  <Input
                    type="number"
                    min="0"
                    value={famillesImpact.nombre_miracles}
                    onChange={(e) => setFamillesImpact({...famillesImpact, nombre_miracles: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div>
                <Label>Commentaire</Label>
                <Textarea
                  value={famillesImpact.commentaire}
                  onChange={(e) => setFamillesImpact({...famillesImpact, commentaire: e.target.value})}
                  placeholder="Commentaires..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default EvangelisationPage;
