import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { partnerPreferencesService } from '../../services/partnerPreferences.service';
import type { PartnerPreferenceAPI } from '../../types/partnerPreferences.types';
import {
  UserCheck,
  GraduationCap,
  Sparkles,
  Users,
  Heart,
  MapPin,
  BookOpen,
  RotateCcw,
  Loader2
} from 'lucide-react';

export const PreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { showToast, markPreferencesCompleted } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Partner Preferences Form State
  const [formData, setFormData] = useState({
    // Section 1: Basic & Physical
    minimum_age: 21,
    maximum_age: 32,
    minimum_height: 5.0,
    maximum_height: 6.2,
    marital_status: 'Never Married',
    physical_status: 'Normal',
    complexion: 'Open to All',
    body_type: 'Open to All',

    // Section 2: Education & Career
    education: 'B.Tech / M.Tech',
    education_detail: '',
    employment_type: 'Full Time',
    profession: 'Software Engineer',
    job_title: '',
    minimum_salary: 1000000,
    maximum_salary: 5000000,

    // Section 3: Religion & Horoscope
    religion: 'Hindu',
    caste: 'Open to All Castes',
    sub_caste: '',
    gothram: '',
    dosha: 'Doesn\'t Matter',
    has_horoscope: false,
    horoscope_preferences: 'No Major Dosha',

    // Section 4: Family Background
    family_type: 'Nuclear',
    family_status: 'Middle Class',
    family_values: 'Moderate',
    father_occupation: '',
    living_with_parents: 'Flexible',

    // Section 5: Lifestyle
    diet: 'Vegetarian',
    smoking: 'No',
    drinking: 'No',

    // Section 6: Location & Residence
    country: 'India',
    state: 'Andhra Pradesh',
    city: 'Hyderabad',
    citizenship: 'Indian',
    relocation_willingness: 'Flexible',

    // Section 7: Languages & Notes
    languages: 'Telugu',
    hobbies: 'Music & Singing',
    partner_notes: 'Looking for a compatible, understanding life partner with positive family values and mutual respect.'
  });

  // Load existing partner preferences from API or LocalStorage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        // Try local draft first
        const savedDraft = localStorage.getItem('partner_preferences_draft');
        if (savedDraft) {
          setFormData(prev => ({ ...prev, ...JSON.parse(savedDraft) }));
        }

        const apiData = await partnerPreferencesService.getPreferences();
        if (apiData) {
          setFormData(prev => {
            const diets = Array.isArray(apiData.preferred_diets) && apiData.preferred_diets.length > 0
              ? apiData.preferred_diets[0]
              : (apiData.diet || prev.diet);
            const smoking = Array.isArray(apiData.preferred_smoking) && apiData.preferred_smoking.length > 0
              ? apiData.preferred_smoking[0]
              : (apiData.smoking || prev.smoking);
            const drinking = Array.isArray(apiData.preferred_drinking) && apiData.preferred_drinking.length > 0
              ? apiData.preferred_drinking[0]
              : (apiData.drinking || prev.drinking);
            const marital = Array.isArray(apiData.preferred_marital_statuses) && apiData.preferred_marital_statuses.length > 0
              ? apiData.preferred_marital_statuses[0]
              : (apiData.marital_status || prev.marital_status);

            return {
              ...prev,
              minimum_age: apiData.minimum_age || prev.minimum_age,
              maximum_age: apiData.maximum_age || prev.maximum_age,
              minimum_height: apiData.minimum_height || prev.minimum_height,
              maximum_height: apiData.maximum_height || prev.maximum_height,
              religion: apiData.religion || prev.religion,
              caste: apiData.caste || prev.caste,
              education: apiData.education || prev.education,
              profession: apiData.profession || prev.profession,
              minimum_salary: apiData.minimum_salary || prev.minimum_salary,
              maximum_salary: apiData.maximum_salary || prev.maximum_salary,
              country: apiData.country || prev.country,
              state: apiData.state || prev.state,
              city: apiData.city || prev.city,
              diet: diets,
              smoking: smoking,
              drinking: drinking,
              marital_status: marital,
              horoscope_preferences: apiData.preferred_manglik ? `Manglik: ${apiData.preferred_manglik}` : (apiData.horoscope_preferences || prev.horoscope_preferences)
            };
          });
        }
      } catch (err) {
        console.warn('Could not load existing partner preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Track completed criteria count
  const trackedCriteria = [
    formData.minimum_age > 0,
    formData.maximum_age > 0,
    formData.minimum_height > 0,
    formData.maximum_height > 0,
    formData.marital_status,
    formData.physical_status,
    formData.complexion,
    formData.body_type,
    formData.education,
    formData.employment_type,
    formData.profession,
    formData.minimum_salary > 0,
    formData.religion,
    formData.caste,
    formData.dosha,
    formData.family_type,
    formData.family_status,
    formData.family_values,
    formData.diet,
    formData.smoking,
    formData.drinking,
    formData.country,
    formData.state,
    formData.city,
    formData.languages
  ];

  const completedCount = trackedCriteria.filter(Boolean).length;
  const completedPercentage = Math.round((completedCount / 25) * 100);



  const handleReset = () => {
    setFormData({
      minimum_age: 21,
      maximum_age: 32,
      minimum_height: 5.0,
      maximum_height: 6.2,
      marital_status: 'Never Married',
      physical_status: 'Normal',
      complexion: 'Open to All',
      body_type: 'Open to All',
      education: 'B.Tech / M.Tech',
      education_detail: '',
      employment_type: 'Full Time',
      profession: 'Software Engineer',
      job_title: '',
      minimum_salary: 1000000,
      maximum_salary: 5000000,
      religion: 'Hindu',
      caste: 'Open to All Castes',
      sub_caste: '',
      gothram: '',
      dosha: 'Doesn\'t Matter',
      has_horoscope: false,
      horoscope_preferences: 'No Major Dosha',
      family_type: 'Nuclear',
      family_status: 'Middle Class',
      family_values: 'Moderate',
      father_occupation: '',
      living_with_parents: 'Flexible',
      diet: 'Vegetarian',
      smoking: 'No',
      drinking: 'No',
      country: 'India',
      state: 'Andhra Pradesh',
      city: 'Hyderabad',
      citizenship: 'Indian',
      relocation_willingness: 'Flexible',
      languages: 'Telugu',
      hobbies: 'Music & Singing',
      partner_notes: 'Looking for a compatible, understanding life partner with positive family values and mutual respect.'
    });
    showToast('Preferences reset to default values.');
  };

  const handleSavePreferences = async () => {
    try {
      setIsSubmitting(true);

      const apiPayload: PartnerPreferenceAPI = {
        minimum_age: Number(formData.minimum_age) || 18,
        maximum_age: Number(formData.maximum_age) || 60,
        is_age_required: true,
        minimum_height: Number(formData.minimum_height) || 0,
        maximum_height: Number(formData.maximum_height) || 0,
        is_height_required: false,
        income_range_ids: [],
        minimum_salary: Number(formData.minimum_salary) || 0,
        maximum_salary: Number(formData.maximum_salary) || 0,
        is_income_required: false,
        education_ids: [],
        is_education_required: false,
        profession_ids: [],
        is_profession_required: false,
        religion_ids: [],
        is_religion_required: false,
        caste_ids: [],
        is_caste_required: false,
        preferred_diets: formData.diet ? [formData.diet] : [],
        preferred_smoking: formData.smoking ? [formData.smoking] : [],
        preferred_drinking: formData.drinking ? [formData.drinking] : [],
        language_ids: [],
        is_diet_required: false,
        is_lifestyle_required: false,
        preferred_marital_statuses: formData.marital_status ? [formData.marital_status] : [],
        is_marital_status_required: false,
        preferred_manglik: formData.dosha && formData.dosha.toLowerCase().includes('manglik') ? 'YES' : 'ANY',
        is_horoscope_required: false,
        country_ids: [],
        state_ids: [],
        district_ids: [],
        mandal_ids: [],
        village_ids: [],
        is_location_required: false,

        // Preserved display fields for UI convenience
        religion: formData.religion || 'Hindu',
        caste: formData.caste || 'Open to All Castes',
        education: formData.education || 'Graduate',
        profession: formData.profession || 'Professional',
        country: formData.country || 'India',
        state: formData.state || 'Andhra Pradesh',
        city: formData.city || 'Hyderabad',
        diet: formData.diet || 'Vegetarian',
        smoking: formData.smoking || 'No',
        drinking: formData.drinking || 'No',
        marital_status: formData.marital_status || 'Never Married',
        horoscope_preferences: formData.horoscope_preferences || 'No Major Dosha'
      };

      try {
        await partnerPreferencesService.createPreferences(apiPayload);
      } catch {
        try {
          await partnerPreferencesService.updatePreferences(apiPayload);
        } catch {
          // fallback to local storage
        }
      }

      localStorage.setItem('partner_preferences_draft', JSON.stringify(formData));
      markPreferencesCompleted();
      showToast('✓ Partner Preferences saved successfully! ✨');

      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate('/matches');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save partner preferences.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-black pb-16 font-sans antialiased">
      {/* Centered Middle Form Container (No Left & Right Sidebars) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <main className="space-y-6">
          
          {/* Header with Crisp Black Title */}
          <div className="pb-3 border-b border-slate-200">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
              Partner Preferences
            </h1>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              Set your partner expectations to find your perfect match.
            </p>
          </div>

            {/* CARD 1: Basic & Physical Criteria (Logo Pink Theme) */}
            <section id="section-basic" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserCheck className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black">Basic & Physical Criteria</h2>
                  <p className="text-[11px] font-semibold text-slate-600">Age, height, marital status and physical attributes</p>
                </div>
              </div>

              {/* Row 1: Age Min & Max */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Minimum Age <span className="text-rose-600 font-black">*</span>
                  </label>
                  <select
                    value={formData.minimum_age}
                    onChange={e => handleChange('minimum_age', Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                  >
                    {Array.from({ length: 43 }, (_, i) => i + 18).map(age => (
                      <option key={age} value={age}>{age} Years</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Maximum Age <span className="text-rose-600 font-black">*</span>
                  </label>
                  <select
                    value={formData.maximum_age}
                    onChange={e => handleChange('maximum_age', Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                  >
                    {Array.from({ length: 43 }, (_, i) => i + 18).map(age => (
                      <option key={age} value={age}>{age} Years</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Height Min & Max */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Minimum Height <span className="text-rose-600 font-black">*</span>
                  </label>
                  <select
                    value={formData.minimum_height}
                    onChange={e => handleChange('minimum_height', parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                  >
                    <option value="4.6">4' 6" (137 cm)</option>
                    <option value="4.8">4' 8" (142 cm)</option>
                    <option value="5.0">5' 0" (152 cm)</option>
                    <option value="5.2">5' 2" (157 cm)</option>
                    <option value="5.4">5' 4" (162 cm)</option>
                    <option value="5.6">5' 6" (167 cm)</option>
                    <option value="5.8">5' 8" (172 cm)</option>
                    <option value="6.0">6' 0" (182 cm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Maximum Height <span className="text-rose-600 font-black">*</span>
                  </label>
                  <select
                    value={formData.maximum_height}
                    onChange={e => handleChange('maximum_height', parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                  >
                    <option value="5.4">5' 4" (162 cm)</option>
                    <option value="5.6">5' 6" (167 cm)</option>
                    <option value="5.8">5' 8" (172 cm)</option>
                    <option value="6.0">6' 0" (182 cm)</option>
                    <option value="6.2">6' 2" (187 cm)</option>
                    <option value="6.4">6' 4" (193 cm)</option>
                    <option value="6.6">6' 6" (198 cm)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Marital Status, Physical Status, Complexion */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Marital Status <span className="text-rose-600 font-black">*</span>
                  </label>
                  <select
                    value={formData.marital_status}
                    onChange={e => handleChange('marital_status', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                  >
                    <option value="Never Married">Never Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Awaiting Divorce">Awaiting Divorce</option>
                    <option value="Open to All">Open to All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Physical Status
                  </label>
                  <select
                    value={formData.physical_status}
                    onChange={e => handleChange('physical_status', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Physically Challenged">Physically Challenged</option>
                    <option value="Doesn't Matter">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Complexion
                  </label>
                  <select
                    value={formData.complexion}
                    onChange={e => handleChange('complexion', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                  >
                    <option value="Open to All">Open to All</option>
                    <option value="Very Fair">Very Fair</option>
                    <option value="Fair">Fair</option>
                    <option value="Wheatish">Wheatish</option>
                  </select>
                </div>
              </div>
            </section>

            {/* CARD 2: Education & Career Preferences (Logo Pink Theme) */}
            <section id="section-education" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <GraduationCap className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black">Education & Career Preferences</h2>
                  <p className="text-[11px] font-semibold text-slate-600">Academic degree, profession and income expectations</p>
                </div>
              </div>

              {/* Row 1: Preferred Education, Details, Employment Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Preferred Education <span className="text-rose-600 font-black">*</span>
                  </label>
                  <select
                    value={formData.education}
                    onChange={e => handleChange('education', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="B.Tech / M.Tech">B.Tech / M.Tech</option>
                    <option value="MBA / PGDM">MBA / PGDM</option>
                    <option value="MBBS / MD">MBBS / MD / Medical</option>
                    <option value="CA / CS">CA / CS / Finance</option>
                    <option value="Any Graduate">Any Graduate Degree</option>
                    <option value="Any Post Graduate">Any Post Graduate Degree</option>
                    <option value="Open to All">Open to All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Education Detail
                  </label>
                  <input
                    type="text"
                    value={formData.education_detail}
                    onChange={e => handleChange('education_detail', e.target.value)}
                    placeholder="e.g. Any Engineering or MBA"
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Employment Type
                  </label>
                  <select
                    value={formData.employment_type}
                    onChange={e => handleChange('employment_type', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Self Employed">Self Employed / Business</option>
                    <option value="Government">Government / PSU</option>
                    <option value="Any">Doesn't Matter</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Occupation, Job Title, Minimum Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Preferred Occupation <span className="text-rose-600 font-black">*</span>
                  </label>
                  <select
                    value={formData.profession}
                    onChange={e => handleChange('profession', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Software Engineer">Software / IT Professional</option>
                    <option value="Doctor">Doctor / Healthcare</option>
                    <option value="Banking / Finance">Banking / Finance / CA</option>
                    <option value="Civil Services">Civil Services / Govt</option>
                    <option value="Business Owner">Business Owner / Entrepreneur</option>
                    <option value="Teacher / Academician">Teacher / Professor</option>
                    <option value="Open to All">Open to All Professions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={e => handleChange('job_title', e.target.value)}
                    placeholder="e.g. Software Engineer, Doctor"
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Minimum Annual Income
                  </label>
                  <select
                    value={formData.minimum_salary}
                    onChange={e => handleChange('minimum_salary', Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="0">Doesn't Matter</option>
                    <option value="500000">₹5 Lakhs and above</option>
                    <option value="1000000">₹10 Lakhs and above</option>
                    <option value="1500000">₹15 Lakhs and above</option>
                    <option value="2000000">₹20 Lakhs and above</option>
                    <option value="3000000">₹30 Lakhs and above</option>
                    <option value="5000000">₹50 Lakhs and above</option>
                  </select>
                </div>
              </div>
            </section>

            {/* CARD 3: Religion & Horoscope Preferences (Logo Pink Theme) */}
            <section id="section-religion" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black">Religion & Horoscope Preferences</h2>
                  <p className="text-[11px] font-semibold text-slate-600">Faith, community and astrological compatibility</p>
                </div>
              </div>

              {/* Row 1: Religion, Caste, Sub Caste */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Preferred Religion <span className="text-rose-600 font-black">*</span>
                  </label>
                  <select
                    value={formData.religion}
                    onChange={e => handleChange('religion', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="Hindu">Hindu</option>
                    <option value="Muslim">Muslim</option>
                    <option value="Christian">Christian</option>
                    <option value="Sikh">Sikh</option>
                    <option value="Jain">Jain</option>
                    <option value="Buddhist">Buddhist</option>
                    <option value="Open to All">Open to All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Preferred Caste <span className="text-rose-600 font-black">*</span>
                  </label>
                  <select
                    value={formData.caste}
                    onChange={e => handleChange('caste', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="Open to All Castes">Open to All Castes</option>
                    <option value="Brahmin">Brahmin</option>
                    <option value="Kshatriya">Kshatriya</option>
                    <option value="Vaishya">Vaishya</option>
                    <option value="Reddy">Reddy</option>
                    <option value="Kamma">Kamma</option>
                    <option value="Arya Vysya">Arya Vysya</option>
                    <option value="Maratha">Maratha</option>
                    <option value="Nair">Nair</option>
                    <option value="Agarwal">Agarwal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Sub Caste
                  </label>
                  <input
                    type="text"
                    value={formData.sub_caste}
                    onChange={e => handleChange('sub_caste', e.target.value)}
                    placeholder="Open to All or specific"
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Gothram, Manglik, Horoscope Matching */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Gothram Preference
                  </label>
                  <input
                    type="text"
                    value={formData.gothram}
                    onChange={e => handleChange('gothram', e.target.value)}
                    placeholder="Different Gothram / Any"
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Manglik / Dosha
                  </label>
                  <select
                    value={formData.dosha}
                    onChange={e => handleChange('dosha', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="Doesn't Matter">Doesn't Matter</option>
                    <option value="Non-Manglik">Non-Manglik</option>
                    <option value="Manglik">Manglik</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Horoscope Matching
                  </label>
                  <div className="flex items-center gap-3 h-10">
                    <button
                      type="button"
                      onClick={() => handleChange('has_horoscope', !formData.has_horoscope)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.has_horoscope ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          formData.has_horoscope ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-black">
                      {formData.has_horoscope ? 'Mandatory' : 'Not Mandatory'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* CARD 4: Family Background Preferences (Logo Pink Theme) */}
            <section id="section-family" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Users className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black">Family Background Preferences</h2>
                  <p className="text-[11px] font-semibold text-slate-600">Preferred family structure, status and values</p>
                </div>
              </div>

              {/* Row 1: Family Type, Family Status, Family Values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Preferred Family Type
                  </label>
                  <select
                    value={formData.family_type}
                    onChange={e => handleChange('family_type', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="Nuclear">Nuclear</option>
                    <option value="Joint">Joint</option>
                    <option value="Doesn't Matter">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Preferred Family Status
                  </label>
                  <select
                    value={formData.family_status}
                    onChange={e => handleChange('family_status', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="Middle Class">Middle Class</option>
                    <option value="Upper Middle Class">Upper Middle Class</option>
                    <option value="Rich">Rich / High Class</option>
                    <option value="Affluent">Affluent</option>
                    <option value="Any">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Preferred Family Values
                  </label>
                  <select
                    value={formData.family_values}
                    onChange={e => handleChange('family_values', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="Traditional">Traditional</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Liberal">Liberal</option>
                    <option value="Any">Doesn't Matter</option>
                  </select>
                </div>
              </div>
            </section>

            {/* CARD 5: Lifestyle & Habits Preferences (Logo Pink Theme) */}
            <section id="section-lifestyle" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Heart className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black">Lifestyle & Habits Preferences</h2>
                  <p className="text-[11px] font-semibold text-slate-600">Dietary habits and personal habits</p>
                </div>
              </div>

              {/* Row 1: Diet, Smoking, Drinking */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Diet Preference
                  </label>
                  <select
                    value={formData.diet}
                    onChange={e => handleChange('diet', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                  >
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Eggetarian">Eggetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Doesn't Matter">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Smoking Habit
                  </label>
                  <select
                    value={formData.smoking}
                    onChange={e => handleChange('smoking', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                  >
                    <option value="No">No</option>
                    <option value="Occasionally">Occasionally</option>
                    <option value="Doesn't Matter">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Drinking Habit
                  </label>
                  <select
                    value={formData.drinking}
                    onChange={e => handleChange('drinking', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                  >
                    <option value="No">No</option>
                    <option value="Occasionally">Occasionally</option>
                    <option value="Doesn't Matter">Doesn't Matter</option>
                  </select>
                </div>
              </div>
            </section>

            {/* CARD 6: Location & Residence Preferences (Logo Pink Theme) */}
            <section id="section-location" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MapPin className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black">Location & Residence Preferences</h2>
                  <p className="text-[11px] font-semibold text-slate-600">Preferred countries, states and cities</p>
                </div>
              </div>

              {/* Row 1: Country, State, City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Preferred Country <span className="text-rose-600 font-black">*</span>
                  </label>
                  <select
                    value={formData.country}
                    onChange={e => handleChange('country', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="UAE">United Arab Emirates</option>
                    <option value="Open to All">Open to All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Preferred State <span className="text-rose-600 font-black">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={e => handleChange('state', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                  >
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Open to All">Open to All States</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Preferred City <span className="text-rose-600 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => handleChange('city', e.target.value)}
                    placeholder="e.g. Hyderabad, Bengaluru, Mumbai"
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Citizenship & Relocation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Citizenship Preference
                  </label>
                  <input
                    type="text"
                    value={formData.citizenship}
                    onChange={e => handleChange('citizenship', e.target.value)}
                    placeholder="e.g. Indian, US Citizen, Any"
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Relocation Willingness
                  </label>
                  <select
                    value={formData.relocation_willingness}
                    onChange={e => handleChange('relocation_willingness', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                  >
                    <option value="Flexible">Flexible</option>
                    <option value="Willing to Relocate">Willing to Relocate</option>
                    <option value="Not Willing to Relocate">Not Willing to Relocate</option>
                  </select>
                </div>
              </div>
            </section>

            {/* CARD 7: Languages & Partner Notes (Logo Pink Theme) */}
            <section id="section-interests" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black">Languages & Partner Notes</h2>
                  <p className="text-[11px] font-semibold text-slate-600">Mother tongue, hobbies and partner expectations</p>
                </div>
              </div>

              {/* Row 1: Languages & Hobbies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Mother Tongue / Languages
                  </label>
                  <select
                    value={formData.languages}
                    onChange={e => handleChange('languages', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                  >
                    <option value="Telugu">Telugu</option>
                    <option value="Hindi">Hindi</option>
                    <option value="English">English</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Open to All">Open to All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Shared Hobbies & Interests
                  </label>
                  <select
                    value={formData.hobbies}
                    onChange={e => handleChange('hobbies', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                  >
                    <option value="Music & Singing">Music & Singing</option>
                    <option value="Traveling & Trekking">Traveling & Trekking</option>
                    <option value="Reading & Literature">Reading & Literature</option>
                    <option value="Cooking & Food">Cooking & Food</option>
                    <option value="Fitness & Yoga">Fitness & Yoga</option>
                    <option value="Doesn't Matter">Doesn't Matter</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Partner Expectations */}
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Partner Expectations & Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.partner_notes}
                  onChange={e => handleChange('partner_notes', e.target.value)}
                  placeholder="Describe any specific qualities or preferences you are looking for in your ideal partner..."
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-y"
                />
              </div>
            </section>

            {/* Bottom Form Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-black hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" /> Reset
                </button>
              </div>

              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={isSubmitting}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#C83259] to-[#E11D48] hover:from-[#A82547] hover:to-[#BE123C] text-white text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving Preferences...
                  </>
                ) : (
                  <>
                    Save Preferences <span className="font-extrabold text-sm">→</span>
                  </>
                )}
              </button>
            </div>

          </main>
      </div>
    </div>
  );
};
