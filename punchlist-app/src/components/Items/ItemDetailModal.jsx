import React from 'react';
import { X, Mail } from 'lucide-react';
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
  onClose,
  onToggleStatus,
  onNavigate
}) {
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalItems - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onNavigate(filteredItems[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(filteredItems[currentIndex + 1]);
    }
  };

  const handleStatusUpdate = () => {
    onToggleStatus(item.id, item.status);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Previous Button */}
        {hasPrevious && (
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
        {hasNext && (
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
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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
        </div>

        {/* Footer */}
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
      </div>
    </div>
  );
}