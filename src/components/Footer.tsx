import React from 'react';
import { ShieldCheck, QrCode, FileText, Lock, Globe, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-navy-950 border-t border-navy-900 text-slate-300 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm">
            <div className="h-8 px-2 py-0.5 bg-white rounded-md border border-slate-200 flex items-center justify-center shadow-xs">
              <img
                src="/assets/institutions/pragati-engineering-college/logo.png"
                alt="Pragati University"
                className="h-6 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span className="font-display font-extrabold tracking-tight">Pragati University</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed max-w-md">
            Pragati University Student Club Management Platform. Centralized governance for accredited student clubs, technical societies, departmental chapters, hackathons, and certified achievements.
          </p>
          <div className="text-[11px] text-slate-400 space-y-0.5 font-normal">
            <div>Office of Student Life &amp; Club Management &bull; Pragati University Campus</div>
            <div>Institutional Governance &bull; Student Affairs &amp; Technical Chapters</div>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs tracking-wider uppercase mb-3 font-display">Verification &amp; Portals</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => onNavigate('verify')}
                className="hover:text-white transition flex items-center gap-1.5 text-slate-300"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-400" />
                Verify Membership Pass
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('verify')}
                className="hover:text-white transition flex items-center gap-1.5 text-slate-300"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Verify Certificate Record
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('roadmaps')}
                className="hover:text-white transition text-slate-300"
              >
                Academic Skill Roadmaps
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('certificates')}
                className="hover:text-white transition text-slate-300"
              >
                Certificates &amp; Credentials
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs tracking-wider uppercase mb-3 font-display">Institutional Links</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('clubs')} className="hover:text-white transition text-slate-300">
                Accredited Chapters Directory (35 Clubs)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('events')} className="hover:text-white transition text-slate-300">
                Scheduled Events &amp; Workshops
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('projects')} className="hover:text-white transition text-slate-300">
                Student Projects Repository
              </button>
            </li>
            <li>
              <a
                href="https://pragati.ac.in/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition text-slate-300 flex items-center gap-1"
              >
                Official University Website <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px]">
        <div>
          &copy; {new Date().getFullYear()} Pragati University. All Rights Reserved.
        </div>
        <div className="flex items-center gap-4 mt-3 sm:mt-0">
          <span>Student Club Management Platform</span>
          <span>&bull;</span>
          <span className="text-slate-300 font-record-code">v2.6.4</span>
        </div>
      </div>
    </footer>
  );
};
