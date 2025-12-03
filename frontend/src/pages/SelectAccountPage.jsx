import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, UserCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const SelectAccountPage = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState({});

  useEffect(() => {
    // Vérifier que l'utilisateur est pasteur ou superadmin
    if (!currentUser || !['pasteur', 'super_admin'].includes(currentUser.role)) {
      navigate('/dashboard');
      return;
    }

    loadAccounts();
  }, [currentUser, navigate]);

  const loadAccounts = async () => {
    try {
      const usersData = await getUsers();
      
      // Grouper par département
      const groupedByDept = {};
      
      usersData.forEach(user => {
        // Déterminer le département de l'utilisateur
        let dept = 'Autres';
        
        if (['referent', 'responsable_promos', 'promotions', 'berger'].includes(user.role)) {
          dept = 'Bergerie (Promotions)';
        } else if (['resp_bergers', 'berger'].includes(user.role)) {
          dept = 'Bergers';
        } else if (['accueil_integration'].includes(user.role)) {
          dept = 'Accueil et Intégration';
        } else if (['superviseur_promos'].includes(user.role)) {
          dept = 'Supervision Promotions';
        }
        
        if (!groupedByDept[dept]) {
          groupedByDept[dept] = [];
        }
        
        // Ne pas inclure le compte actuel
        if (user.id !== currentUser.id) {
          groupedByDept[dept].push(user);
        }
      });
      
      setDepartments(groupedByDept);
      setAccounts(usersData.filter(u => u.id !== currentUser.id));
    } catch (error) {
      toast.error('Erreur lors du chargement des comptes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = (targetUser) => {
    // Sauvegarder l'utilisateur actuel pour pouvoir revenir
    localStorage.setItem('original_user', JSON.stringify(currentUser));
    localStorage.setItem('is_impersonating', 'true');
    
    // Se connecter en tant que l'utilisateur cible
    localStorage.setItem('user', JSON.stringify(targetUser));
    toast.success(`Connecté en tant que ${targetUser.username}`);
    
    // Rediriger vers le dashboard
    navigate('/dashboard');
    window.location.reload();
  };

  const getRoleLabel = (role) => {
    const labels = {
      'referent': 'Référent',
      'responsable_promos': 'Responsable de Promos',
      'promotions': 'Promotions',
      'berger': 'Berger',
      'resp_bergers': 'Responsable Bergers',
      'accueil_integration': 'Accueil et Intégration',
      'superviseur_promos': 'Superviseur Promotions',
      'pasteur': 'Pasteur',
      'super_admin': 'Super Admin',
      'responsable_eglise': 'Responsable d\'Église'
    };
    return labels[role] || role;
  };

  const getAccountLabel = (user) => {
    let label = getRoleLabel(user.role);
    
    // Ajouter le mois si disponible
    if (user.assigned_month) {
      const monthStr = Array.isArray(user.assigned_month) 
        ? user.assigned_month.join(', ') 
        : user.assigned_month;
      label += ` - ${monthStr}`;
    }
    
    // Ajouter le nom de la promo si disponible
    if (user.promo_name) {
      label = user.promo_name;
    }
    
    return label;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">Sélection de Compte</CardTitle>
                <p className="text-gray-600 mt-2">
                  Connecté en tant que <strong>{currentUser.username}</strong> ({getRoleLabel(currentUser.role)})
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Mon Dashboard
              </Button>
            </div>
          </CardHeader>
        </Card>

        {Object.entries(departments).map(([dept, users]) => (
          users.length > 0 && (
            <Card key={dept} className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  {dept}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {users.map(user => (
                    <Button
                      key={user.id}
                      variant="outline"
                      className="h-auto py-4 px-4 text-left justify-start hover:bg-indigo-50 hover:border-indigo-300"
                      onClick={() => handleSelectAccount(user)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <UserCircle className="h-8 w-8 text-indigo-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {getAccountLabel(user)}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {user.username} • {user.city}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        ))}

        {accounts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun compte disponible</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SelectAccountPage;
