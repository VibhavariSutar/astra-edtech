import React, { useState } from 'react';
import api from '../services/api';

const BackendTest = () => {
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  const testBackend = async () => {
    try {
      setStatus('testing');
      const response = await api.get('/');
      setStatus('success');
      setMessage(`Backend is running: ${response.data.message}`);
    } catch (error) {
      setStatus('error');
      setMessage(`Backend connection failed: ${error.message}`);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Backend Connection Test</h3>
      <button
        onClick={testBackend}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        disabled={status === 'testing'}
      >
        {status === 'testing' ? 'Testing...' : 'Test Backend'}
      </button>
      
      {status === 'success' && (
        <div className="mt-2 p-2 bg-green-100 text-green-800 rounded">
          ✅ {message}
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-2 p-2 bg-red-100 text-red-800 rounded">
          ❌ {message}
        </div>
      )}
    </div>
  );
};

export default BackendTest;