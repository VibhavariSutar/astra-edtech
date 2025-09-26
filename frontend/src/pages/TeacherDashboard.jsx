import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Layout/Header';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [modules, setModules] = useState([]);
  const [formData, setFormData] = useState({
    moduleTitle: '',
    moduleDescription: '',
    moduleContent: '',
    quizTitle: 'Quick Quiz',
    selectedModule: ''
  });
  const [questions, setQuestions] = useState([{ text: '', options: ['', '', '', ''], correctIndex: 0 }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('joinRoom', { room: 'classroom', user: user?.name });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setMessage('Connection issues. Real-time features may not work.');
    });

    fetchModules();

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const fetchModules = async () => {
    try {
      const res = await api.get('/modules/teacher');
      setModules(res.data);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setMessage('Failed to load modules');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    if (field === 'text') {
      updatedQuestions[index].text = value;
    } else if (field.startsWith('option')) {
      const optIndex = parseInt(field.replace('option', ''));
      updatedQuestions[index].options[optIndex] = value;
    } else if (field === 'correctIndex') {
      updatedQuestions[index].correctIndex = parseInt(value);
    }
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctIndex: 0 }]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const createModule = async () => {
    if (!formData.moduleTitle.trim()) {
      setMessage('Module title is required');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/modules', {
        title: formData.moduleTitle,
        description: formData.moduleDescription,
        content: formData.moduleContent
      });
      setMessage(`Module "${res.data.title}" created successfully!`);
      setFormData(prev => ({ ...prev, moduleTitle: '', moduleDescription: '', moduleContent: '' }));
      fetchModules();
    } catch (err) {
      console.error('Module creation error:', err);
      setMessage(err.response?.data?.msg || 'Failed to create module');
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setMessage(`Question ${i + 1} text is required`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        setMessage(`All options for question ${i + 1} are required`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.quizTitle,
        moduleId: formData.selectedModule,
        questions: questions.filter(q => q.text.trim()),
        room: 'classroom'
      };
      await api.post('/quizzes', payload);
      setMessage('Quiz saved successfully!');
    } catch (err) {
      console.error('Quiz creation error:', err);
      setMessage(err.response?.data?.msg || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    const validQuestions = questions.filter(q => q.text.trim());
    if (validQuestions.length === 0) {
      setMessage('Please add at least one question');
      return;
    }

    const quiz = {
      title: formData.quizTitle,
      questions: validQuestions,
      room: 'classroom'
    };

    if (socket) {
      socket.emit('startQuiz', quiz);
      setMessage('Quiz started for all students!');
    }
  };

  const resetDoubts = () => {
    if (socket) {
      socket.emit('resetDoubts', { room: 'classroom' });
      setMessage('Doubts counter reset!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('error') || message.includes('Failed') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Module Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Module</h3>
            <div className="space-y-4">
              <input
                name="moduleTitle"
                placeholder="Module Title"
                value={formData.moduleTitle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                name="moduleDescription"
                placeholder="Module Description"
                value={formData.moduleDescription}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                name="moduleContent"
                placeholder="Module Content"
                value={formData.moduleContent}
                onChange={handleInputChange}
                rows="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={createModule}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-semibold disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Module'}
              </button>
            </div>
          </div>

          {/* Quiz Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Create & Start Quiz</h3>
            <div className="space-y-4">
              <input
                name="quizTitle"
                placeholder="Quiz Title"
                value={formData.quizTitle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <select
                name="selectedModule"
                value={formData.selectedModule}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Module (optional)</option>
                {modules.map(module => (
                  <option key={module._id} value={module._id}>{module.title}</option>
                ))}
              </select>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Questions:</h4>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Add Question
                  </button>
                </div>
                
                {questions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium">Question {index + 1}</h5>
                      {questions.length > 1 && (
                        <button
                          onClick={() => removeQuestion(index)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <input
                      placeholder="Question text"
                      value={question.text}
                      onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                      className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <div className="space-y-2 mb-3">
                      {question.options.map((option, optIndex) => (
                        <input
                          key={optIndex}
                          placeholder={`Option ${optIndex + 1}`}
                          value={option}
                          onChange={(e) => handleQuestionChange(index, `option${optIndex}`, e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ))}
                    </div>
                    
                    <select
                      value={question.correctIndex}
                      onChange={(e) => handleQuestionChange(index, 'correctIndex', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {question.options.map((_, optIndex) => (
                        <option key={optIndex} value={optIndex}>
                          Correct Answer: Option {optIndex + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={createQuiz}
                  disabled={loading}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded font-semibold disabled:opacity-50"
                >
                  Save Quiz
                </button>
                <button
                  onClick={startQuiz}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded font-semibold"
                >
                  Start Live Quiz
                </button>
              </div>
              
              <button
                onClick={resetDoubts}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-semibold"
              >
                Reset Doubts Counter
              </button>
            </div>
          </div>
        </div>

        {/* Teacher's Modules */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Modules</h3>
          {modules.length === 0 ? (
            <p className="text-gray-600">No modules created yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map(module => (
                <div key={module._id} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-lg">{module.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      module.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {module.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(module.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;