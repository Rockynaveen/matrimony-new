import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  Upload,
  ShieldCheck,
  UserCheck,
  MapPin,
  Briefcase,
  Camera,
  Sliders,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const RegisterWizard: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    gender: 'Female',
    lookingFor: 'Male',
    name: 'Pooja Sharma',
    dob: '1998-06-15',
    email: 'pooja.sharma@example.com',
    phone: '9876543210',
    religion: 'Hindu',
    caste: 'Brahmin',
    motherTongue: 'Hindi',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    education: 'M.Tech Computer Science',
    profession: 'Senior Software Engineer',
    income: '₹20 - 25 Lakhs',
    about: 'Warm-hearted software professional looking for a soulmate with similar family values and intellectual curiosity.',
    photoUrl: '/images/profiles/profile_2.jpg',
    prefAgeMin: 24,
    prefAgeMax: 32,
    prefReligion: 'Hindu',
    prefCaste: 'Brahmin'
  });

  const steps = [
    { num: 1, title: 'Basic Profile', desc: 'Gender & Contact' },
    { num: 2, title: 'Background', desc: 'Religion & Location' },
    { num: 3, title: 'Career', desc: 'Education & Income' },
    { num: 4, title: 'Photo & Bio', desc: 'Avatar & About' },
    { num: 5, title: 'Preferences', desc: 'Partner Expectations' }
  ];

  const progressPercentage = (currentStep / 5) * 100;

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      showToast('Account created successfully! Verification OTP sent to mobile.');
      navigate('/verify-otp');
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#FFF9F5] via-[#FDF5F0] to-[#FFF9F5] relative overflow-hidden">
      
      {/* Decorative Radial Backgrounds */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-[#8B1E3F]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl space-y-6 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#C44569] text-white shadow-md">
              <Heart className="h-5 w-5 fill-white stroke-none" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Vivah<span className="text-[#D4AF37] font-sans text-xs uppercase tracking-widest ml-1 font-semibold">Match</span>
            </span>
          </Link>
          <h2 className="font-serif text-3xl font-bold text-foreground">Create Free Matrimony Profile</h2>
          <p className="text-xs text-muted-foreground">Join thousands of verified candidates looking for meaningful relationships.</p>
        </div>

        {/* Stepper Progress Card */}
        <Card className="p-6 bg-white shadow-md border-border/80 rounded-3xl space-y-4">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#8B1E3F] uppercase tracking-wider">Step {currentStep} of 5 — {steps[currentStep - 1].title}</span>
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {progressPercentage}% Complete
            </span>
          </div>

          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8B1E3F] via-[#C44569] to-[#D4AF37] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Stepper Icons */}
          <div className="grid grid-cols-5 gap-2 pt-1 text-center">
            {steps.map(s => (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`flex flex-col items-center gap-1 group focus:outline-none ${
                  s.num === currentStep ? 'text-[#8B1E3F]' : s.num < currentStep ? 'text-emerald-600' : 'text-muted-foreground/60'
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s.num === currentStep
                      ? 'bg-[#8B1E3F] text-white shadow-md ring-4 ring-[#8B1E3F]/20'
                      : s.num < currentStep
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.num < currentStep ? <Check className="h-4 w-4 stroke-[3]" /> : s.num}
                </div>
                <span className="text-[10px] font-bold hidden sm:block truncate w-full">{s.title}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Wizard Card Body */}
        <Card className="p-8 shadow-2xl bg-white border-border/80 rounded-3xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* STEP 1: BASIC INFO */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="border-b border-border/60 pb-3">
                    <h3 className="font-serif text-xl font-bold text-[#8B1E3F] flex items-center gap-2">
                      <UserCheck className="h-5 w-5" /> Candidate Basic Details
                    </h3>
                    <p className="text-xs text-muted-foreground">Select candidate gender and basic contact information.</p>
                  </div>

                  {/* Gender Select Cards */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-2">Candidate Gender</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: 'Female', lookingFor: 'Male' })}
                        className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                          formData.gender === 'Female'
                            ? 'border-[#8B1E3F] bg-[#8B1E3F]/10 text-[#8B1E3F] font-bold shadow-sm'
                            : 'border-border text-muted-foreground bg-muted/20 hover:bg-muted/40'
                        }`}
                      >
                        <Heart className="h-6 w-6" />
                        <span className="text-xs font-bold">Female (Bride)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: 'Male', lookingFor: 'Female' })}
                        className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                          formData.gender === 'Male'
                            ? 'border-[#8B1E3F] bg-[#8B1E3F]/10 text-[#8B1E3F] font-bold shadow-sm'
                            : 'border-border text-muted-foreground bg-muted/20 hover:bg-muted/40'
                        }`}
                      >
                        <UserCheck className="h-6 w-6" />
                        <span className="text-xs font-bold">Male (Groom)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Candidate Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Pooja Sharma"
                      className="w-full bg-muted/20 border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Date of Birth</label>
                      <input
                        type="date"
                        required
                        value={formData.dob}
                        onChange={e => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full bg-muted/20 border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Mobile Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-muted/20 border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-muted/20 border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: RELIGION & LOCATION */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="border-b border-border/60 pb-3">
                    <h3 className="font-serif text-1xl font-bold text-[#8B1E3F] flex items-center gap-2">
                      <MapPin className="h-5 w-5" /> Religion, Caste & Location
                    </h3>
                    <p className="text-xs text-muted-foreground">Community roots and current city location.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Religion</label>
                      <select
                        value={formData.religion}
                        onChange={e => setFormData({ ...formData, religion: e.target.value })}
                        className="w-full bg-muted/20 border border-border rounded-xl p-2.5 text-xs font-bold"
                      >
                        <option value="Hindu">Hindu</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Sikh">Sikh</option>
                        <option value="Christian">Christian</option>
                        <option value="Jain">Jain</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Caste / Community</label>
                      <input
                        type="text"
                        value={formData.caste}
                        onChange={e => setFormData({ ...formData, caste: e.target.value })}
                        className="w-full bg-muted/20 border border-border rounded-xl p-2.5 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Mother Tongue</label>
                      <select
                        value={formData.motherTongue}
                        onChange={e => setFormData({ ...formData, motherTongue: e.target.value })}
                        className="w-full bg-muted/20 border border-border rounded-xl p-2.5 text-xs font-bold"
                      >
                        <option value="Hindi">Hindi</option>
                        <option value="Marathi">Marathi</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Telugu">Telugu</option>
                        <option value="Bengali">Bengali</option>
                        <option value="Gujarati">Gujarati</option>
                        <option value="Punjabi">Punjabi</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Current City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-muted/20 border border-border rounded-xl p-2.5 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: CAREER & INCOME */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="border-b border-border/60 pb-3">
                    <h3 className="font-serif text-xl font-bold text-[#8B1E3F] flex items-center gap-2">
                      <Briefcase className="h-5 w-5" /> Education, Career & Income
                    </h3>
                    <p className="text-xs text-muted-foreground">Academic qualifications and professional achievements.</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Highest Qualification</label>
                    <input
                      type="text"
                      value={formData.education}
                      onChange={e => setFormData({ ...formData, education: e.target.value })}
                      placeholder="e.g. M.Tech Computer Science / MBA"
                      className="w-full bg-muted/20 border border-border rounded-xl p-2.5 text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Profession / Occupation</label>
                      <input
                        type="text"
                        value={formData.profession}
                        onChange={e => setFormData({ ...formData, profession: e.target.value })}
                        className="w-full bg-muted/20 border border-border rounded-xl p-2.5 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Annual Income Package</label>
                      <select
                        value={formData.income}
                        onChange={e => setFormData({ ...formData, income: e.target.value })}
                        className="w-full bg-muted/20 border border-border rounded-xl p-2.5 text-xs font-bold"
                      >
                        <option value="₹10 - 15 Lakhs">₹10 - 15 Lakhs</option>
                        <option value="₹15 - 20 Lakhs">₹15 - 20 Lakhs</option>
                        <option value="₹20 - 25 Lakhs">₹20 - 25 Lakhs</option>
                        <option value="₹25 - 35 Lakhs">₹25 - 35 Lakhs</option>
                        <option value="Above ₹50 Lakhs">Above ₹50 Lakhs</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PHOTO & BIO */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="border-b border-border/60 pb-3">
                    <h3 className="font-serif text-xl font-bold text-[#8B1E3F] flex items-center gap-2">
                      <Camera className="h-5 w-5" /> Profile Photo & Biography
                    </h3>
                    <p className="text-xs text-muted-foreground">Upload a clear avatar photo and write a short self bio.</p>
                  </div>

                  <div className="flex items-center gap-5 p-5 border-2 border-dashed border-[#8B1E3F]/30 rounded-2xl bg-[#8B1E3F]/5">
                    <img
                      src={formData.photoUrl}
                      alt="Preview"
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-[#8B1E3F]/30 shrink-0 shadow-md"
                    />
                    <div className="space-y-1.5">
                      <h5 className="font-bold text-xs text-foreground">Upload Primary Avatar Photo</h5>
                      <p className="text-[11px] text-muted-foreground">Profiles with clear photos receive 300% more response.</p>
                      <Button size="sm" variant="primary" className="text-xs h-8">
                        <Upload className="h-3.5 w-3.5 mr-1" /> Select Photo File
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">About Myself (Bio)</label>
                    <textarea
                      rows={3}
                      value={formData.about}
                      onChange={e => setFormData({ ...formData, about: e.target.value })}
                      className="w-full bg-muted/20 border border-border rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: PREFERENCES */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <div className="border-b border-border/60 pb-3">
                    <h3 className="font-serif text-xl font-bold text-[#8B1E3F] flex items-center gap-2">
                      <Sliders className="h-5 w-5" /> Partner Match Expectations
                    </h3>
                    <p className="text-xs text-muted-foreground">Define your automated partner preference parameters.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Min Age</label>
                      <input
                        type="number"
                        value={formData.prefAgeMin}
                        onChange={e => setFormData({ ...formData, prefAgeMin: parseInt(e.target.value) })}
                        className="w-full bg-muted/20 border border-border rounded-xl p-2.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Max Age</label>
                      <input
                        type="number"
                        value={formData.prefAgeMax}
                        onChange={e => setFormData({ ...formData, prefAgeMax: parseInt(e.target.value) })}
                        className="w-full bg-muted/20 border border-border rounded-xl p-2.5 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Your preferences can be updated anytime from your User Dashboard later.</span>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-border/60 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="text-xs font-bold"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous Step
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              className="text-xs font-bold px-8 shadow-md"
            >
              {currentStep === 5 ? 'Complete Free Profile' : 'Next Step'} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

        </Card>

      </div>
    </div>
  );
};
