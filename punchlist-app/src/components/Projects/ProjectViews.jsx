import React, { useState } from 'react';
import { Folder, FolderPlus, LogOut, Settings } from 'lucide-react';

export function ProjectList({ projects, profile, onSelectProject, onCreateNew, onSignOut, onSettings }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">My Projects</h1>
          <p className="text-sm opacity-90">{profile.company_name || profile.full_name}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSettings}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onSignOut}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No projects yet</p>
            <p className="text-gray-400 text-sm mb-6">Create your first project to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="p-6 bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-blue-500 transition-colors text-left"
              >
                <h3 className="font-medium text-gray-900 text-lg">{project.name}</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onCreateNew}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
      >
        <FolderPlus className="w-8 h-8" />
      </button>
    </div>
  );
}

export function ProjectForm({ onSubmit, onCancel }) {
  const [projectName, setProjectName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(projectName);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">New Project</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-2xl mx-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Main Street Office Building"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Project
          </button>
        </div>
      </form>
    </div>
  );
}