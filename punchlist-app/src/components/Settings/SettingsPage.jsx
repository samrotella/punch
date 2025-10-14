import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Users, Building2, Mail, User } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function SettingsPage({ profile, onClose }) {
  const [company, setCompany] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  console.log('SettingsPage rendered with profile:', profile);

  useEffect(() => {
    if (profile.role === 'gc' && profile.company_id) {
      loadCompanyData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const loadCompanyData = async () => {
    try {
      console.log('Loading company data for company_id:', profile.company_id);
      
      // Load company info
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      console.log('Company data:', companyData);
      console.log('Company error:', companyError);

      if (companyError) {
        console.error('Company error:', companyError);
        // Don't throw - just set loading to false
        setLoading(false);
        return;
      }
      
      setCompany(companyData);

      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('full_name, email, created_at')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: true });

      console.log('Members data:', membersData);
      console.log('Members error:', membersError);

      if (membersError) {
        console.error('Members error:', membersError);
      }
      
      setTeamMembers(membersData || []);
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (company?.invite_code) {
      navigator.clipboard.writeText(company.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Your Profile</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900">{profile.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{profile.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Role</label>
                <p className="text-gray-900 capitalize">
                  {profile.role === 'gc' ? 'General Contractor' : 'Subcontractor'}
                </p>
              </div>
            </div>
          </div>

          {/* Company Section - Only for GCs */}
          {profile.role === 'gc' && !loading && company && (
            <>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Company</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company Name</label>
                    <p className="text-gray-900 font-medium">{company.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Invite Code</label>
                    <div className="flex items-center gap-3 mt-1">
                      <code className="flex-1 text-2xl font-bold text-blue-600 tracking-wider bg-white px-4 py-2 rounded border border-blue-200">
                        {company.invite_code}
                      </code>
                      <button
                        onClick={copyInviteCode}
                        className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <>
                            <Check className="w-5 h-5" />
                            <span className="text-sm font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            <span className="text-sm font-medium">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Share this code with your team members so they can join your company.
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Members Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Team Members ({teamMembers.length})
                  </h3>
                </div>
                {teamMembers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No team members yet. Share your invite code to get started!</p>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map((member, index) => (
                      <div
                        key={member.email}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {member.full_name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.full_name}</p>
                            <p className="text-sm text-gray-600">{member.email}</p>
                          </div>
                        </div>
                        {member.email === profile.email && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            You
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Subcontractor Info */}
          {profile.role === 'sub' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Account Type</h3>
              </div>
              <p className="text-gray-600 text-sm">
                You're registered as a subcontractor. You'll receive punch list items assigned to your email address.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}