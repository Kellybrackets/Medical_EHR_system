import React from 'react';
import { Heart, Activity, Stethoscope, FileText, Users, Shield } from 'lucide-react';

export const MedicalIllustration: React.FC = () => {
  return (
    <div className="relative h-full min-h-[400px] bg-gradient-to-br from-blue-600 via-teal-500 to-green-500 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-8">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 animate-pulse">
          <Heart className="h-16 w-16 text-white" />
        </div>
        <div className="absolute top-1/4 right-20 animate-pulse delay-100">
          <Activity className="h-12 w-12 text-white" />
        </div>
        <div className="absolute bottom-1/4 left-20 animate-pulse delay-200">
          <Stethoscope className="h-20 w-20 text-white" />
        </div>
        <div className="absolute bottom-20 right-16 animate-pulse delay-300">
          <FileText className="h-14 w-14 text-white" />
        </div>
        <div className="absolute top-1/2 left-1/3 animate-pulse delay-150">
          <Users className="h-16 w-16 text-white" />
        </div>
        <div className="absolute top-1/3 right-1/3 animate-pulse delay-250">
          <Shield className="h-12 w-12 text-white" />
        </div>
      </div>

      {/* Main illustration content */}
      <div className="relative z-10 text-center text-white">
        <div className="mb-6 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-8 shadow-2xl">
            <Stethoscope className="h-24 w-24 text-white" />
          </div>
        </div>

        <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
          Welcome to MedCare
        </h2>

        <p className="text-xl text-white/90 mb-8 max-w-md mx-auto drop-shadow">
          Modern Electronic Health Records System for Healthcare Professionals
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <Heart className="h-8 w-8 text-white mx-auto mb-2" />
            <p className="text-sm font-medium">Patient Care</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <Activity className="h-8 w-8 text-white mx-auto mb-2" />
            <p className="text-sm font-medium">Real-time Data</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <FileText className="h-8 w-8 text-white mx-auto mb-2" />
            <p className="text-sm font-medium">Digital Records</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <Shield className="h-8 w-8 text-white mx-auto mb-2" />
            <p className="text-sm font-medium">Secure</p>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};
