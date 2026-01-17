import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Download, Upload, AlertCircle, CheckCircle2, Loader2, Database } from 'lucide-react';
import { exportAllData, importAllData, getUser } from '../utils/api';
import { toast } from 'sonner';

const AdminDataPage = () => {
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const navigate = useNavigate();
  const user = getUser();

  // Check if user is Super Admin
  React.useEffect(() => {
    if (!user) {
      navigate('/acces-specifiques');
      return;
    }
    if (!['super_admin', 'pasteur'].includes(user.role)) {
      toast.error('Accès refusé. Réservé aux Super Admin et Pasteur uniquement.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleExport = async () => {
    setExportLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      const data = await exportAllData();
      
      // Create a blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `icc-bfc-italie-backup-${timestamp}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setStatus({
        type: 'success',
        message: `Export réussi ! ${data.metadata?.total_records || 'Tous les'} enregistrements exportés.`
      });
      toast.success('Données exportées avec succès !');
    } catch (error) {
      console.log('Error in AdminDataPage.handleExport');
      console.error('Export error:', error);
      setStatus({
        type: 'error',
        message: `Erreur lors de l'export : ${error.response?.data?.detail || error.message}`
      });
      toast.error('Erreur lors de l\'export des données');
    } finally {
      setExportLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast.error('Veuillez sélectionner un fichier JSON');
        return;
      }
      setSelectedFile(file);
      setStatus({ type: '', message: '' });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier à importer');
      return;
    }

    setImportLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Read file content
      const fileContent = await selectedFile.text();
      const jsonData = JSON.parse(fileContent);

      // Validate data structure
      if (!jsonData.cities || !jsonData.users || !jsonData.visitors) {
        throw new Error('Format de fichier invalide. Le fichier doit contenir cities, users et visitors.');
      }

      // Import data
      const result = await importAllData(jsonData);
      
      setStatus({
        type: 'success',
        message: result.message || 'Import réussi !'
      });
      toast.success('Données importées avec succès !');
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.log('Error in AdminDataPage.handleImport');
      console.error('Import error:', error);
      let errorMessage = 'Erreur lors de l\'import';
      
      if (error.message.includes('Format de fichier invalide')) {
        errorMessage = error.message;
      } else if (error.response?.data?.detail) {
        errorMessage = `Erreur : ${error.response.data.detail}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStatus({
        type: 'error',
        message: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setImportLoading(false);
    }
  };

  if (!user || !['super_admin', 'pasteur'].includes(user.role)) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Gestion des Données</h1>
          </div>
          <p className="text-gray-600">
            Exportez et importez les données de la base de données. Réservé aux Super Admin.
          </p>
        </div>

        {/* Status Alert */}
        {status.message && (
          <Alert className={`mb-6 ${status.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            {status.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <AlertDescription className={status.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {status.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Export Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exporter les Données
            </CardTitle>
            <CardDescription>
              Exportez toutes les données de la base de données (villes, utilisateurs, visiteurs, secteurs, FI, membres, présences, statistiques des cultes) dans un fichier JSON.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExport}
              disabled={exportLoading}
              className="w-full sm:w-auto"
            >
              {exportLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter toutes les données
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-3">
              Le fichier sera téléchargé automatiquement avec un nom contenant la date et l'heure.
            </p>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importer les Données
            </CardTitle>
            <CardDescription>
              Importez les données depuis un fichier JSON exporté précédemment. Cette opération remplacera ou fusionnera les données existantes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un fichier JSON
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                  disabled={importLoading}
                />
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Fichier sélectionné : {selectedFile.name}
                  </p>
                )}
              </div>
              
              <Button
                onClick={handleImport}
                disabled={!selectedFile || importLoading}
                className="w-full sm:w-auto"
                variant={selectedFile ? 'default' : 'secondary'}
              >
                {importLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importer les données
                  </>
                )}
              </Button>

              <Alert className="border-yellow-500 bg-yellow-50">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Attention :</strong> L'import peut prendre plusieurs minutes selon la taille des données. 
                  Les données existantes avec le même ID seront remplacées.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Guide d'utilisation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p><strong>Migration Preview → Production :</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Connectez-vous à l'environnement <strong>preview</strong> en tant que Super Admin</li>
              <li>Accédez à cette page et cliquez sur "Exporter toutes les données"</li>
              <li>Téléchargez le fichier JSON généré</li>
              <li>Connectez-vous à l'environnement <strong>production</strong> en tant que Super Admin</li>
              <li>Accédez à cette page et sélectionnez le fichier JSON téléchargé</li>
              <li>Cliquez sur "Importer les données" et attendez la confirmation</li>
            </ol>
            <p className="mt-3"><strong>Note :</strong> Assurez-vous d'avoir une sauvegarde avant d'importer des données en production.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDataPage;
