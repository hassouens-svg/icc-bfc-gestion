import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Book, CheckCircle, XCircle, ArrowLeft, Trophy, Loader2, Home, BookOpen, Quote, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

const PainDuJourQuizPage = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadContent();
  }, [date]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/${date}`);
      const data = await response.json();
      setContent(data);
      if (data.quiz) {
        setAnswers(new Array(data.quiz.length).fill(-1));
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionIndex, answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const calculateScore = () => {
    if (!content?.quiz) return 0;
    let correct = 0;
    content.quiz.forEach((q, idx) => {
      if (answers[idx] === q.correct_index) {
        correct++;
      }
    });
    return correct;
  };

  const handleSubmitQuiz = async () => {
    // Vérifier que toutes les questions ont une réponse
    if (answers.includes(-1)) {
      toast.error('Veuillez répondre à toutes les questions');
      return;
    }

    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);

    // Envoyer au backend
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date,
          answers: answers,
          score: finalScore
        })
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!content?.resume || !content?.quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Contenu non disponible</h2>
        <p className="text-gray-600 mb-4">Le résumé et le quiz ne sont pas encore configurés pour cette date.</p>
        <Button onClick={() => navigate('/pain-du-jour')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au Pain du Jour
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/pain-du-jour')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">📖 Résumé & Quiz</h1>
                <p className="text-purple-100 text-xs md:text-sm">{formatDate(date)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20"
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Résumé */}
        <Card className="bg-white shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5" />
              Résumé de l'Enseignement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Titre */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {content.resume.titre || content.titre_enseignement}
              </h2>
            </div>

            {/* Résumé */}
            <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
              <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <Book className="h-4 w-4" />
                Résumé
              </h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {content.resume.resume}
              </p>
            </div>

            {/* Points clés */}
            {content.resume.points_cles && content.resume.points_cles.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Points Clés
                </h3>
                <ul className="space-y-2">
                  {content.resume.points_cles.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Versets cités */}
            {content.resume.versets_cites && content.resume.versets_cites.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  Versets Bibliques Cités
                </h3>
                <div className="flex flex-wrap gap-2">
                  {content.resume.versets_cites.map((verset, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {verset}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Citations */}
            {content.resume.citations && content.resume.citations.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <Quote className="h-4 w-4" />
                  Citations Marquantes
                </h3>
                <div className="space-y-3">
                  {content.resume.citations.map((citation, idx) => (
                    <blockquote key={idx} className="italic text-gray-700 border-l-2 border-purple-300 pl-3">
                      "{citation}"
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz */}
        <Card className="bg-white shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Quiz - Testez vos connaissances
              </div>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                {content.quiz.length} questions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {showResults ? (
              // Résultats
              <div className="space-y-6">
                <div className="text-center py-6">
                  <div className={`text-6xl mb-4 ${score >= content.quiz.length * 0.7 ? '🎉' : score >= content.quiz.length * 0.5 ? '👍' : '📚'}`}>
                    {score >= content.quiz.length * 0.7 ? '🎉' : score >= content.quiz.length * 0.5 ? '👍' : '📚'}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Votre score: {score}/{content.quiz.length}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    {score >= content.quiz.length * 0.7 
                      ? 'Excellent ! Vous avez bien compris l\'enseignement !'
                      : score >= content.quiz.length * 0.5 
                        ? 'Bon travail ! Continuez à méditer sur cet enseignement.'
                        : 'N\'hésitez pas à revoir l\'enseignement pour mieux comprendre.'}
                  </p>
                </div>

                {/* Correction */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Correction:</h4>
                  {content.quiz.map((q, idx) => (
                    <div key={idx} className={`p-4 rounded-lg ${answers[idx] === q.correct_index ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-start gap-2">
                        {answers[idx] === q.correct_index ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{idx + 1}. {q.question}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Bonne réponse: <span className="font-medium text-green-700">{q.options[q.correct_index]}</span>
                          </p>
                          {answers[idx] !== q.correct_index && (
                            <p className="text-sm text-red-600">
                              Votre réponse: {q.options[answers[idx]]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => navigate('/pain-du-jour')} 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au Pain du Jour
                </Button>
              </div>
            ) : (
              // Questions
              <div className="space-y-6">
                {content.quiz.map((q, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800 mb-3">
                      <span className="text-purple-600 font-bold">{idx + 1}.</span> {q.question}
                    </p>
                    <RadioGroup 
                      value={answers[idx]?.toString()} 
                      onValueChange={(v) => handleAnswer(idx, parseInt(v))}
                    >
                      {q.options.map((option, optIdx) => (
                        <div key={optIdx} className="flex items-center space-x-2 py-1">
                          <RadioGroupItem value={optIdx.toString()} id={`q${idx}-opt${optIdx}`} />
                          <Label htmlFor={`q${idx}-opt${optIdx}`} className="cursor-pointer text-gray-700">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-500">
                    {answers.filter(a => a !== -1).length}/{content.quiz.length} questions répondues
                  </p>
                  <Button 
                    onClick={handleSubmitQuiz}
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={answers.includes(-1)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider mes réponses
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        © 2025 ICC BFC-ITALIE - Le Pain du Jour
      </footer>
    </div>
  );
};

export default PainDuJourQuizPage;
