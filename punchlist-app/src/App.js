import React, { useState, useEffect, useRef } from 'react';
import { Camera, List, Plus, Check, Clock, AlertCircle, UserPlus, Filter, Mail } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function PunchListApp() {
  const [items, setItems] = useState([]);
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [assignEmail, setAssignEmail] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [filterTrade, setFilterTrade] = useState('all');
  const [newItem, setNewItem] = useState({
    description: '',
    location: '',
    trade: '',
    photo: null,
    photoFile: null,
    status: 'open'
  });
  const fileInputRef = useRef(null);

  const trades = ['General', 'Electrical', 'Plumbing', 'HVAC', 'Framing', 'Drywall', 'Painting', 'Flooring', 'Tile', 'Cabinets'];

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('punch_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      const stored = localStorage.getItem('punchListItems');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('punchListItems', JSON.stringify(items));
  }, [items]);

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem({ 
          ...newItem, 
          photo: reader.result,
          photoFile: file 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('punch-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('punch-photos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const createItem = async () => {
    if (!newItem.description || !newItem.location || !newItem.trade) {
      alert('Please fill in description, location, and trade');
      return;
    }

    setUploading(true);

    try {
      let photoUrl = null;

      if (newItem.photoFile) {
        photoUrl = await uploadPhoto(newItem.photoFile);
      }

      const { data, error } = await supabase
        .from('punch_items')
        .insert([
          {
            description: newItem.description,
            location: newItem.location,
            trade: newItem.trade,
            status: 'open',
            photo_url: photoUrl
          }
        ])
        .select();

      if (error) throw error;

      setItems([data[0], ...items]);

      setNewItem({
        description: '',
        location: '',
        trade: '',
        photo: null,
        photoFile: null,
        status: 'open'
      });
      setView('list');
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const statuses = ['open', 'in-progress', 'completed'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    try {
      const { error } = await supabase
        .from('punch_items')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === id ? { ...item, status: nextStatus } : item
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const assignItem = async () => {
    if (!assignEmail || !assignEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setAssigning(true);

    try {
      const item = items.find(i => i.id === assignModal);
      
      const { error } = await supabase
        .from('punch_items')
        .update({ 
          assigned_to: assignEmail,
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', assignModal);

      if (error) throw error;

      // Send email notification (simple mailto for MVP)
      const subject = encodeURIComponent(`Punch List Item Assigned: ${item.trade}`);
      const body = encodeURIComponent(
        `You have been assigned a punch list item:\n\n` +
        `Trade: ${item.trade}\n` +
        `Location: ${item.location}\n` +
        `Description: ${item.description}\n\n` +
        `Please complete this item and update the status in the punch list app.`
      );
      
      // This will open the user's email client
      window.location.href = `mailto:${assignEmail}?subject=${subject}&body=${body}`;

      setItems(items.map(i => 
        i.id === assignModal ? { ...i, assigned_to: assignEmail, assigned_at: new Date().toISOString() } : i
      ));

      setAssignModal(null);
      setAssignEmail('');
    } catch (error) {
      console.error('Error assigning item:', error);
      alert('Failed to assign item. Please try again.');
    } finally {
      setAssigning(false);
    }
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

  const filteredItems = filterTrade === 'all' 
    ? items 
    : items.filter(item => item.trade === filterTrade);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading punch list...</p>
        </div>
      </div>
    );
  }

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
              disabled={uploading}
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
              disabled={uploading}
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
              disabled={uploading}
            >
              <option value="">Select trade...</option>
              {trades.map(trade => (
                <option key={trade} value={trade}>{trade}</option>
              ))}
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
              disabled={uploading}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
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
            disabled={uploading}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={createItem}
            disabled={uploading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Item'
            )}
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
          {filteredItems.length} items ({filteredItems.filter(i => i.status === 'completed').length} completed)
        </div>
        
        <div className="mt-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 flex-shrink-0" />
            <button
              onClick={() => setFilterTrade('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                filterTrade === 'all' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
              }`}
            >
              All
            </button>
            {trades.map(trade => (
              <button
                key={trade}
                onClick={() => setFilterTrade(trade)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  filterTrade === trade ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
                }`}
              >
                {trade}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {filterTrade === 'all' ? 'No punch items yet' : `No ${filterTrade} items`}
            </p>
            <p className="text-gray-400 text-sm">
              {filterTrade === 'all' ? 'Tap the + button to add your first item' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(item => (
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

                {item.assigned_to && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-white rounded border border-gray-200">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Assigned to: {item.assigned_to}</span>
                  </div>
                )}

                {item.photo_url && (
                  <img src={item.photo_url} alt="Issue" className="w-full rounded-lg mt-3 shadow-sm" />
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => toggleStatus(item.id, item.status)}
                    className="flex-1 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Mark as {item.status === 'open' ? 'In Progress' : item.status === 'in-progress' ? 'Completed' : 'Open'}
                  </button>
                  <button
                    onClick={() => setAssignModal(item.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {item.assigned_to ? 'Reassign' : 'Assign'}
                  </button>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Created {new Date(item.created_at).toLocaleDateString()}
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

      {assignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Assign Item</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter the email address of the subcontractor responsible for this item.
            </p>
            <input
              type="email"
              placeholder="contractor@example.com"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={assigning}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAssignModal(null);
                  setAssignEmail('');
                }}
                disabled={assigning}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={assignItem}
                disabled={assigning}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}