import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Search as SearchIcon,
  Filter,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';

import { useIgnoredProfiles } from '../../hooks/useMatching';

export const SearchPage: React.FC = () => {
  const { profiles, searchFilter, setSearchFilter, resetSearchFilter, showToast } = useApp();
  const { data: ignoredList } = useIgnoredProfiles();
  const ignoredUserIds = ignoredList?.map(i => i.user_id) || [];

  const [activeTab, setActiveTab] = useState<'all' | 'saved' | 'recent'>('all');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [searchProfileId, setSearchProfileId] = useState('');

  // Filter implementation logic
  const filteredProfiles = profiles.filter(p => {
    const numericId = Number(p.id);
    if (ignoredUserIds.includes(numericId)) return false;
    if (searchFilter.gender && searchFilter.gender !== 'All' && p.gender !== searchFilter.gender) return false;
    if (p.age < searchFilter.ageMin || p.age > searchFilter.ageMax) return false;
    if (searchFilter.religion !== 'All' && p.religion !== searchFilter.religion) return false;
    if (searchFilter.caste !== 'All' && p.caste !== searchFilter.caste) return false;
    if (searchFilter.verifiedOnly && !p.verified) return false;
    if (searchFilter.keyword && !p.name.toLowerCase().includes(searchFilter.keyword.toLowerCase()) && !p.profession.toLowerCase().includes(searchFilter.keyword.toLowerCase()) && !p.location.city.toLowerCase().includes(searchFilter.keyword.toLowerCase())) return false;
    if (searchProfileId && !p.id.toLowerCase().includes(searchProfileId.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Search Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border/70 shadow-sm">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">Search Matrimonial Profiles</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Showing {filteredProfiles.length} verified profiles matching your criteria</p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-2xl border border-border/50">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
              activeTab === 'all' ? 'bg-white text-[#8B1E3F] shadow-2xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Matches ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 ${
              activeTab === 'saved' ? 'bg-white text-[#8B1E3F] shadow-2xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" /> Saved Searches
          </button>
        </div>
      </div>

      {/* Main Grid with Filter Sidebar & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <Card className="p-6 space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#8B1E3F]" /> Search Filters
              </h3>
              <button
                onClick={resetSearchFilter}
                className="text-xs font-semibold text-[#8B1E3F] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Keyword / Name</label>
              <div className="relative">
                <SearchIcon className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Engineer, Doctor, Mumbai"
                  value={searchFilter.keyword}
                  onChange={e => setSearchFilter({ ...searchFilter, keyword: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Profile ID Search */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Profile ID</label>
              <input
                type="text"
                placeholder="e.g. MAT-1001"
                value={searchProfileId}
                onChange={e => setSearchProfileId(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Gender</label>
              <select
                value={searchFilter.gender}
                onChange={e => setSearchFilter({ ...searchFilter, gender: e.target.value })}
                className="w-full bg-muted/30 border border-border rounded-xl p-2 text-xs font-semibold"
              >
                <option value="Female">Bride (Female)</option>
                <option value="Male">Groom (Male)</option>
                <option value="All">All Genders</option>
              </select>
            </div>

            {/* Age Range Slider Controls */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1">
                <span>Age Range</span>
                <span className="text-[#8B1E3F] font-bold">{searchFilter.ageMin} - {searchFilter.ageMax} yrs</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="18"
                  max="45"
                  value={searchFilter.ageMin}
                  onChange={e => setSearchFilter({ ...searchFilter, ageMin: parseInt(e.target.value) })}
                  className="w-full accent-[#8B1E3F]"
                />
                <input
                  type="range"
                  min="22"
                  max="60"
                  value={searchFilter.ageMax}
                  onChange={e => setSearchFilter({ ...searchFilter, ageMax: parseInt(e.target.value) })}
                  className="w-full accent-[#8B1E3F]"
                />
              </div>
            </div>

            {/* Religion */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Religion</label>
              <select
                value={searchFilter.religion}
                onChange={e => setSearchFilter({ ...searchFilter, religion: e.target.value })}
                className="w-full bg-muted/30 border border-border rounded-xl p-2 text-xs font-semibold"
              >
                <option value="All">All Religions</option>
                <option value="Hindu">Hindu</option>
                <option value="Muslim">Muslim</option>
                <option value="Sikh">Sikh</option>
                <option value="Christian">Christian</option>
                <option value="Jain">Jain</option>
              </select>
            </div>

            {/* Verified Only Checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="verifiedOnly"
                checked={searchFilter.verifiedOnly}
                onChange={e => setSearchFilter({ ...searchFilter, verifiedOnly: e.target.checked })}
                className="h-4 w-4 rounded accent-[#8B1E3F] cursor-pointer"
              />
              <label htmlFor="verifiedOnly" className="text-xs font-semibold text-foreground cursor-pointer">
                Show ID Verified Profiles Only
              </label>
            </div>

            <Button
              variant="gold"
              size="sm"
              onClick={() => showToast('Search parameters saved to your account!')}
              className="w-full text-xs font-bold mt-2"
            >
              <Bookmark className="h-3.5 w-3.5 mr-1" /> Save Search Criteria
            </Button>
          </Card>
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setIsMobileFilterOpen(true)}>
            <Filter className="h-4 w-4 mr-1 text-[#8B1E3F]" /> Open Filter Drawer
          </Button>
          <span className="text-xs text-muted-foreground">{filteredProfiles.length} Results</span>
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-8 space-y-6">
          {filteredProfiles.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <Sparkles className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <h3 className="font-serif text-xl font-bold">No Profiles Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No matrimonial profiles match your specific filter criteria. Try resetting filters or adjusting age range.
              </p>
              <Button variant="primary" size="sm" onClick={resetSearchFilter}>
                Reset Search Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Drawer Modal */}
      <Modal isOpen={isMobileFilterOpen} onClose={() => setIsMobileFilterOpen(false)} title="Search Filters">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Keyword</label>
            <input
              type="text"
              value={searchFilter.keyword}
              onChange={e => setSearchFilter({ ...searchFilter, keyword: e.target.value })}
              className="w-full bg-muted/30 border border-border rounded-xl p-2.5 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Religion</label>
            <select
              value={searchFilter.religion}
              onChange={e => setSearchFilter({ ...searchFilter, religion: e.target.value })}
              className="w-full bg-muted/30 border border-border rounded-xl p-2.5 text-xs font-semibold"
            >
              <option value="All">All Religions</option>
              <option value="Hindu">Hindu</option>
              <option value="Muslim">Muslim</option>
              <option value="Sikh">Sikh</option>
              <option value="Christian">Christian</option>
              <option value="Jain">Jain</option>
            </select>
          </div>
          <Button variant="primary" size="lg" onClick={() => setIsMobileFilterOpen(false)} className="w-full font-bold">
            Apply Search Filters
          </Button>
        </div>
      </Modal>

    </div>
  );
};
