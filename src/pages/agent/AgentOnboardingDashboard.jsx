import React, { useState, useEffect } from 'react';
import { updateAgentOnboardingStatus } from '../../utils/agents';
import { auth } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

const AgentOnboardingDashboard = () => {
  const [arrowHovered, setArrowHovered] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState([
    { id: 1, name: 'Account Setup', completed: true },
    { id: 2, name: 'Registration', completed: true },
    { id: 3, name: 'Documents', completed: true },
    { id: 4, name: 'Profile & Training', completed: false, active: true },
  ]);

  const checklist = [
    { id: 1, label: 'Account Created', status: 'completed' },
    { id: 2, label: 'Registration Complete', status: 'completed' },
    { id: 3, label: 'Documents Signed', status: 'completed' },
    { id: 4, label: 'Profile Setup Pending', status: 'in-progress' },
    { id: 5, label: 'Training Not Started', status: 'locked' },
  ];

  const progressPercentage = 60;
  const userProfile = {
    name: 'Sarah Johnson',
    title: 'Agent In-Onboarding',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBR5eJUZQ1qnuqCnvpQeYDBnrsHH2A_sheRKKd1EMUFicQ6GbGuDssQ530Tjm0ULbrP3RLpIJFENWWdAyhKTWVj1Ctt6BwYI0MG6L068axz-qFB0ILYd4fKyNe7hBrpSgMZTi817nm1Kb_G129kznUBPQPQ9FutA0MjcYl58vFJZ-eRePKnTZwd-jhQRsMWyimmnq7DQ88WiOZfn-XzzhxLX4r0rheCI9HkXc24oK8pKCg3y1eMGn-TgaPO2rf7N8ZsWPsFiMbUfehK',
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
      case 'in-progress':
        return (
          <svg className="w-4 h-4 text-blue-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'locked':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };
  const session = auth.get()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!session?.id || submitting) return
    setSubmitting(true)
    try {
      await updateAgentOnboardingStatus(session.id, 5)
      auth.update({ onboardingStatus: 5 })
      navigate('/agent/dashboard')
    } catch (error) {
      console.error('Error updating onboarding status:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-8 px-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Welcome Header */}
          <div className="text-center space-y-1 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome, {userProfile.name.split(' ')[0]} 👋
            </h2>
            <p className="text-sm text-gray-600">
              Complete your onboarding to get started.
            </p>
          </div>

          {/* Onboarding Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5 space-y-5 animate-slide-up">
            {/* Horizontal Stepper */}
            <nav className="relative">
              {/* Progress Line Background */}
              <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 -z-0 rounded-full"></div>

              {/* Active Progress Line with Animation */}
              <div
                className="absolute top-5 left-0 h-1 bg-gradient-to-r from-blue-600 to-blue-500 -z-0 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(stepsCompleted.filter(s => s.completed).length / stepsCompleted.length) * 100}%` }}
              ></div>

              {/* Steps */}
              <div className="relative z-10 flex justify-between">
                {stepsCompleted.map((step) => (
                  <div key={step.id} className="flex flex-col items-center gap-1">
                    {/* Step Circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 transform ${step.completed
                        ? 'bg-blue-600 text-white scale-100 shadow-lg'
                        : step.active
                          ? 'border-3 border-blue-600 bg-white text-blue-600'
                          : 'bg-gray-100 text-gray-400'
                        }`}
                    >
                      {step.completed ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : step.active ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      ) : (
                        step.id
                      )}
                    </div>

                    {/* Step Label */}
                    <span className={`text-[10px] font-semibold text-center leading-tight max-w-[50px] ${step.active ? 'text-blue-600' : step.completed ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>
            </nav>

            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">Overall Progress</span>
                <span className="text-xs font-bold text-blue-600">{progressPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full relative transition-all duration-700 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {/* Shimmer Effect */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"
                    style={{
                      animation: 'shimmer 2s infinite',
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Status Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3 items-start">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-gray-700 leading-relaxed">
                Your documents have been approved. Please complete your profile to continue.
              </p>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-900">Onboarding Checklist</h3>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 transform ${item.status === 'completed'
                      ? 'bg-blue-50 border-blue-200 hover:shadow-md'
                      : item.status === 'in-progress'
                        ? 'bg-amber-50 border-amber-200 hover:shadow-md'
                        : 'bg-gray-50 border-gray-200 opacity-75'
                      } hover:scale-[1.02] active:scale-[0.98]`}
                    style={{
                      animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className={`text-xs font-medium ${item.status === 'locked' ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                        {item.label}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${item.status === 'completed'
                      ? 'text-blue-600'
                      : item.status === 'in-progress'
                        ? 'text-amber-600'
                        : 'text-gray-400'
                      }`}>
                      {item.status === 'completed' && 'Completed'}
                      {item.status === 'in-progress' && 'In Progress'}
                      {item.status === 'locked' && 'Locked'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Section */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                onMouseEnter={() => setArrowHovered(true)}
                onMouseLeave={() => setArrowHovered(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-blue-300 disabled:to-blue-300 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] active:shadow-md text-sm"
              >
                {submitting ? 'Updating...' : 'Continue Onboarding'}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${arrowHovered ? 'translate-x-1' : ''
                    }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center">
            <p className="text-xs text-gray-500 italic">
              You will get access to leads and full portal once onboarding is complete.
            </p>
          </div>
        </div>
      </main>

      {/* Atmospheric Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 opacity-20 pointer-events-none"></div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
          background-size: 1000px 100%;
        }
      `}</style>
    </div>
  );
};

export default AgentOnboardingDashboard;
