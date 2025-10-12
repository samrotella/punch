import React, { useState, useEffect, useRef } from 'react';
import { Camera, List, Plus, Check, Clock, AlertCircle } from 'lucide-react';

export default function PunchListApp() {
  const [items, setItems] = useState([]);
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [newItem, setNewItem] = useState({
    description: '',
    location: '',
    trade: '',
    photo: null,
    status: 'open',
    createdAt: null
  });
  const fileInputRef = useRef(null);

  // Load items from localStorage on mount (offline storage)
  useEffect(() => {
    const stored = localStorage.getItem('punchListItems');
    if (stored) {
      setItems(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage whenever items change (offline storage)
  useEffect(() => {
    localStorage.setItem('punchListItems', JSON.stringify(items));
  }, [items]);

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem({ ...newItem, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const createItem = () => {
    if (!newItem.description || !newItem.location || !newItem.trade) {
      alert('Please fill in description, location, and trade');
      return;
    }

    const item = {
      ...newItem,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };

    setItems([item, ...items]);
    setNewItem({
      description: '',
      location: '',
      trade: '',
      photo: null,
      status: 'open',
      createdAt: null
    });
    setView('list');
  };

  const toggleStatus = (id) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const statuses = ['open', 'in-progress', 'completed'];
        const currentIndex = statuses.indexOf(item.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'open': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'completed': return <Check className="w-5 h-5 text-green-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'bg-red-50 border-red-200';
      case 'in-progress': return 'bg-yellow-50 border-yellow-200';
      case 'completed': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gray-100 pb-20">
        <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
          <h1 className="text-xl font-bold">New Punch Item</h1>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Describe the issue..."
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
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
              value={newItem.location}
              onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trade *
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={newItem.trade}
              onChange={(e) => setNewItem({ ...newItem, trade: e.target.value })}
            >
              <option value="">Select trade...</option>
              <option value="General">General</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="HVAC">HVAC</option>
              <option value="Framing">Framing</option>
              <option value="Drywall">Drywall</option>
              <option value="Painting">Painting</option>
              <option value="Flooring">Flooring</option>
              <option value="Tile">Tile</option>
              <option value="Cabinets">Cabinets</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {newItem.photo ? 'Change Photo' : 'Take Photo'}
              </span>
            </button>
            {newItem.photo && (
              <img src={newItem.photo} alt="Preview" className="mt-3 w-full rounded-lg shadow-md" />
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={() => setView('list')}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={createItem}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Save Item
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <List className="w-6 h-6" />
          Punch List
        </h1>
        <div className="mt-2 text-sm opacity-90">
          {items.length} items ({items.filter(i => i.status === 'completed').length} completed)
        </div>
      </div>

      <div className="p-4">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No punch items yet</p>
            <p className="text-gray-400 text-sm">Tap the + button to add your first item</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div
                key={item.id}
                className={`${getStatusColor(item.status)} border-2 rounded-lg p-4 shadow-sm`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(item.status)}
                      <span className="text-xs font-medium text-gray-600 uppercase">
                        {item.trade}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{item.description}</h3>
                    <p className="text-sm text-gray-600">{item.location}</p>
                  </div>
                </div>

                {item.photo && (
                  <img src={item.photo} alt="Issue" className="w-full rounded-lg mt-3 shadow-sm" />
                )}

                <button
                  onClick={() => toggleStatus(item.id)}
                  className="w-full mt-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Mark as {item.status === 'open' ? 'In Progress' : item.status === 'in-progress' ? 'Completed' : 'Open'}
                </button>

                <div className="mt-2 text-xs text-gray-500">
                  Created {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setView('create')}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}