import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Search as SearchIcon,
  Filter,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { useSearchStore } from '../../store/useSearchStore';
import { useIgnoredProfiles } from '../../hooks/useMatching';

export const SearchPage: React.FC = () => {
  const { profiles, showToast } = useApp();
  const searchFilter = useSearchStore((state) => state.searchFilter);
  const setSearchFilter = useSearchStore((state) => state.setSearchFilter);
  const resetSearchFilter = useSearchStore((state) => state.resetSearchFilter);
  const { data: ignoredList } = useIgnoredProfiles();
  const ignoredUserIds = ignoredList?.map(i => i.user_id) || [];

  const [activeTab, setActiveTab] = useState<'all' | 'saved' | 'recent'>('all');
  const [searchProfileId, setSearchProfileId] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

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
      
      {/* Top Search Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black">Search Matrimonial Profiles</h1>
          <p className="text-xs font-bold text-stone-700 mt-0.5">Showing {filteredProfiles.length} verified profiles matching your criteria</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsFilterExpanded(prev => !prev)}
            className="px-4 py-2 text-xs font-extrabold rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-black flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#8B1E3F]" />
            <span>{isFilterExpanded ? 'Hide Filters' : 'Show Filters'}</span>
            {isFilterExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 text-xs font-extrabold rounded-xl transition-colors ${
                activeTab === 'all' ? 'bg-white text-[#8B1E3F] shadow-2xs' : 'text-black hover:text-stone-900'
              }`}
            >
              All Matches ({profiles.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-1.5 text-xs font-extrabold rounded-xl transition-colors flex items-center gap-1 ${
                activeTab === 'saved' ? 'bg-white text-[#8B1E3F] shadow-2xs' : 'text-black hover:text-stone-900'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" /> Saved Searches
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Top Search Filter Card (Full Width - No Sidebar) */}
      {isFilterExpanded && (
        <Card className="p-6 space-y-5 bg-white border border-stone-300 shadow-md rounded-3xl animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h3 className="text-base font-extrabold text-black flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#8B1E3F]" /> Filter Search Criteria
            </h3>
            <button
              onClick={resetSearchFilter}
              className="text-xs font-extrabold text-[#8B1E3F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Keyword Search */}
            <div>
              <label className="text-xs font-extrabold text-black block mb-1">Keyword / Name</label>
              <div className="relative">
                <SearchIcon className="h-4 w-4 text-black absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Engineer, Doctor, Mumbai"
                  value={searchFilter.keyword}
                  onChange={e => setSearchFilter({ ...searchFilter, keyword: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-black placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>
            </div>

            {/* Profile ID Search */}
            <div>
              <label className="text-xs font-extrabold text-black block mb-1">Profile ID</label>
              <input
                type="text"
                placeholder="e.g. MAT-1001"
                value={searchProfileId}
                onChange={e => setSearchProfileId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-black placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
              />
            </div>

            {/* Gender Choice */}
            <div>
              <label className="text-xs font-extrabold text-black block mb-1">Gender</label>
              <select
                value={searchFilter.gender}
                onChange={e => setSearchFilter({ ...searchFilter, gender: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-xs font-extrabold text-black focus:ring-2 focus:ring-[#8B1E3F]"
              >
                <option value="Female">Bride (Female)</option>
                <option value="Male">Groom (Male)</option>
                <option value="All">All Genders</option>
              </select>
            </div>

            {/* Religion Filter */}
            <div>
              <label className="text-xs font-extrabold text-black block mb-1">Religion</label>
              <select
                value={searchFilter.religion}
                onChange={e => setSearchFilter({ ...searchFilter, religion: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-xs font-extrabold text-black focus:ring-2 focus:ring-[#8B1E3F]"
              >
                <option value="All">All Religions</option>
                <option value="Hindu">Hindu</option>
                <option value="Muslim">Muslim</option>
                <option value="Sikh">Sikh</option>
                <option value="Christian">Christian</option>
                <option value="Jain">Jain</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center pt-2 border-t border-stone-200">
            {/* Age Range Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-extrabold text-black mb-1">
                <span>Age Range</span>
                <span className="text-[#8B1E3F] font-extrabold">{searchFilter.ageMin} - {searchFilter.ageMax} yrs</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="18"
                  max="45"
                  value={searchFilter.ageMin}
                  onChange={e => setSearchFilter({ ...searchFilter, ageMin: parseInt(e.target.value) })}
                  className="w-full accent-[#8B1E3F] cursor-pointer"
                />
                <input
                  type="range"
                  min="22"
                  max="60"
                  value={searchFilter.ageMax}
                  onChange={e => setSearchFilter({ ...searchFilter, ageMax: parseInt(e.target.value) })}
                  className="w-full accent-[#8B1E3F] cursor-pointer"
                />
              </div>
            </div>

            {/* Verified Only Checkbox */}
            <div className="flex items-center gap-2 pt-4 md:pt-0">
              <input
                type="checkbox"
                id="verifiedOnly"
                checked={searchFilter.verifiedOnly}
                onChange={e => setSearchFilter({ ...searchFilter, verifiedOnly: e.target.checked })}
                className="h-4 w-4 rounded accent-[#8B1E3F] cursor-pointer"
              />
              <label htmlFor="verifiedOnly" className="text-xs font-extrabold text-black cursor-pointer">
                Show ID Verified Profiles Only
              </label>
            </div>

            {/* Save Search Button */}
            <div className="flex justify-end pt-2 md:pt-0">
              <Button
                variant="gold"
                size="sm"
                onClick={() => showToast('Search parameters saved to your account!')}
                className="w-full md:w-auto text-xs font-extrabold bg-amber-400 text-stone-950 hover:bg-amber-300"
              >
                <Bookmark className="h-3.5 w-3.5 mr-1" /> Save Search Criteria
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Full Width Results Grid (No Sidebar) */}
      <div className="space-y-6">
        {filteredProfiles.length === 0 ? (
          <Card className="p-12 text-center space-y-4 bg-white border border-stone-300 rounded-3xl">
            <Sparkles className="h-10 w-10 text-stone-400 mx-auto" />
            <h3 className="text-xl font-extrabold text-black">No Profiles Found</h3>
            <p className="text-xs text-stone-700 font-bold max-w-sm mx-auto">
              No matrimonial profiles match your specific filter criteria. Try resetting filters or adjusting age range.
            </p>
            <Button variant="primary" size="sm" onClick={resetSearchFilter} className="bg-[#8B1E3F] text-white font-bold">
              Reset Search Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfiles.map(profile => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
