import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const StrategiesBergeriePage = () => {
  const navigate = useNavigate();

  const tableData = [
    {
      id: 1,
      objectif: "Attirer les âmes",
      rc1: 18,
      plan1: "Intercession pour les âmes\nSorties d'évangélisation\nCommunication par RS\nCommunion fraternelle",
      rc2: 18,
      plan2: "Challenge «ramène ton pote» dans la bergerie\nJournée Gospel en extérieur\nActivités, jeux",
      rc3: 18,
      plan3: "Communion fraternelle\nFIJ\nIntercession\nRepérage pendant les cultes"
    },
    {
      id: 2,
      objectif: "Faire revenir les éloignés ou perdues",
      rc1: "",
      plan1: "Intercession\nSorties d'évangélisation\nCommunication par RS\nCommunion fraternelle",
      rc2: "",
      plan2: "Challenge «ramène ton pote» dans la bergerie\nJournée Gospel en extérieur\nActivités, jeux",
      rc3: "",
      plan3: "Communion fraternelle\nFIJ\nIntercession\nRepérage pendant les cultes"
    },
    {
      id: 3,
      objectif: "Fidéliser les âmes",
      rc1: 18,
      plan1: "Agapés, sorties bowling, casting, jeux,.. 1/mois\nCo-voiturage pour venir et rentrer des programmes\nPhonning\nIntérêt et être en mesure de répondre aux besoins de la personne\nTemps de prière",
      rc2: 18,
      plan2: "Phonning\nVisites\nAttribution de tuteurs dans la bergerie\nEntraide (hébergement, administration, social,…)",
      rc3: 18,
      plan3: "Covoiturage\nPhonning\nIntercession\nTemps de prières pour les sujets de chacun"
    },
    {
      id: 4,
      objectif: "Édifier, construire, guérir et transformer les vies",
      rc1: 18,
      plan1: "Enseignements des apôtres et pasteurs\nLe pain du Jour\nImpact X\nSmart ICC\nICC TV\nCommande au matin\nLivres",
      rc2: 18,
      plan2: "Enseignements des apôtres et pasteurs\nLe pain du Jour\nImpact X\nSmart ICC\nICC TV\nCommande au matin\nLivres",
      rc3: 18,
      plan3: "Enseignements des apôtres et pasteurs\nLe pain du Jour\nImpact X\nSmart ICC\nICC TV\nCommande au matin\nLivres"
    },
    {
      id: 5,
      objectif: "Déployer les âmes embrasées qui sentent l'appel brûlant en eux",
      rc1: "",
      plan1: "Responsabiliser les embrasés sur certaines tâches dans la bergerie et les confier le suivi des nouvelles âmes",
      rc2: "",
      plan2: "Responsabiliser les embrasés sur certaines tâches dans la bergerie et les confier le suivi des nouvelles âmes",
      rc3: "",
      plan3: "Responsabiliser les embrasés sur certaines tâches dans la bergerie et les confier le suivi des nouvelles âmes"
    },
    {
      id: 6,
      objectif: "Connecter les brebis (pour qu'ils se rencontrent pour mariage, affaires etc)",
      rc1: 18,
      plan1: "Atelier spécial mariage\nCréation d'un registre des célibataires dans la bergerie\nTemps de prière pour le mariage\nGala des célibataires intra et inter bergeries",
      rc2: 18,
      plan2: "Atelier spécial mariage\nCréation d'un registre des célibataires dans la bergerie\nTemps de prière pour le mariage\nGala des célibataires intra et inter bergeries",
      rc3: 18,
      plan3: "Gala des célibataires\nAteliers pour les célibataires\nTemps Dating"
    },
    {
      id: 7,
      objectif: "Préparer à briller nos membres (Briller pour influencer et faire des disciples)",
      rc1: 18,
      plan1: "",
      rc2: 18,
      plan2: "",
      rc3: 18,
      plan3: ""
    },
    {
      id: 8,
      objectif: "Assister les nécessiteux et ne laisser personne sur le carreau",
      rc1: "",
      plan1: "Création d'une caisse sociale et d'une banque sociale dans la bergerie",
      rc2: "",
      plan2: "Création d'une caisse sociale et d'une banque sociale dans la bergerie",
      rc3: "",
      plan3: "Création d'une caisse sociale et d'une banque sociale dans la bergerie"
    },
    {
      id: 9,
      objectif: "Mettre en place un niveau plus accru de protection des âmes, une détection plus rapide des abus et des signalements des dangers, des loups ravisseurs",
      rc1: "",
      plan1: "CSA - Cellule de signalisation des abus",
      rc2: "",
      plan2: "CSA - Cellule de signalisation des abus",
      rc3: "",
      plan3: "CSA - Cellule de signalisation des abus"
    },
    {
      id: 10,
      objectif: "Évaluer chaque semaine et chaque mois le niveau d'engagement et de progrès de chaque responsable leader piliers (dans quel domaine, quels tableaux de bord)",
      rc1: "",
      plan1: "Formulaire d'évaluation anonyme où les âmes peuvent juger les bergers de chaque bergerie",
      rc2: "",
      plan2: "Formulaire d'évaluation anonyme où les âmes peuvent juger les bergers de chaque bergerie",
      rc3: "",
      plan3: "Formulaire d'évaluation anonyme où les âmes peuvent juger les bergers de chaque bergerie"
    },
    {
      id: 11,
      objectif: "Identifier qui sont véritablement les disciples",
      rc1: "",
      plan1: "",
      rc2: "",
      plan2: "",
      rc3: "",
      plan3: ""
    },
    {
      id: 12,
      objectif: "Transformer chaque nouveau converti en disciple affermi dans les 3 premiers mois de sa conversion. Faire en sorte qu'il demeure bien enraciné bien entouré et dans le Christ",
      rc1: 18,
      plan1: "Enseignements des apôtres et pasteurs\nLe pain du Jour\nImpact X\nSmart ICC\nICC TV\nCommande au matin\nLivres",
      rc2: 18,
      plan2: "Enseignements des apôtres et pasteurs\nLe pain du Jour\nImpact X\nSmart ICC\nICC TV\nCommande au matin\nLivres",
      rc3: 18,
      plan3: "Enseignements des apôtres et pasteurs\nLe pain du Jour\nImpact X\nSmart ICC\nICC TV\nCommande au matin\nLivres"
    },
    {
      id: 13,
      objectif: "Remplir les cultes",
      rc1: "70%",
      plan1: "Phonning\nCo-voiturage",
      rc2: "70%",
      plan2: "Phonning\nCo-voiturage",
      rc3: "70%",
      plan3: "Phonning\nCo-voiturage"
    },
    {
      id: 14,
      objectif: "Mettre en place un système de défense de la e-réputation d'ICC",
      rc1: "",
      plan1: "",
      rc2: "",
      plan2: "",
      rc3: "",
      plan3: ""
    },
    {
      id: 15,
      objectif: "Multiplier par 3 le nombre de FI",
      rc1: 2,
      plan1: "",
      rc2: 2,
      plan2: "",
      rc3: 2,
      plan3: ""
    }
  ];

  const renderPlan = (text) => {
    if (!text) return <span className="text-gray-400 italic">-</span>;
    return (
      <ul className="list-disc list-inside text-sm space-y-1">
        {text.split('\n').map((line, idx) => (
          <li key={idx}>{line}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/bergeries')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Stratégies Bergerie ROYALTY</h1>
                <p className="text-sm text-gray-500">OKR - Objectifs et Résultats Clés (à atteindre d'ici 4 mois)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
          {/* En-tête fusionné */}
          <thead>
            <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <th colSpan={8} className="py-4 px-4 text-center text-lg font-bold border border-purple-700">
                Objectifs et résultats clés (à atteindre d'ici 4 mois)
              </th>
            </tr>
            <tr className="bg-purple-100 text-purple-900">
              <th className="py-3 px-2 border border-purple-300 text-center font-bold w-12">N°</th>
              <th className="py-3 px-3 border border-purple-300 text-left font-bold min-w-[200px]">Objectifs</th>
              <th className="py-3 px-2 border border-purple-300 text-center font-bold bg-blue-100 w-16">RC 1</th>
              <th className="py-3 px-3 border border-purple-300 text-left font-bold bg-blue-50 min-w-[180px]">Plan d'action pour RC1</th>
              <th className="py-3 px-2 border border-purple-300 text-center font-bold bg-green-100 w-16">RC 2</th>
              <th className="py-3 px-3 border border-purple-300 text-left font-bold bg-green-50 min-w-[180px]">Plan d'action pour RC2</th>
              <th className="py-3 px-2 border border-purple-300 text-center font-bold bg-orange-100 w-16">RC 3</th>
              <th className="py-3 px-3 border border-purple-300 text-left font-bold bg-orange-50 min-w-[180px]">Plan d'action pour RC3</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-3 px-2 border border-gray-200 text-center font-bold text-purple-700">
                  {row.id}
                </td>
                <td className="py-3 px-3 border border-gray-200 font-medium text-gray-800">
                  {row.objectif}
                </td>
                <td className="py-3 px-2 border border-gray-200 text-center font-bold text-blue-600 bg-blue-50">
                  {row.rc1 || '-'}
                </td>
                <td className="py-3 px-3 border border-gray-200 text-gray-700 bg-blue-50/30">
                  {renderPlan(row.plan1)}
                </td>
                <td className="py-3 px-2 border border-gray-200 text-center font-bold text-green-600 bg-green-50">
                  {row.rc2 || '-'}
                </td>
                <td className="py-3 px-3 border border-gray-200 text-gray-700 bg-green-50/30">
                  {renderPlan(row.plan2)}
                </td>
                <td className="py-3 px-2 border border-gray-200 text-center font-bold text-orange-600 bg-orange-50">
                  {row.rc3 || '-'}
                </td>
                <td className="py-3 px-3 border border-gray-200 text-gray-700 bg-orange-50/30">
                  {renderPlan(row.plan3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Légende */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h4 className="font-semibold mb-2 text-gray-800">Légende</h4>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span><strong>RC</strong> = Résultat Clé</span>
            <span><strong>18</strong> = Objectif de 18 personnes</span>
            <span><strong>70%</strong> = Taux de participation visé</span>
            <span><strong>FI</strong> = Famille d'Impact</span>
            <span><strong>FIJ</strong> = Famille d'Impact Jeunes</span>
            <span><strong>RS</strong> = Réseaux Sociaux</span>
            <span><strong>CSA</strong> = Cellule de Signalisation des Abus</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategiesBergeriePage;
