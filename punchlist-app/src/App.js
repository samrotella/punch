import React, { useState, useEffect, useRef } from 'react';
import { Camera, List, Plus, Check, Clock, AlertCircle, UserPlus, Filter, Mail, LogOut, FolderPlus, Folder, Users, X, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function PunchListApp() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectTeam, setProjectTeam] = useState([]);
  const [items, setItems] = useState([]);
  const [view, setView] = useState('list');
  const [authView, setAuthView] = useState('login');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterTrade, setFilterTrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAssignEmail, setBulkAssignEmail] = useState('');
  const [newTeamMember, setNewTeamMember] = useState({ email: '', trade: '', name: '' });
  
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'gc',
    companyName: ''
  });

  const [newProject, setNewProject] = useState({
    name: ''
  });

  const [newItem, setNewItem] = useState({
    description: '',
    location: '',
    trade: '',
    photo: null,
    photoFile: null,
    status: 'open',
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

  const signUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: authForm.email,
            full_name: authForm.fullName,
            role: authForm.role,
            company_name: authForm.companyName
          }
        ]);

      if (profileError) throw profileError;

      alert('Account created! Please check your email to verify your account.');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password,
      });

      if (error) throw error;

      setUser(data.user);
      await loadProfile(data.user.id);
    } catch (error) {
      alert(error.message);
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

  const createProject = async (e) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: newProject.name,
            owner_id: user.id
          }
        ])
        .select();

      if (error) throw error;

      setProjects([data[0], ...projects]);
      setNewProject({ name: '' });
      setView('list');
    } catch (error) {
      alert(error.message);
    }
  };

  const addTeamMember = async (e) => {
    e.preventDefault();

    if (!newTeamMember.email || !newTeamMember.trade) {
      alert('Please fill in email and trade');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('project_team')
        .insert([
          {
            project_id: currentProject.id,
            email: newTeamMember.email,
            trade: newTeamMember.trade,
            name: newTeamMember.name
          }
        ])
        .select();

      if (error) throw error;

      setProjectTeam([...projectTeam, data[0]]);
      setNewTeamMember({ email: '', trade: '', name: '' });
    } catch (error) {
      alert(error.message);
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
      alert(error.message);
    }
  };

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

    if (!currentProject) {
      alert('Please select a project first');
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
            photo_url: photoUrl,
            project_id: currentProject.id,
            created_by: user.id,
            assigned_to: newItem.assignedTo || null,
            assigned_at: newItem.assignedTo ? new Date().toISOString() : null
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
        status: 'open',
        assignedTo: ''
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

  const getStatusBadge = (status) => {
    const badges = {
      'open': 'bg-red-100 text-red-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getTeamMembersForTrade = (trade) => {
    return projectTeam.filter(member => member.trade === trade);
  };

  // Apply filters and search
  let filteredItems = items;
  
  if (filterTrade !== 'all') {
    filteredItems = filteredItems.filter(item => item.trade === filterTrade);
  }
  
  if (filterStatus !== 'all') {
    filteredItems = filteredItems.filter(item => item.status === filterStatus);
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      item.description.toLowerCase().includes(query) ||
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">
            {authView === 'login' ? 'Log In' : 'Sign Up'}
          </h1>

          <form onSubmit={authView === 'login' ? signIn : signUp} className="space-y-4">
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
      <div className="min-h-screen bg-gray-100">
        <div className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">My Projects</h1>
            <p className="text-sm opacity-90">{profile.company_name || profile.full_name}</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
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
                  onClick={() => setCurrentProject(project)}
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
          onClick={() => setView('create-project')}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <FolderPlus className="w-8 h-8" />
        </button>
      </div>
    );
  }

  // Create project view
  if (view === 'create-project') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-blue-600 text-white p-4 shadow-md">
          <h1 className="text-xl font-bold">New Project</h1>
        </div>

        <form onSubmit={createProject} className="p-4 space-y-4 max-w-2xl mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Main Street Office Building"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={newProject.name}
              onChange={(e) => setNewProject({ name: e.target.value })}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setView('list');
                setNewProject({ name: '' });
              }}
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

  // Create item view
  if (view === 'create') {
    return (
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

          {newItem.trade && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To (Optional)
              </label>
              {(() => {
                const teamMembers = getTeamMembersForTrade(newItem.trade);
                
                if (teamMembers.length === 0) {
                  return (
                    <input
                      type="email"
                      placeholder="Enter email address"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newItem.assignedTo}
                      onChange={(e) => setNewItem({ ...newItem, assignedTo: e.target.value })}
                      disabled={uploading}
                    />
                  );
                }
                
                return (
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newItem.assignedTo}
                    onChange={(e) => setNewItem({ ...newItem, assignedTo: e.target.value })}
                    disabled={uploading}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.email}>
                        {member.name ? `${member.name} (${member.email})` : member.email}
                      </option>
                    ))}
                  </select>
                );
              })()}
            </div>
          )}

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
              type="button"
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

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 max-w-2xl mx-auto">
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

  // Main list view - MOBILE
  const MobileView = () => (
    <div className="block lg:hidden">
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <List className="w-6 h-6" />
              {profile.role === 'gc' ? currentProject?.name : 'My Assigned Items'}
            </h1>
            <div className="mt-2 text-sm opacity-90">
              {filteredItems.length} items ({filteredItems.filter(i => i.status === 'completed').length} completed)
            </div>
          </div>
          <div className="flex gap-2">
            {profile.role === 'gc' && currentProject && (
              <>
                <button
                  onClick={() => setShowTeamModal(true)}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                  title="Manage team"
                >
                  <Users className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentProject(null)}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                  title="Back to projects"
                >
                  <Folder className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={signOut}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
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
              {filterTrade === 'all' 
                ? (profile.role === 'gc' ? 'Tap the + button to add your first item' : 'No items assigned to you yet')
                : 'Try a different filter'}
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
                    {profile.role === 'sub' && item.projects && (
                      <p className="text-xs text-gray-500 mt-1">Project: {item.projects.name}</p>
                    )}
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
                    className="w-32 h-32 object-cover rounded-lg mt-3 shadow-sm cursor-pointer hover:opacity-90 transition-opacity" 
                    onClick={() => window.open(item.photo_url, '_blank')}
                    title="Click to view full size"
                  />
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => toggleStatus(item.id, item.status)}
                    className="flex-1 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Mark as {item.status === 'open' ? 'In Progress' : item.status === 'in-progress' ? 'Completed' : 'Open'}
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

      {profile.role === 'gc' && currentProject && (
        <button
          onClick={() => setView('create')}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}
    </div>
  );

  // Main list view - DESKTOP
  const DesktopView = () => (
    <div className="hidden lg:block min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {profile.role === 'gc' ? currentProject?.name : 'My Assigned Items'}
            </h1>
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
              onClick={signOut}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex gap-4 items-center">
          <div className="flex-1 relative">
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
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterTrade}
            onChange={(e) => setFilterTrade(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Trades</option>
            {trades.map(trade => (
              <option key={trade} value={trade}>{trade}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{filteredItems.length}</span> items
              {' • '}
              <span className="text-red-600">{filteredItems.filter(i => i.status === 'open').length} open</span>
              {' • '}
              <span className="text-yellow-600">{filteredItems.filter(i => i.status === 'in-progress').length} in progress</span>
              {' • '}
              <span className="text-green-600">{filteredItems.filter(i => i.status === 'completed').length} completed</span>
            </div>
            {selectedItems.length > 0 && (
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Bulk Actions ({selectedItems.length})
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex gap-4 items-center">
            <span className="text-sm font-medium text-gray-700">{selectedItems.length} selected</span>
            <select
              value={bulkAssignEmail}
              onChange={(e) => setBulkAssignEmail(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              onClick={() => bulkUpdateStatus('in-progress')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Mark In Progress
            </button>
            <button
              onClick={() => bulkUpdateStatus('completed')}
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

        {/* Table */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No items found</p>
            <p className="text-gray-400 text-sm">
              {profile.role === 'gc' ? 'Create your first punch item to get started' : 'No items assigned to you yet'}
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
                        checked={selectedItems.length === filteredItems.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                  )}
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('trade')}
                  >
                    <div className="flex items-center gap-1">
                      Trade
                      {sortField === 'trade' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center gap-1">
                      Location
                      {sortField === 'location' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Photo
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      {sortField === 'created_at' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
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
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                        {item.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.trade}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      {item.description}
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
                      <button
                        onClick={() => toggleStatus(item.id, item.status)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Update
                      </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Project Team</h2>
              <button
                onClick={() => setShowTeamModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={addTeamMember} className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
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
                      onClick={() => removeTeamMember(member.id)}
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
      )}
    </div>
  );
}