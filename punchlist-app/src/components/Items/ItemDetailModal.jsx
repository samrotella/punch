import React, { useState, useRef } from 'react';
import { X, Mail, Edit2, Camera } from 'lucide-react';
import {
  getStatusIcon,
  getStatusBadge,
  getStatusLabel,
  getStatusButtonLabel,
  canUpdateStatus
} from '../../utils/statusHelpers';

export default function ItemDetailModal({
  item,
  currentIndex,
  totalItems,
  filteredItems,
  profile,
  projectTeam = [],
  trades = [],
  onClose,
  onToggleStatus,
  onNavigate,
  onUpdate
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: item.name || '',
    description: item.description || '',
    location: item.location || '',
    trade: item.trade || '',
    assignedTo: item.assigned_to || '',
    photo: null,
    photoFile: null,
    existingPhotoUrl: item.photo_url || null
  });
  const [updating, setUpdating] = useState(false);
  const fileInputRef = useRef(null);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalItems - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      setIsEditing(false);
      onNavigate(filteredItems[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setIsEditing(false);
      onNavigate(filteredItems[currentIndex + 1]);
    }
  };

  const handleStatusUpdate = () => {
    onToggleStatus(item.id, item.status);
    onClose();
  };

  const handleTradeChange = (trade) => {
    const member = projectTeam && projectTeam.length > 0 
      ? projectTeam.find(m => m.trade === trade)
      : null;
    setEditForm({
      ...editForm,
      trade,
      assignedTo: member ? member.email : editForm.assignedTo
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.location || !editForm.trade) {
      alert('Please fill in all required fields');
      return;
    }

    setUpdating(true);
    try {
      await onUpdate(item.id, editForm);
      setIsEditing(false);
    } catch (error) {
      alert('Failed to update item: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: item.name || '',
      description: item.description || '',
      location: item.location || '',
      trade: item.trade || '',
      assignedTo: item.assigned_to || '',
      photo: null,
      photoFile: null,
      existingPhotoUrl: item.photo_url || null
    });
    setIsEditing(false);
  };

  // Only GCs can edit items
  const canEdit = profile.role === 'gc';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Previous Button */}
        {hasPrevious && !isEditing && (
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
            title="Previous item"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </button>
        )}

        {/* Next Button */}
        {hasNext && !isEditing && (
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
            title="Next item"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </button>
        )}

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
          <div className="flex-1">
            {!isEditing ? (
              <>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {getStatusIcon(item.status)}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium uppercase">
                    {item.trade}
                  </span>
                  <span className="text-xs text-gray-500">
                    {currentIndex + 1} of {totalItems}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {item.name || item.description}
                </h2>
              </>
            ) : (
              <h2 className="text-2xl font-bold text-gray-900">Edit Item</h2>
            )}
          </div>
          <div className="flex gap-2">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors flex items-center gap-1"
                title="Edit item"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={isEditing ? handleCancelEdit : onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              title={isEditing ? 'Cancel' : 'Close (Esc)'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isEditing ? (
            /* Edit Form */
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Fix broken outlet"
                  maxLength={100}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  disabled={updating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Add details about the issue..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  disabled={updating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Room 101, Hallway, etc."
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  disabled={updating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trade *
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editForm.trade}
                  onChange={(e) => handleTradeChange(e.target.value)}
                  disabled={updating}
                >
                  <option value="">Select trade...</option>
                  {trades && trades.length > 0 && trades.map(trade => (
                    <option key={trade} value={trade}>{trade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To (Optional)
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editForm.assignedTo}
                  onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                  disabled={updating}
                >
                  <option value="">Unassigned</option>
                  {projectTeam && projectTeam.length > 0 && projectTeam.map(member => (
                    <option key={member.id} value={member.email}>
                      {member.name ? `${member.name} (${member.email})` : member.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditForm({ 
                          ...editForm, 
                          photo: reader.result, 
                          photoFile: file 
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  disabled={updating}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  disabled={updating}
                >
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {editForm.photo || editForm.existingPhotoUrl ? 'Change Photo' : 'Upload Photo'}
                  </span>
                </button>
                {(editForm.photo || editForm.existingPhotoUrl) && (
                  <img
                    src={editForm.photo || editForm.existingPhotoUrl}
                    alt="Preview"
                    className="mt-3 w-full rounded-lg shadow-md"
                  />
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          ) : (
            /* View Mode */
            <>
              {/* Photo */}
              {item.photo_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo
                  </label>
                  <img
                    src={item.photo_url}
                    alt="Issue"
                    className="w-full rounded-lg shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => window.open(item.photo_url, '_blank')}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Click to view full size
                  </p>
                </div>
              )}

              {/* Description */}
              {item.description && item.name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <p className="text-gray-900">{item.location}</p>
              </div>

              {/* Assigned To */}
              {item.assigned_to && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-900">{item.assigned_to}</span>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Created
                  </label>
                  <p className="text-gray-900">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                {item.assigned_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned
                    </label>
                    <p className="text-gray-900">
                      {new Date(item.assigned_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {canUpdateStatus(item.status, profile.role) && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleStatusUpdate}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    {getStatusButtonLabel(item.status, profile.role)}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Only show navigation in view mode */}
        {!isEditing && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <button
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!hasNext}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}