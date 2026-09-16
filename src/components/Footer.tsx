import React from 'react';
import { ShieldCheck, QrCode, FileText, Lock, Globe } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm">
            <div className="h-7 px-2 py-0.5 bg-white rounded-md border border-slate-700 flex items-center justify-center">
              <img
                src="/assets/institutions/pragati-engineering-college/logo.png"
                alt="Pragati Engineering College (PEC)"
                className="h-5 w-auto object-contain"
              />
            </div>
            <span>Pragati Engineering College (Autonomous)</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-md">
            Approved by AICTE, Permanently Affiliated to JNTUK, Accredited by NAAC with &lsquo;A&rsquo; Grade and NBA.
            Official portal for student clubs, technical societies, departmental chapters, hackathons, and certified achievements.
          </p>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div>ADB Road, Surampalem, Near Peddapuram, Kakinada District, A.P. &ndash; 533437</div>
            <div>Institutional Governance &bull; Student Affairs &amp; Technical Chapters</div>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Verification &amp; Portals</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => onNavigate('verify-membership')}
                className="hover:text-blue-400 transition flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-400" />
                Verify Membership Pass
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('verify-certificate')}
                className="hover:text-blue-400 transition flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Verify Certificate Record
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('roadmaps')}
                className="hover:text-blue-400 transition"
              >
                Academic Roadmaps
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('student-portal')}
                className="hover:text-blue-400 transition"
              >
                Student Hub &amp; Passes
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Institutional Links</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('clubs')} className="hover:text-blue-400 transition">
                Accredited Clubs Directory
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('events')} className="hover:text-blue-400 transition">
                Scheduled Events &amp; Workshops
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('projects')} className="hover:text-blue-400 transition">
                Student Projects Repository
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('announcements')} className="hover:text-blue-400 transition">
                Official Notices &amp; Circulars
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
        <div>
          &copy; {new Date().getFullYear()} Pragati Engineering College (Autonomous). All Rights Reserved.
        </div>
        <div className="mt-2 sm:mt-0">
          Faculty-Supervised Student Activities Management System
        </div>
      </div>
    </footer>
  );
};
