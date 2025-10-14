import { AlertCircle, Clock, Check, Eye } from 'lucide-react';

export const STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  READY_FOR_REVIEW: 'ready-for-review',
  COMPLETED: 'completed'
};

export const getStatusIcon = (status) => {
  switch(status) {
    case STATUSES.OPEN: 
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case STATUSES.IN_PROGRESS: 
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case STATUSES.READY_FOR_REVIEW: 
      return <Eye className="w-5 h-5 text-blue-500" />;
    case STATUSES.COMPLETED: 
      return <Check className="w-5 h-5 text-green-500" />;
    default: 
      return null;
  }
};

export const getStatusColor = (status) => {
  switch(status) {
    case STATUSES.OPEN: 
      return 'bg-red-50 border-red-200';
    case STATUSES.IN_PROGRESS: 
      return 'bg-yellow-50 border-yellow-200';
    case STATUSES.READY_FOR_REVIEW: 
      return 'bg-blue-50 border-blue-200';
    case STATUSES.COMPLETED: 
      return 'bg-green-50 border-green-200';
    default: 
      return 'bg-gray-50 border-gray-200';
  }
};

export const getStatusBadge = (status) => {
  const badges = {
    [STATUSES.OPEN]: 'bg-red-100 text-red-800',
    [STATUSES.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
    [STATUSES.READY_FOR_REVIEW]: 'bg-blue-100 text-blue-800',
    [STATUSES.COMPLETED]: 'bg-green-100 text-green-800'
  };
  return badges[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status) => {
  const labels = {
    [STATUSES.OPEN]: 'Open',
    [STATUSES.IN_PROGRESS]: 'In Progress',
    [STATUSES.READY_FOR_REVIEW]: 'Ready for Review',
    [STATUSES.COMPLETED]: 'Completed'
  };
  return labels[status] || status;
};

// Get next available status for a user
export const getNextStatus = (currentStatus, userRole) => {
  if (userRole === 'gc') {
    // GCs can move to any status
    const statusFlow = {
      [STATUSES.OPEN]: STATUSES.IN_PROGRESS,
      [STATUSES.IN_PROGRESS]: STATUSES.READY_FOR_REVIEW,
      [STATUSES.READY_FOR_REVIEW]: STATUSES.COMPLETED,
      [STATUSES.COMPLETED]: STATUSES.OPEN
    };
    return statusFlow[currentStatus] || STATUSES.OPEN;
  } else {
    // Subs have limited transitions
    const statusFlow = {
      [STATUSES.OPEN]: STATUSES.IN_PROGRESS,
      [STATUSES.IN_PROGRESS]: STATUSES.READY_FOR_REVIEW,
      [STATUSES.READY_FOR_REVIEW]: STATUSES.READY_FOR_REVIEW, // Can't move forward
      [STATUSES.COMPLETED]: STATUSES.COMPLETED // Can't change
    };
    return statusFlow[currentStatus] || currentStatus;
  }
};

// Get button label for status transition
export const getStatusButtonLabel = (currentStatus, userRole) => {
  const nextStatus = getNextStatus(currentStatus, userRole);
  
  if (userRole === 'sub' && 
      (currentStatus === STATUSES.READY_FOR_REVIEW || currentStatus === STATUSES.COMPLETED)) {
    return 'Awaiting GC Review';
  }
  
  return `Mark as ${getStatusLabel(nextStatus)}`;
};

// Check if user can update this status
export const canUpdateStatus = (currentStatus, userRole) => {
  if (userRole === 'gc') return true;
  
  // Subs can't update if it's ready for review or completed
  return currentStatus !== STATUSES.READY_FOR_REVIEW && 
         currentStatus !== STATUSES.COMPLETED;
};