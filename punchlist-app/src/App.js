import React, { useState, useEffect, useRef } from 'react';
import { Camera, List, Plus, Check, Clock, AlertCircle, UserPlus, Filter, Mail, LogOut, FolderPlus, Folder, Users, X, Search, ChevronUp, ChevronDown, Eye, Settings, Download } from 'lucide-react';
import { supabase } from './supabaseClient';
import { 
  STATUSES, 
  getStatusIcon, 
  getStatusColor, 
  getStatusBadge, 
  getStatusLabel,
  getNextStatus,
  getStatusButtonLabel,
  canUpdateStatus
} from './utils/statusHelpers';
import { exportToPDF } from './utils/pdfExport';
import AuthScreen from './components/Auth/AuthScreen';
import { ProjectList, ProjectForm } from './components/Projects/ProjectViews';
import TeamModal from './components/Team/TeamModal';
import SettingsPage from './components/Settings/SettingsPage';
import ItemDetailModal from './components/Items/ItemDetailModal';

export default function PunchListApp() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectTeam, setProjectTeam] = useState([]);
  const [items, setItems] = useState([]);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterTrade, setFilterTrade] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAssignEmail, setBulkAssignEmail] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [showTradeFilter, setShowTradeFilter] = useState(false);

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    location: '',
    trade: '',
    photo: null,
    photoFile: null,
    status: STATUSES.OPEN,
    assignedTo: ''
  });

  const fileInputRef = useRef(null);
  const trades = ['General', 'Electrical', 'Plumbing', 'HVAC', 'Framing', 'Drywall', 'Painting', 'Flooring', 'Tile', 'Cabinets'];

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'gc') {
        loadProjects();
      } else {
        loadAssignedItems();
      }
    }
  }, [user, profile]);

  useEffect(() => {
    if (currentProject) {
      loadItems();
      loadProjectTeam();
    }
  }, [currentProject]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTradeFilter && !event.target.closest('.trade-filter-container')) {
        setShowTradeFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTradeFilter]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      await loadProfile(session.user.id);
    }
    setLoading(false);
  };

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setProjects(data);
    }
  };

  const loadProjectTeam = async () => {
    if (!currentProject) return;

    const { data, error } = await supabase
      .from('project_team')
      .select('*')
      .eq('project_id', currentProject.id);

    if (data) {
      setProjectTeam(data);
    }
  };

  const loadItems = async () => {
    if (!currentProject) return;

    const { data, error } = await supabase
      .from('punch_items')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('created_at', { ascending: false });

    if (data) {
      setItems(data);
    }
  };

  const loadAssignedItems = async () => {
    const { data, error } = await supabase
      .from('punch_items')
      .select('*, projects(name)')
      .eq('assigned_to', user.email)
      .order('created_at', { ascending: false });

    if (data) {
      setItems(data);
    }
  };

  const signUp = async (formData) => {
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      let companyId = null;

      if (formData.role === 'gc') {
        if (formData.inviteCode) {
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('id')
            .eq('invite_code', formData.inviteCode)
            .single();

          if (companyError || !company) {
            throw new Error('Invalid invite code. Please check the code and try again.');
          }

          companyId = company.id;
        } else {
          const newInviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
          
          const { data: newCompany, error: companyError} = await supabase
            .from('companies')
            .insert([
              {
                name: formData.companyName,
                invite_code: newInviteCode
              }
            ])
            .select()
            .single();

          if (companyError) throw companyError;

          companyId = newCompany.id;
        }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: formData.role,
            company_id: companyId,
            company_name: formData.role === 'sub' ? formData.companyName : null,
          }
        ]);

      if (profileError) throw profileError;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      setUser(data.user);
      await loadProfile(data.user.id);
    } catch (error) {
      alert(error.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      setUser(data.user);
      await loadProfile(data.user.id);
    } catch (error) {
      alert(error.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setProjects([]);
    setCurrentProject(null);
    setItems([]);
  };

  const createProject = async (projectData) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            ...projectData,
            created_by: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setCurrentProject(data);
      setView('list');
    } catch (error) {
      alert('Failed to create project');
    }
  };

  const createItem = async () => {
    if (!newItem.name || !newItem.location || !newItem.trade) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);

      let photoUrl = null;

      if (newItem.photoFile) {
        const fileName = `${currentProject.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('punch_photos')
          .upload(fileName, newItem.photoFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('punch_photos')
          .getPublicUrl(fileName);

        photoUrl = data.publicUrl;
      }

      const { data, error } = await supabase
        .from('punch_items')
        .insert([
          {
            project_id: currentProject.id,
            name: newItem.name,
            description: newItem.description,
            location: newItem.location,
            trade: newItem.trade,
            status: STATUSES.OPEN,
            photo_url: photoUrl,
            created_by: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setItems([data, ...items]);
      setNewItem({
        name: '',
        description: '',
        location: '',
        trade: '',
        photo: null,
        photoFile: null,
        status: STATUSES.OPEN,
        assignedTo: ''
      });
      setView('list');
    } catch (error) {
      alert('Failed to create item: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleStatus = async (itemId, currentStatus) => {
    try {
      const nextStatus = getNextStatus(currentStatus, profile.role);
      const { error } = await supabase
        .from('punch_items')
        .update({ 
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === itemId ? { ...item, status: nextStatus } : item
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const bulkUpdateStatus = async (status) => {
    try {
      const { error } = await supabase
        .from('punch_items')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', selectedItems);

      if (error) throw error;

      setItems(items.map(item => 
        selectedItems.includes(item.id) ? { ...item, status } : item
      ));
      setSelectedItems([]);
      setShowBulkActions(false);
    } catch (error) {
      alert('Failed to update items. Please try again.');
    }
  };

  const bulkAssign = async () => {
    if (!bulkAssignEmail) {
      alert('Please select someone to assign to');
      return;
    }

    try {
      const { error } = await supabase
        .from('punch_items')
        .update({ 
          assigned_to: bulkAssignEmail,
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', selectedItems);

      if (error) throw error;

      setItems(items.map(item => 
        selectedItems.includes(item.id) 
          ? { ...item, assigned_to: bulkAssignEmail, assigned_at: new Date().toISOString() }
          : item
      ));
      setSelectedItems([]);
      setBulkAssignEmail('');
      setShowBulkActions(false);
    } catch (error) {
      alert('Failed to assign items. Please try again.');
    }
  };

  const addTeamMember = async (member) => {
    try {
      const { data, error } = await supabase
        .from('project_team')
        .insert([
          {
            project_id: currentProject.id,
            name: member.name,
            email: member.email,
            trade: member.trade
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setProjectTeam([...projectTeam, data]);
    } catch (error) {
      alert('Failed to add team member');
    }
  };

  const removeTeamMember = async (memberId) => {
    try {
      const { error } = await supabase
        .from('project_team')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setProjectTeam(projectTeam.filter(m => m.id !== memberId));
    } catch (error) {
      alert('Failed to remove team member');
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleTradeFilter = (trade) => {
    if (filterTrade.includes(trade)) {
      setFilterTrade(filterTrade.filter(t => t !== trade));
    } else {
      setFilterTrade([...filterTrade, trade]);
    }
  };

  const clearTradeFilter = () => {
    setFilterTrade([]);
  };

  // Apply filters and search
  let filteredItems = items || [];

  if (filterTrade.length > 0) {
    filteredItems = filteredItems.filter(item => filterTrade.includes(item.trade));
  }
  
  if (filterStatus !== 'all') {
    filteredItems = filteredItems.filter(item => item.status === filterStatus);
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      item.location.toLowerCase().includes(query) ||
      item.trade.toLowerCase().includes(query) ||
      (item.assigned_to && item.assigned_to.toLowerCase().includes(query))
    );
  }

  // Apply sorting
  filteredItems = [...filteredItems].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'created_at' || sortField === 'updated_at') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Auth screens
  if (!user || !profile) {
    return (
      <AuthScreen 
        onSignIn={signIn}
        onSignUp={signUp}
        loading={loading}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // GC view - Project selection
  if (profile.role === 'gc' && !currentProject && view === 'list') {
    return (
      <ProjectList 
        projects={projects}
        profile={profile}
        onSelectProject={setCurrentProject}
        onCreateNew={() => setView('create-project')}
        onSignOut={signOut}
        onSettings={() => setShowSettings(true)}
      />
    );
  }

  // Create project view
  if (view === 'create-project') {
    return (
      <ProjectForm 
        onSubmit={createProject}
        onCancel={() => setView('list')}
      />
    );
  }

  // Mobile View
  const MobileView = () => (
    <div className="md:hidden">
      {view === 'create' ? (
        <div className="min-h-screen bg-gray-100 pb-20">
          <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
            <h1 className="text-xl font-bold">New Punch Item</h1>
            {currentProject && (
              <p className="text-sm opacity-90 mt-1">{currentProject.name}</p>
            )}
          </div>

          <div className="p-4 max-w-2xl mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Fix broken outlet"
                maxLength={100}
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                disabled={uploading}
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
                Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setNewItem({ ...newItem, photo: reader.result, photoFile: file });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                disabled={uploading}
              >
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {newItem.photo ? 'Change Photo' : 'Take Photo'}
                </span>
              </button>
              {newItem.photo && (
                <img 
                  src={newItem.photo} 
                  alt="Preview" 
                  className="mt-3 w-full rounded-lg shadow-md"
                />
              )}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3">
            <button
              onClick={() => setView('list')}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={createItem}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-100 pb-20">
          <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <List className="w-6 h-6" />
              {currentProject?.name || 'My Assigned Items'}
            </h1>
            <p className="text-sm opacity-90 mt-1">
              {profile.company_name || profile.full_name}
            </p>
          </div>

          <div className="p-4">
            <div className="flex gap-2 mb-4">
              {profile.role === 'gc' && currentProject && (
                <button
                  onClick={() => setView('create')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Item
                </button>
              )}
              <button
                onClick={() => setCurrentProject(null)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Folder className="w-5 h-5" />
                Back
              </button>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No punch items yet</p>
                <p className="text-gray-400 text-sm">
                  {profile.role === 'gc' ? 'Tap the + button to add your first item' : 'No items assigned to you yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className={`${getStatusColor(item.status)} border-2 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => setSelectedItemDetail(item)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(item.status)}
                          <span className="text-xs font-medium text-gray-600 uppercase">
                            {item.trade}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {item.name || item.description}
                        </h3>
                        {item.description && item.name && (
                          <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                        )}
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
                      <img 
                        src={item.photo_url} 
                        alt="Issue" 
                        className="w-32 h-32 object-cover rounded-lg mt-3 shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.photo_url, '_blank');
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Desktop View
  const DesktopView = () => (
    <div className="hidden md:block">
      <div className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold">{currentProject?.name || 'My Assigned Items'}</h1>
          <p className="text-sm opacity-90 mt-1">
            {profile.company_name || profile.full_name}
          </p>
        </div>
        <div className="flex gap-3">
          {profile.role === 'gc' && currentProject && (
            <>
              <button
                onClick={() => setView('create')}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Item
              </button>
              <button
                onClick={() => setShowTeamModal(true)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Team
              </button>
              <button
                onClick={() => setCurrentProject(null)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <Folder className="w-5 h-5" />
                Projects
              </button>
            </>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex gap-4 items-center flex-wrap">
          <div className="flex-1 relative min-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value={STATUSES.OPEN}>Open</option>
            <option value={STATUSES.IN_PROGRESS}>In Progress</option>
            <option value={STATUSES.READY_FOR_REVIEW}>Ready for Review</option>
            <option value={STATUSES.COMPLETED}>Completed</option>
          </select>
          <div className="relative trade-filter-container">
            <button
              onClick={() => setShowTradeFilter(!showTradeFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors min-w-[150px] text-left flex items-center justify-between"
            >
              <span className="text-gray-700">
                {filterTrade.length === 0 ? 'All Trades' : `${filterTrade.length} Trade${filterTrade.length > 1 ? 's' : ''}`}
              </span>
              <Filter className="w-4 h-4 text-gray-500" />
            </button>
            {showTradeFilter && (
              <div className="absolute top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-[200px]">
                <div className="p-2 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Select Trades</span>
                  {filterTrade.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearTradeFilter();
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {trades.map(trade => (
                    <label
                      key={trade}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filterTrade.includes(trade)}
                        onChange={() => toggleTradeFilter(trade)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{trade}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {showBulkActions && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex gap-2 items-center flex-wrap">
            <select
              value={bulkAssignEmail}
              onChange={(e) => setBulkAssignEmail(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Assign to...</option>
              {projectTeam.map(member => (
                <option key={member.id} value={member.email}>
                  {member.name ? `${member.name} (${member.email})` : member.email}
                </option>
              ))}
            </select>
            <button
              onClick={bulkAssign}
              disabled={!bulkAssignEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Assign
            </button>
            <div className="border-l border-gray-300 h-8"></div>
            <button
              onClick={() => bulkUpdateStatus(STATUSES.IN_PROGRESS)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Mark In Progress
            </button>
            <button
              onClick={() => bulkUpdateStatus(STATUSES.READY_FOR_REVIEW)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mark Ready for Review
            </button>
            <button
              onClick={() => bulkUpdateStatus(STATUSES.COMPLETED)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Mark Completed
            </button>
            <button
              onClick={() => {
                setSelectedItems([]);
                setShowBulkActions(false);
              }}
              className="ml-auto px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No items found</p>
            <p className="text-gray-400 text-sm">
              {profile.role === 'gc' ? 'Click "New Item" to add your first punch list item' : 'No items assigned to you yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {profile.role === 'gc' && (
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Icon</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trade</th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Item
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Assigned To</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Photo</th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      {sortField === 'created_at' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {profile.role === 'gc' && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id));
                            }
                            if (selectedItems.length > 0 || e.target.checked) {
                              setShowBulkActions(true);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {getStatusIcon(item.status)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.trade}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      <div 
                        className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => setSelectedItemDetail(item)}
                      >
                        {item.name || item.description}
                      </div>
                      {item.description && item.name && (
                        <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.location}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.assigned_to || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {item.photo_url && (
                        <img 
                          src={item.photo_url} 
                          alt="Issue" 
                          className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80"
                          onClick={() => window.open(item.photo_url, '_blank')}
                          title="Click to view full size"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {canUpdateStatus(item.status, profile.role) ? (
                        <button
                          onClick={() => toggleStatus(item.id, item.status)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {getStatusButtonLabel(item.status, profile.role)}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          {getStatusButtonLabel(item.status, profile.role)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <MobileView />
      <DesktopView />

      {/* Team Management Modal */}
      {showTeamModal && (
        <TeamModal 
          projectTeam={projectTeam}
          trades={trades}
          onClose={() => setShowTeamModal(false)}
          onAddMember={addTeamMember}
          onRemoveMember={removeTeamMember}
        />
      )}

      {/* Settings Page */}
      {showSettings && (
        <SettingsPage 
          profile={profile}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Item Detail Modal - REFACTORED COMPONENT */}
      {selectedItemDetail && (
        <ItemDetailModal
          item={selectedItemDetail}
          currentIndex={filteredItems.findIndex(item => item.id === selectedItemDetail.id)}
          totalItems={filteredItems.length}
          filteredItems={filteredItems}
          profile={profile}
          onClose={() => setSelectedItemDetail(null)}
          onToggleStatus={toggleStatus}
          onNavigate={setSelectedItemDetail}
        />
      )}
    </div>
  );
}