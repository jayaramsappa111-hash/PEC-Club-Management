import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Calendar,
  Layers,
  Search,
  Plus,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const GalleryPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80');
  const [caption, setCaption] = useState('');
  const [clubId, setClubId] = useState('club-1');
  const [submitting, setSubmitting] = useState(false);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await api.gallery.list();
      setItems(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.gallery.upload({
        title,
        image_url: imageUrl,
        caption,
        club_id: clubId,
      });
      setShowModal(false);
      setTitle('');
      setCaption('');
      fetchGallery();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const canUpload = user?.roles.some(r =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN'].includes(r)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-xs font-semibold mb-2">
            <ImageIcon className="w-3.5 h-3.5" /> High-Resolution Showcase
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Campus Tech Club Gallery
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Visual archive of hackathon demos, hardware exhibitions, guest keynote presentations, and prize distributions.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setShowModal(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Showcase Media
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading gallery photos...</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
          No media uploaded to the campus gallery yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition shadow-md flex flex-col justify-between"
            >
              <div className="overflow-hidden h-52 relative">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-white border border-slate-700">
                  {item.club_name || 'Campus Chapter'}
                </div>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition">
                  {item.title}
                </h3>
                {item.caption && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.caption}
                  </p>
                )}
                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  <span className="font-mono text-indigo-400">Verified Photo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-1">Add Showcase Media</h3>
            <p className="text-xs text-slate-400 mb-4">Post high-res photo from recent hackathon or workshop</p>

            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Autonomous Rover Trials at Robotics Arena"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Hosting Club</label>
                <select
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="club-1">Google Developer Student Club</option>
                  <option value="club-2">ACM Student Chapter</option>
                  <option value="club-3">Robotics & Autonomous Systems</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Caption / Context</label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Brief description of the event milestone..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  {submitting ? 'Posting...' : 'Upload Media'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
