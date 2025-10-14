import React, { useState } from 'react';

export default function AuthScreen({ onSignIn, onSignUp, loading }) {
  const [authView, setAuthView] = useState('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'gc',
    companyName: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authView === 'login') {
      onSignIn(authForm.email, authForm.password);
    } else {
      onSignUp(authForm);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          {authView === 'login' ? 'Log In' : 'Sign Up'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {authView === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={authForm.fullName}
                  onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  I am a...
                </label>
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="gc"
                      checked={authForm.role === 'gc'}
                      onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                      className="mr-2"
                    />
                    <span className="font-medium">GC / PM</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="sub"
                      checked={authForm.role === 'sub'}
                      onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                      className="mr-2"
                    />
                    <span className="font-medium">Subcontractor</span>
                  </label>
                </div>
              </div>

              {authForm.role === 'gc' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={authForm.companyName}
                    onChange={(e) => setAuthForm({ ...authForm, companyName: e.target.value })}
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : (authView === 'login' ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          {authView === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setAuthView(authView === 'login' ? 'signup' : 'login')}
            className="text-blue-600 font-medium hover:underline"
          >
            {authView === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}