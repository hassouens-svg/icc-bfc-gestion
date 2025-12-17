import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

const ROLES_LIST = [
  { id: 'visiteur', label: 'Visiteur / Nouveau' },
  { id: 'membre', label: 'Membre' },
  { id: 'berger', label: 'Berger' },
  { id: 'referent', label: 'Référent' },
  { id: 'responsable_fi', label: 'Responsable FI' },
  { id: 'responsable_promo', label: 'Responsable Promo' },
  { id: 'superviseur_promos', label: 'Superviseur Promos' },
  { id: 'pilote', label: 'Pilote' },
  { id: 'respo_departement', label: 'Responsable Département STARS' },
  { id: 'star', label: 'Membre STARS' },
  { id: 'coordinateur', label: 'Coordinateur' },
  { id: 'secretaire', label: 'Secrétaire' },
  { id: 'tresorier', label: 'Trésorier' },
  { id: 'pasteur', label: 'Pasteur' },
  { id: 'gestion_projet', label: 'Gestion de Projet' },
  { id: 'super_admin', label: 'Super Admin' },
];

// Base de connaissances de l'application
const APP_KNOWLEDGE = `
Tu es Audrey, l'assistante virtuelle de l'application ICC Hub (Impact Centre Chrétien). Tu connais parfaitement cette application.

## MODULES DE L'APPLICATION:

### 1. PAGE D'ACCUEIL
- Accès aux différents départements de l'église
- Pop-ups d'anniversaires des membres
- Pop-ups des événements à venir (dans les 30 jours)

### 2. LE PAIN DU JOUR (/pain-du-jour)
- Contenu spirituel quotidien
- Vidéos YouTube: Temps de prière prophétique + Enseignements
- Versets du jour avec lien vers EMCI TV
- Sondage de participation (lectures et vidéos)
- Administration: Gérer les contenus quotidiens + Statistiques
- Accès: Public (lecture), Admin pour mise à jour

### 3. MINISTÈRE DES STARS (/ministere-stars)
- Gestion des départements STARS (Service, Technique, Accueil, Régie, Sécurité)
- Planning hebdomadaire sur 52 semaines
- Attribution des tâches aux membres
- KPIs: nombre de stars en service par semaine
- Rôles: star (lecture seule), respo_departement (gestion)

### 4. MY EVENT CHURCH (/events-management)
- Gestion des projets et événements de l'église
- Planning des activités
- Campagnes d'évangélisation
- Statistiques des événements

### 5. FAMILLES IMPACT (/familles-impact)
- Gestion des Familles Impact (petits groupes)
- Suivi des membres par FI
- Présences aux rencontres

### 6. SUIVI DES NOUVEAUX (/nouveaux)
- Gestion des nouveaux arrivants et convertis
- Attribution aux bergers
- Suivi par promo mensuelle (Janvier à Décembre)
- Dashboard superviseur promos

### 7. GESTION DES ACCÈS (/gestion-acces)
- Création et gestion des utilisateurs
- Attribution des rôles
- Gestion des villes

## RÔLES ET PERMISSIONS:
- **super_admin**: Accès total à tout
- **pasteur**: Accès étendu, gestion spirituelle
- **gestion_projet**: Gestion des événements et projets
- **superviseur_promos**: Suivi des promos et bergers
- **responsable_promo**: Gestion d'une promo spécifique
- **responsable_fi**: Gestion d'une Famille Impact
- **berger/referent**: Suivi des nouveaux assignés
- **respo_departement**: Gestion d'un département STARS
- **star**: Membre du ministère STARS (lecture seule)
- **membre**: Accès basique

## FONCTIONNALITÉS CLÉS:
- Sélection de ville pour les admins multi-villes
- Bouton Accueil sur toutes les pages
- Historique des présences
- Statistiques et graphiques
- Export des données

## PROBLÈMES COURANTS:
1. "Je ne peux pas me connecter" → Vérifier nom d'utilisateur, mot de passe, et sélection de ville
2. "Je ne vois pas certaines pages" → Vérifier que le rôle permet l'accès
3. "Les données ne s'affichent pas" → Rafraîchir la page ou vérifier la connexion
4. "Comment ajouter un membre" → Aller dans Gestion des Accès > Créer utilisateur
`;

const ChatbotAudrey = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "Bonjour ! 👋 Je suis **Audrey**, votre assistante virtuelle ICC Hub.\n\nJe connais parfaitement cette application et je suis là pour vous aider.\n\n**Quel est votre rôle dans l'église ?**",
      showRoles: true
    }
  ]);
  const [userRole, setUserRole] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRoleSelect = (role) => {
    setUserRole(role);
    const roleLabel = ROLES_LIST.find(r => r.id === role)?.label || role;
    
    setMessages(prev => [
      ...prev,
      { type: 'user', content: `Je suis ${roleLabel}` },
      { 
        type: 'bot', 
        content: `Parfait ! En tant que **${roleLabel}**, vous avez accès à certaines fonctionnalités de l'application.\n\n**Comment puis-je vous aider ?** 🤔\n\nPosez-moi votre question ou décrivez votre problème.`,
        showRoles: false
      }
    ]);
  };

  const generateResponse = (question, role) => {
    const q = question.toLowerCase();
    const roleLabel = ROLES_LIST.find(r => r.id === role)?.label || role;
    
    // Réponses basées sur les mots-clés
    if (q.includes('connecter') || q.includes('connexion') || q.includes('login')) {
      return "Pour vous connecter :\n1. Allez sur la page de connexion\n2. Sélectionnez votre **ville**\n3. Entrez votre **nom d'utilisateur** et **mot de passe**\n4. Cliquez sur **Se connecter**\n\n⚠️ Si vous avez oublié vos identifiants, contactez votre administrateur.";
    }
    
    if (q.includes('pain du jour') || q.includes('pain quotidien')) {
      return "**Le Pain du Jour** est le module de nourriture spirituelle quotidienne !\n\n📖 **Contenu:**\n- Vidéo de prière prophétique\n- Enseignement du jour\n- Versets à méditer\n\n👉 Accessible depuis la page d'accueil\n👉 Cliquez sur la carte **Le Pain du Jour**\n\n" + (role === 'pasteur' || role === 'super_admin' || role === 'gestion_projet' ? "✏️ En tant que " + roleLabel + ", vous pouvez **mettre à jour** le contenu quotidien !" : "");
    }
    
    if (q.includes('stars') || q.includes('ministere') || q.includes('service')) {
      return "**Le Ministère des STARS** gère les équipes de service :\n\n⭐ **Départements:**\n- Service\n- Technique\n- Accueil\n- Régie\n- Sécurité\n\n📅 **Planning:** Organisé sur 52 semaines\n\n👉 Accessible via **Ministère des STARS** sur l'accueil";
    }
    
    if (q.includes('événement') || q.includes('event') || q.includes('planning') || q.includes('activité')) {
      return "**My Event Church** gère les événements et projets !\n\n🎉 **Fonctionnalités:**\n- Créer des projets/événements\n- Planning des activités\n- Campagnes d'évangélisation\n- Statistiques\n\n👉 Accessible via **My Event Church** sur l'accueil";
    }
    
    if (q.includes('nouveau') || q.includes('converti') || q.includes('arrivant') || q.includes('promo') || q.includes('berger')) {
      return "**Suivi des Nouveaux** gère l'accueil des nouveaux !\n\n👥 **Organisation:**\n- 12 promos mensuelles (Janvier à Décembre)\n- Attribution aux bergers\n- Suivi personnalisé\n\n📊 **Pour les superviseurs:**\n- Dashboard des statistiques\n- Marquer les présences\n- Historique complet";
    }
    
    if (q.includes('famille') || q.includes('fi') || q.includes('groupe')) {
      return "**Familles Impact** gère les petits groupes !\n\n🏠 **Organisation:**\n- Création de Familles Impact\n- Attribution des membres\n- Suivi des rencontres\n\n👉 Accessible via **Familles Impact** sur l'accueil";
    }
    
    if (q.includes('utilisateur') || q.includes('créer') || q.includes('compte') || q.includes('accès')) {
      if (['super_admin', 'pasteur', 'gestion_projet'].includes(role)) {
        return "Pour créer un utilisateur :\n\n1. Allez dans **Gestion des Accès**\n2. Cliquez sur **Créer un utilisateur**\n3. Remplissez les informations\n4. Sélectionnez le **rôle** approprié\n5. Validez\n\n✅ Le nouvel utilisateur pourra se connecter immédiatement.";
      } else {
        return "La création d'utilisateurs est réservée aux administrateurs.\n\n👉 Contactez votre **pasteur** ou **super admin** pour créer un compte.";
      }
    }
    
    if (q.includes('rôle') || q.includes('permission') || q.includes('droit')) {
      return "**Les rôles de l'application:**\n\n👑 **super_admin** - Accès total\n⛪ **pasteur** - Gestion spirituelle\n📋 **gestion_projet** - Événements\n👥 **superviseur_promos** - Suivi promos\n🐑 **berger/referent** - Suivi nouveaux\n⭐ **star** - Membre STARS\n👤 **membre** - Accès basique\n\nVotre rôle: **" + roleLabel + "**";
    }
    
    if (q.includes('statistique') || q.includes('stat') || q.includes('rapport')) {
      return "**Statistiques disponibles:**\n\n📊 **Pain du Jour:** Clics vidéos, réponses sondages\n📈 **STARS:** KPIs par semaine, membres en service\n🎉 **Events:** Participation, projets actifs\n👥 **Nouveaux:** Suivis par promo, conversions\n\n👉 Accédez aux stats depuis chaque module";
    }
    
    if (q.includes('aide') || q.includes('help') || q.includes('comment')) {
      return "Je peux vous aider sur :\n\n🔐 **Connexion et accès**\n📖 **Le Pain du Jour**\n⭐ **Ministère des STARS**\n🎉 **My Event Church**\n👥 **Suivi des Nouveaux**\n🏠 **Familles Impact**\n👤 **Gestion des utilisateurs**\n📊 **Statistiques**\n\nPosez-moi votre question ! 😊";
    }
    
    // Réponse par défaut
    return "Je comprends votre question. 🤔\n\nEn tant que **" + roleLabel + "**, voici ce que je vous conseille:\n\n1. Vérifiez que vous êtes bien connecté\n2. Assurez-vous d'avoir les droits nécessaires\n3. Utilisez le bouton **Accueil** 🏠 pour naviguer\n\nPouvez-vous me donner plus de détails sur votre problème ?";
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !userRole) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsTyping(true);
    
    // Simuler un délai de réponse
    setTimeout(() => {
      const response = generateResponse(userMessage, userRole);
      setMessages(prev => [...prev, { type: 'bot', content: response }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetChat = () => {
    setUserRole(null);
    setMessages([
      {
        type: 'bot',
        content: "Bonjour ! 👋 Je suis **Audrey**, votre assistante virtuelle ICC Hub.\n\nJe connais parfaitement cette application et je suis là pour vous aider.\n\n**Quel est votre rôle dans l'église ?**",
        showRoles: true
      }
    ]);
  };

  return (
    <>
      {/* Bouton flottant */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 ${isOpen ? 'hidden' : 'flex'} items-center justify-center`}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-4rem)] flex flex-col bg-white rounded-xl shadow-2xl border">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Audrey</h3>
                <p className="text-xs text-indigo-100">Assistant ICC Hub</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={resetChat}
                className="text-white hover:bg-white/20 h-8 w-8"
                title="Nouvelle conversation"
              >
                🔄
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.type === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg p-3`}>
                  <div className="flex items-start gap-2">
                    {msg.type === 'bot' && <Bot className="h-4 w-4 mt-0.5 text-indigo-600 flex-shrink-0" />}
                    <div className="text-sm whitespace-pre-line">
                      {msg.content.split('**').map((part, i) => 
                        i % 2 === 0 ? part : <strong key={i}>{part}</strong>
                      )}
                    </div>
                  </div>
                  
                  {/* Boutons de rôles */}
                  {msg.showRoles && !userRole && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ROLES_LIST.map(role => (
                        <Button
                          key={role.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleSelect(role.id)}
                          className="text-xs bg-white hover:bg-indigo-50 border-indigo-200"
                        >
                          {role.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={userRole ? "Posez votre question..." : "Sélectionnez d'abord votre rôle"}
                disabled={!userRole}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!userRole || !inputValue.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotAudrey;
