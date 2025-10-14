import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function TeamModal({ 
  projectTeam, 
  trades, 
  onClose, 
  onAddMember, 
  onRemoveMember 
}) {
  const [newTeamMember, setNewTeamMember] = useState({ 
    email: '', 
    trade: '', 
    name: '' 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onAddMember(newTeamMember);
    setNewTeamMember({ email: '', trade: '', name: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Project Team</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-sm text-gray-700">Add Team Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Name (optional)"
              value={newTeamMember.name}
              onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email *"
              required
              value={newTeamMember.email}
              onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              required
              value={newTeamMember.trade}
              onChange={(e) => setNewTeamMember({ ...newTeamMember, trade: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select trade *</option>
              {trades.map(trade => (
                <option key={trade} value={trade}>{trade}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Add Member
          </button>
        </form>

        <div className="space-y-2">
          <h3 className="font-medium text-sm text-gray-700 mb-3">Current Team ({projectTeam.length})</h3>
          {projectTeam.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No team members added yet</p>
          ) : (
            projectTeam.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {member.name && (
                      <span className="font-medium text-sm">{member.name}</span>
                    )}
                    <span className="text-sm text-gray-600">{member.email}</span>
                  </div>
                  <span className="text-xs text-gray-500 uppercase">{member.trade}</span>
                </div>
                <button
                  onClick={() => onRemoveMember(member.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove member"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}