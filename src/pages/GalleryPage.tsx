import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Calendar,
  Layers,
  Search,
  Plus,
  ExternalLink,
  Building2,
  X
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-900" /> Academic &amp; Technical Photographic Archives &bull; PEC
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Institutional Technical Gallery
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            Visual archive of hackathon demos, hardware exhibitions, guest keynote presentations, and national prize distributions.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setShowModal(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Upload Showcase Media
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading gallery photos...</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          No media uploaded to the campus gallery yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="h-48 overflow-hidden relative bg-slate-100">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-blue-900/90 text-white text-[10px] font-bold">
                    {item.club_name || 'PEC Technical Chapter'}
                  </div>
                </div>

                <div className="p-4 space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 font-normal leading-relaxed">{item.caption}</p>
                </div>
              </div>

              <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                <span className="font-mono text-slate-400">PEC Media Archive</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Archive Showcase Photograph</h3>
            <p className="text-xs text-slate-500 mb-4">Official visual record of club workshops, awards, or lab projects</p>

            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Event / Photo Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Annual Autonomous Drone Demonstration"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Caption / Summary *</label>
                <textarea
                  rows={3}
                  required
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Describe participants, awards, venue, and significance..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  {submitting ? 'Uploading...' : 'Save to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
