import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Layout/Header';

// 3D Animation Component
const AnimatedCard = ({ children, delay = 0, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={`transform transition-all duration-1000 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 rotate-0 scale-100'
          : 'opacity-0 translate-y-10 rotate-2 scale-95'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Floating Animation Component
const FloatingElement = ({ children, duration = 3000, className = '' }) => {
  return (
    <div
      className={`animate-float ${className}`}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

// 3D Flip Card Component
const FlipCard = ({ front, back, className = '' }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className={`flip-card ${className}`}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
        <div className="flip-card-front">
          {front}
        </div>
        <div className="flip-card-back">
          {back}
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [modules, setModules] = useState([]);
  const [doubtCount, setDoubtCount] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [progress, setProgress] = useState({});
  const [language, setLanguage] = useState('hindi');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState(null);
  const [particles, setParticles] = useState([]);
  const speechSynthRef = useRef(null);

  // Comprehensive language dictionary
  const translations = {
    hindi: {
      welcome: 'ग्रामीण शिक्षा केंद्र में आपका स्वागत है',
      subtitle: 'व्यावहारिक ज्ञान और कौशल विकास',
      xpPoints: 'अनुभव अंक',
      liveDoubts: 'लाइव संदेह',
      learningModules: 'शिक्षण मॉड्यूल',
      completedModules: 'पूर्ण मॉड्यूल',
      askDoubt: '🤔 संदेह पूछें (गुमनाम)',
      practicalLearning: 'व्यावहारिक शिक्षण मॉड्यूल',
      startLearning: 'सीखना शुरू करें',
      markComplete: 'पूरा किया',
      category: 'श्रेणी',
      duration: 'अवधि',
      quizzes: 'मनोरंजक क्विज़',
      startQuiz: 'क्विज़ शुरू करें',
      submitQuiz: 'क्विज़ जमा करें',
      cancel: 'रद्द करें',
      stop: 'रोकें',
      voiceSupport: 'आवाज़ सहायता',
      listen: 'सुनें',
      loading: 'लोड हो रहा है...',
      completed: 'पूर्ण',
      questions: 'सवाल',
      correctAnswers: 'सही जवाब',
      earnedXP: 'XP मिले',
      errorSubmitting: 'क्विज़ जमा करने में समस्या आई'
    },
    marathi: {
      welcome: 'ग्रामीण शिक्षण केंद्रात आपले स्वागत आहे',
      subtitle: 'व्यावहारिक ज्ञान आणि कौशल्य विकास',
      xpPoints: 'अनुभव गुण',
      liveDoubts: 'लाइव्ह शंका',
      learningModules: 'शिक्षण मॉड्यूल',
      completedModules: 'पूर्ण मॉड्यूल',
      askDoubt: '🤔 शंका विचारा (अनामिक)',
      practicalLearning: 'व्यावहारिक शिक्षण मॉड्यूल',
      startLearning: 'शिकणे सुरू करा',
      markComplete: 'पूर्ण केले',
      category: 'वर्ग',
      duration: 'कालावधी',
      quizzes: 'मनोरंजक क्विज',
      startQuiz: 'क्विज सुरू करा',
      submitQuiz: 'क्विज सबमिट करा',
      cancel: 'रद्द करा',
      stop: 'थांबवा',
      voiceSupport: 'व्हॉइस सहाय्य',
      listen: 'ऐका',
      loading: 'लोड होत आहे...',
      completed: 'पूर्ण',
      questions: 'प्रश्न',
      correctAnswers: 'बरोबर उत्तरे',
      earnedXP: 'XP मिळाले',
      errorSubmitting: 'क्विज सबमिट करताना समस्या आली'
    },
    english: {
      welcome: 'Welcome to Rural Education Center',
      subtitle: 'Practical Knowledge and Skill Development',
      xpPoints: 'XP Points',
      liveDoubts: 'Live Doubts',
      learningModules: 'Learning Modules',
      completedModules: 'Completed Modules',
      askDoubt: '🤔 Ask Doubt (Anonymous)',
      practicalLearning: 'Practical Learning Modules',
      startLearning: 'Start Learning',
      markComplete: 'Mark Complete',
      category: 'Category',
      duration: 'Duration',
      quizzes: 'Fun Quizzes',
      startQuiz: 'Start Quiz',
      submitQuiz: 'Submit Quiz',
      cancel: 'Cancel',
      stop: 'Stop',
      voiceSupport: 'Voice Support',
      listen: 'Listen',
      loading: 'Loading...',
      completed: 'Completed',
      questions: 'questions',
      correctAnswers: 'correct answers',
      earnedXP: 'XP earned',
      errorSubmitting: 'Error submitting quiz'
    }
  };

  const t = (key) => translations[language]?.[key] || key;

  // Language configurations for speech
  const languages = {
    hindi: { code: 'hi-IN', name: 'हिंदी', voiceName: 'Google हिन्दी' },
    marathi: { code: 'mr-IN', name: 'मराठी', voiceName: 'Google मराठी' },
    english: { code: 'en-US', name: 'English', voiceName: 'Google US English' }
  };

  // Enhanced modules with icons and colors
  const ruralLearningModules = [
    {
      _id: '1',
      icon: '📚',
      color: 'from-blue-400 to-blue-600',
      titles: {
        hindi: 'बुनियादी पढ़ाई-लिखाई',
        marathi: 'मूलभूत वाचन-लेखन',
        english: 'Basic Literacy'
      },
      descriptions: {
        hindi: 'रोजमर्रा की पढ़ाई और लिखाई सीखें',
        marathi: 'दैनंदिन वाचन आणि लेखन शिका',
        english: 'Learn everyday reading and writing'
      },
      content: {
        hindi: `# बुनियादी पढ़ाई-लिखाई\n\nअक्षर ज्ञान और रोजमर्रा के शब्द सीखें`,
        marathi: `# मूलभूत वाचन-लेखन\n\nमुळाक्षरे ज्ञान आणि दैनंदिन शब्द शिका`,
        english: `# Basic Literacy\n\nLearn alphabet knowledge and everyday words`
      },
      category: {
        hindi: 'बुनियादी शिक्षा',
        marathi: 'मूलभूत शिक्षण',
        english: 'Basic Education'
      },
      duration: '30 min',
      xpReward: 50
    },
    {
      _id: '2',
      icon: '🌾',
      color: 'from-green-400 to-green-600',
      titles: {
        hindi: 'कृषि ज्ञान',
        marathi: 'शेती ज्ञान',
        english: 'Agriculture Knowledge'
      },
      descriptions: {
        hindi: 'आधुनिक खेती के तरीके',
        marathi: 'आधुनिक शेतीचे पद्धती',
        english: 'Modern farming techniques'
      },
      content: {
        hindi: `# कृषि ज्ञान\n\nफसलें और आधुनिक तकनीकें सीखें`,
        marathi: `# शेती ज्ञान\n\nपिके आणि आधुनिक तंत्रज्ञान शिका`,
        english: `# Agriculture Knowledge\n\nLearn about crops and modern techniques`
      },
      category: {
        hindi: 'कृषि',
        marathi: 'शेती',
        english: 'Agriculture'
      },
      duration: '45 min',
      xpReward: 75
    },
    {
      _id: '3',
      icon: '💼',
      color: 'from-purple-400 to-purple-600',
      titles: {
        hindi: 'बुनियादी गणित',
        marathi: 'मूलभूत गणित',
        english: 'Basic Mathematics'
      },
      descriptions: {
        hindi: 'रोजमर्रा के गणित के सवाल',
        marathi: 'दैनंदिन गणिताचे प्रश्न',
        english: 'Everyday mathematics problems'
      },
      content: {
        hindi: `# बुनियादी गणित\n\nजोड़-घटाव और गुणा-भाग सीखें`,
        marathi: `# मूलभूत गणित\n\nबेरीज-वजाबाकी आणि गुणाकार-भागाकार शिका`,
        english: `# Basic Mathematics\n\nLearn addition, subtraction, multiplication, division`
      },
      category: {
        hindi: 'गणित',
        marathi: 'गणित',
        english: 'Mathematics'
      },
      duration: '40 min',
      xpReward: 60
    },
    {
      _id: '4',
      icon: '🏥',
      color: 'from-red-400 to-red-600',
      titles: {
        hindi: 'स्वास्थ्य जागरूकता',
        marathi: 'आरोग्य जागृती',
        english: 'Health Awareness'
      },
      descriptions: {
        hindi: 'स्वस्थ रहने के उपाय',
        marathi: 'निरोगी राहण्याचे उपाय',
        english: 'Ways to stay healthy'
      },
      content: {
        hindi: `# स्वास्थ्य जागरूकता\n\nस्वच्छता और पोषण के बारे में जानें`,
        marathi: `# आरोग्य जागृती\n\nस्वच्छता आणि पोषण याबद्दल जाणून घ्या`,
        english: `# Health Awareness\n\nLearn about hygiene and nutrition`
      },
      category: {
        hindi: 'स्वास्थ्य',
        marathi: 'आरोग्य',
        english: 'Health'
      },
      duration: '35 min',
      xpReward: 55
    },
    {
      _id: '5',
      icon: '💻',
      color: 'from-indigo-400 to-indigo-600',
      titles: {
        hindi: 'बुनियादी कंप्यूटर',
        marathi: 'मूलभूत संगणक',
        english: 'Basic Computer'
      },
      descriptions: {
        hindi: 'कंप्यूटर और मोबाइल का बुनियादी ज्ञान',
        marathi: 'संगणक आणि मोबाइलचे मूलभूत ज्ञान',
        english: 'Basic knowledge of computer and mobile'
      },
      content: {
        hindi: `# बुनियादी कंप्यूटर\n\nकंप्यूटर के भाग और उपयोग सीखें`,
        marathi: `# मूलभूत संगणक\n\nसंगणकाचे भाग आणि वापर शिका`,
        english: `# Basic Computer\n\nLearn computer parts and usage`
      },
      category: {
        hindi: 'तकनीक',
        marathi: 'तंत्रज्ञान',
        english: 'Technology'
      },
      duration: '50 min',
      xpReward: 70
    },
    {
      _id: '6',
      icon: '💰',
      color: 'from-yellow-400 to-yellow-600',
      titles: {
        hindi: 'बचत और बैंकिंग',
        marathi: 'बचत आणि बँकिंग',
        english: 'Savings & Banking'
      },
      descriptions: {
        hindi: 'पैसे बचाना और बैंक का उपयोग',
        marathi: 'पैसे वाचवणे आणि बँक वापर',
        english: 'Saving money and using banks'
      },
      content: {
        hindi: `# बचत और बैंकिंग\n\nबचत के तरीके और बैंकिंग सेवाएं सीखें`,
        marathi: `# बचत आणि बँकिंग\n\nबचत करण्याच्या पद्धती आणि बँकिंग सेवा शिका`,
        english: `# Savings & Banking\n\nLearn saving methods and banking services`
      },
      category: {
        hindi: 'वित्त',
        marathi: 'वित्त',
        english: 'Finance'
      },
      duration: '40 min',
      xpReward: 65
    }
  ];

  // Initialize speech synthesis and particles
  useEffect(() => {
    speechSynthRef.current = window.speechSynthesis;
    
    // Create floating particles
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3000 + 2000,
      delay: Math.random() * 2000
    }));
    setParticles(newParticles);

    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

  // Speech functions
  const speakText = (text, lang = language) => {
    if (!speechSynthRef.current) return;
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    const voiceConfig = languages[lang];
    
    utterance.lang = voiceConfig.code;
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = speechSynthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes(voiceConfig.voiceName) || 
      voice.lang === voiceConfig.code
    );
    
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentSpeech(utterance);
    };

    utterance.onend = utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentSpeech(null);
    };

    speechSynthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
      setCurrentSpeech(null);
    }
  };

  // Enhanced module functions with animations
  const startLearning = (module) => {
    setActiveModule(module);
    setProgress(prev => ({
      ...prev,
      [module._id]: { started: true, completed: false }
    }));
    
    // Auto-read module title and description
    const title = module.titles[language];
    const description = module.descriptions[language];
    speakText(`${title}. ${description}`);
  };

  const completeModule = (moduleId) => {
    setProgress(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], completed: true }
    }));
    setActiveModule(null);
    stopSpeaking();
  };

  // Socket and quiz functions
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    setSocket(newSocket);
    newSocket.emit('joinRoom', { room: 'village_classroom' });
    
    newSocket.on('doubtIncrement', () => setDoubtCount(prev => prev + 1));
    newSocket.on('quizStarted', setQuiz);

    setModules(ruralLearningModules);
    setLoading(false);

    return () => {
      newSocket.disconnect();
      stopSpeaking();
    };
  }, []);

  const raiseDoubt = () => {
    if (socket) {
      socket.emit('incrementDoubt', { 
        room: 'village_classroom', 
        raisedBy: user?.name || 'Student' 
      });
    }
  };

  const takeQuiz = (quiz) => setQuiz(quiz);

  const submitQuiz = async (answers) => {
    try {
      let score = 0;
      quiz.questions.forEach((question, index) => {
        if (answers[index] === question.correctIndex) score++;
      });

      const xpGain = score * 25;
      const successMessage = {
        hindi: `क्विज़ पूरी! आपके ${score}/${quiz.questions.length} सही जवाब! ${xpGain} XP मिले!`,
        marathi: `क्विज पूर्ण! तुमचे ${score}/${quiz.questions.length} बरोबर उत्तर! ${xpGain} XP मिळाले!`,
        english: `Quiz completed! You got ${score}/${quiz.questions.length} correct! Earned ${xpGain} XP!`
      };

      alert(successMessage[language]);
      speakText(successMessage[language]);
      setQuiz(null);
    } catch (err) {
      alert(t('errorSubmitting'));
    }
  };

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    stopSpeaking();
  };

  const isSpeechSupported = () => 'speechSynthesis' in window;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">
          {t('loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
      {/* Animated Background Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-green-200 rounded-full opacity-20 animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.duration}ms`,
            animationDelay: `${particle.delay}ms`
          }}
        />
      ))}

      <Header />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Language and Voice Controls */}
        <AnimatedCard delay={100}>
          <div className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/20">
            <div className="flex space-x-2">
              {Object.entries(languages).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => changeLanguage(key)}
                  className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-110 ${
                    language === key 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                      : 'bg-white/60 text-gray-700 hover:bg-white/80 shadow-md'
                  }`}
                >
                  {config.name}
                </button>
              ))}
            </div>

            {isSpeechSupported() && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 font-medium">
                  {t('voiceSupport')}
                </span>
                <button
                  onClick={stopSpeaking}
                  disabled={!isSpeaking}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-full font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                  ⏹️ {t('stop')}
                </button>
              </div>
            )}
          </div>
        </AnimatedCard>

        {/* Welcome Section with 3D Effect */}
        <FloatingElement duration={4000}>
          <AnimatedCard delay={200}>
            <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl p-8 mb-8 text-center shadow-2xl border-4 border-white/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 transform skew-y-6 scale-150"></div>
              <div className="relative z-10">
                <div className="flex justify-center items-center space-x-4 mb-4">
                  <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                    {t('welcome')}
                  </h1>
                  {isSpeechSupported() && (
                    <button
                      onClick={() => speakText(t('welcome'))}
                      className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
                      title={t('listen')}
                    >
                      <span className="text-2xl">🔊</span>
                    </button>
                  )}
                </div>
                <p className="text-white/90 text-lg md:text-xl font-medium">
                  {t('subtitle')}
                </p>
              </div>
            </div>
          </AnimatedCard>
        </FloatingElement>

        {/* Animated Stats Grid */}
        <AnimatedCard delay={300}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { value: user?.xp || 0, label: t('xpPoints'), color: 'from-yellow-400 to-yellow-600', icon: '⭐' },
              { value: doubtCount, label: t('liveDoubts'), color: 'from-orange-400 to-orange-600', icon: '🤔' },
              { value: modules.length, label: t('learningModules'), color: 'from-green-400 to-green-600', icon: '📚' },
              { value: Object.values(progress).filter(p => p.completed).length, 
                label: t('completedModules'), color: 'from-blue-400 to-blue-600', icon: '✅' }
            ].map((stat, index) => (
              <FlipCard
                key={index}
                className="h-32"
                front={
                  <div className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 text-white shadow-2xl h-full flex flex-col justify-center items-center transform perspective-1000`}>
                    <div className="text-3xl mb-2">{stat.icon}</div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm opacity-90">{stat.label}</div>
                  </div>
                }
                back={
                  <div className="bg-white rounded-2xl p-6 shadow-2xl h-full flex flex-col justify-center items-center">
                    <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                    <div className="text-sm text-gray-600 text-center">{stat.label}</div>
                  </div>
                }
              />
            ))}
          </div>
        </AnimatedCard>

        {/* 3D Doubt Button */}
        <AnimatedCard delay={400}>
          <div className="text-center mb-8">
            <button
              onClick={raiseDoubt}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-3xl active:scale-95 border-2 border-orange-300/50 relative overflow-hidden group"
            >
              <span className="relative z-10">{t('askDoubt')}</span>
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            </button>
          </div>
        </AnimatedCard>

        {/* 3D Learning Modules Grid */}
        <AnimatedCard delay={500}>
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              {t('practicalLearning')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {modules.map((module, index) => (
                <AnimatedCard key={module._id} delay={600 + index * 100}>
                  <div className="group perspective-1000">
                    <div className="relative preserve-3d group-hover:rotate-y-180 transition-transform duration-700 w-full h-80">
                      {/* Front of Card */}
                      <div className={`absolute inset-0 backface-hidden bg-gradient-to-br ${module.color} rounded-3xl p-6 text-white shadow-2xl border-4 border-white/20`}>
                        <div className="flex flex-col h-full justify-between">
                          <div className="text-center">
                            <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                              {module.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2">
                              {module.titles[language]}
                            </h3>
                            <p className="text-white/80 text-sm">
                              {module.descriptions[language]}
                            </p>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                              {module.duration}
                            </span>
                            <span className="text-yellow-300 font-bold">
                              +{module.xpReward} XP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Back of Card */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-3xl p-6 shadow-2xl border-4 border-gray-100">
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <span className={`bg-gradient-to-r ${module.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                                {module.category[language]}
                              </span>
                              {isSpeechSupported() && (
                                <button
                                  onClick={() => speakText(`${module.titles[language]}. ${module.descriptions[language]}`)}
                                  className="text-gray-600 hover:text-blue-600 transition-colors"
                                  title={t('listen')}
                                >
                                  <span className="text-xl">🔊</span>
                                </button>
                              )}
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                              {module.content[language].split('\n')[0]}
                            </p>
                          </div>

                          <button
                            onClick={() => startLearning(module)}
                            className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                          >
                            {t('startLearning')}
                          </button>

                          {progress[module._id]?.completed && (
                            <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                              ✅ {t('completed')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </section>
        </AnimatedCard>

        {/* Enhanced Quiz Section */}
        <AnimatedCard delay={1200}>
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              {t('quizzes')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: {
                    hindi: 'कृषि ज्ञान क्विज़',
                    marathi: 'शेती ज्ञान क्विज',
                    english: 'Agriculture Quiz'
                  },
                  questions: 3,
                  icon: '🌾',
                  color: 'from-green-400 to-green-600'
                },
                {
                  title: {
                    hindi: 'स्वास्थ्य क्विज़',
                    marathi: 'आरोग्य क्विज',
                    english: 'Health Quiz'
                  },
                  questions: 2,
                  icon: '🏥',
                  color: 'from-red-400 to-red-600'
                }
              ].map((quizItem, index) => (
                <AnimatedCard key={index} delay={1300 + index * 100}>
                  <div className={`bg-gradient-to-br ${quizItem.color} rounded-3xl p-6 text-white shadow-2xl border-4 border-white/20 transform hover:scale-105 transition-transform duration-300 cursor-pointer`}
                       onClick={() => takeQuiz({
                         _id: `quiz${index + 1}`,
                         title: quizItem.title[language],
                         questions: Array(quizItem.questions).fill().map((_, i) => ({
                           text: `${language === 'hindi' ? 'सवाल' : language === 'marathi' ? 'प्रश्न' : 'Question'} ${i + 1}`,
                           options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                           correctIndex: 0
                         }))
                       })}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl mb-2">{quizItem.icon}</div>
                        <h3 className="text-xl font-bold mb-2">{quizItem.title[language]}</h3>
                        <p>{quizItem.questions} {t('questions')}</p>
                      </div>
                      <div className="text-6xl opacity-50">❓</div>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </section>
        </AnimatedCard>
      </div>

      {/* Enhanced Quiz Modal */}
      {quiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <AnimatedCard className="w-full max-w-2xl">
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold">{quiz.title}</h3>
                  <button
                    onClick={() => setQuiz(null)}
                    className="text-white hover:text-gray-200 text-2xl transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const answers = quiz.questions.map((_, index) => {
                    const selected = document.querySelector(`input[name="q${index}"]:checked`);
                    return selected ? parseInt(selected.value) : -1;
                  });
                  
                  if (answers.includes(-1)) {
                    alert(`${t('pleaseAnswerAll')} ${t('questions')}`);
                    return;
                  }
                  
                  submitQuiz(answers);
                }}>
                  {quiz.questions.map((question, index) => (
                    <div key={index} className="mb-6 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-lg">
                          {t('question')} {index + 1}: {question.text}
                        </p>
                        {isSpeechSupported() && (
                          <button
                            type="button"
                            onClick={() => speakText(question.text)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            title={t('listen')}
                          >
                            <span className="text-xl">🔊</span>
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded transition-colors">
                            <input
                              type="radio"
                              name={`q${index}`}
                              value={optIndex}
                              required
                              className="w-5 h-5 text-blue-600"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      {t('submitQuiz')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuiz(null)}
                      className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </AnimatedCard>
        </div>
      )}

      {/* Enhanced Module Modal */}
      {activeModule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <AnimatedCard className="w-full max-w-4xl">
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-white/20 overflow-hidden">
              <div className={`bg-gradient-to-r ${activeModule.color} p-6 text-white`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl">{activeModule.icon}</span>
                    <div>
                      <h3 className="text-2xl font-bold">{activeModule.titles[language]}</h3>
                      <p className="text-white/80">{activeModule.descriptions[language]}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {isSpeechSupported() && (
                      <button
                        onClick={() => speakText(activeModule.content[language])}
                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                        title={t('listen')}
                      >
                        <span className="text-xl">🔊</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveModule(null)}
                      className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                    >
                      <span className="text-xl">✕</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-gray-700">
                  {activeModule.content[language]}
                </pre>
              </div>

              <div className="p-6 bg-gray-50 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {t('category')}: <span className="font-semibold">{activeModule.category[language]}</span>
                  </span>
                  <button
                    onClick={() => completeModule(activeModule._id)}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    {t('markComplete')} (+{activeModule.xpReward} XP)
                  </button>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </div>
      )}

      {/* Voice Support Warning */}
      {!isSpeechSupported() && (
        <div className="fixed bottom-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow-lg">
          {t('browserNoVoiceSupport')}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;