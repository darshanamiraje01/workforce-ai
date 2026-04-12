import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FileText, Upload, Download, Trash2, File } from 'lucide-react';
import { documentAPI, employeeAPI } from '../utils/api';
import { Modal, Avatar, Badge, PageHeader, EmptyState } from '../components/common/index.jsx';
import toast from 'react-hot-toast';

const DOC_TYPE_COLOR = {
  id_proof: 'blue', offer_letter: 'green', contract: 'purple',
  certificate: 'yellow', payslip: 'brand', appraisal: 'orange', other: 'gray'
};

export default function DocumentsPage() {
  const { user } = useSelector(s => s.auth);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'id_proof', description: '', employeeId: '', isConfidential: false });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await documentAPI.getAll();
      setDocs(data.data);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    if (user?.role !== 'employee') {
      employeeAPI.getAll({ limit: 100 }).then(r => setEmployees(r.data.data)).catch(() => {});
    }
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Document name is required'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('type', form.type);
      fd.append('description', form.description);
      fd.append('isConfidential', form.isConfidential);
      if (form.employeeId) fd.append('employeeId', form.employeeId);
      if (file) fd.append('file', file);
      else fd.append('url', '#placeholder');
      await documentAPI.upload(fd);
      toast.success('Document uploaded successfully');
      setShowUpload(false);
      setForm({ name: '', type: 'id_proof', description: '', employeeId: '', isConfidential: false });
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    try { await documentAPI.delete(id); toast.success('Document deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-6 space-y-5 animate-in">
      <PageHeader
        title="Documents"
        subtitle="Employee files, certificates and records"
        actions={
          <button onClick={() => setShowUpload(true)} className="btn-primary">
            <Upload size={15} /> Upload Document
          </button>
        }
      />

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        {['all', 'id_proof', 'offer_letter', 'contract', 'certificate', 'payslip', 'appraisal'].map(t => (
          <span key={t} className="text-xs px-3 py-1.5 rounded-xl bg-surface-800 border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.12] cursor-pointer transition-all capitalize">
            {t === 'all' ? 'All Types' : t.replace('_', ' ')}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc, i) => (
            <motion.div
              key={doc._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card card-hover p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-brand-400" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.url && doc.url !== '#placeholder' && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg hover:bg-surface-700 text-slate-500 hover:text-slate-300 transition-all"
                    >
                      <Download size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="font-semibold text-slate-200 text-sm truncate">{doc.name}</div>
              {doc.description && <div className="text-xs text-slate-600 mt-0.5 truncate">{doc.description}</div>}

              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <Badge variant={DOC_TYPE_COLOR[doc.type] || 'gray'} size="xs">
                  {doc.type?.replace(/_/g, ' ')}
                </Badge>
                {doc.isConfidential && <Badge variant="red" size="xs">🔒 Confidential</Badge>}
                {doc.fileSize && <span className="text-[10px] text-slate-600">{formatSize(doc.fileSize)}</span>}
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                <Avatar name={doc.employee?.name} size="xs" />
                <span className="text-xs text-slate-500 truncate">{doc.employee?.name || 'Unknown'}</span>
                <span className="text-[10px] text-slate-700 ml-auto">
                  {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </motion.div>
          ))}
          {docs.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={File}
                title="No documents yet"
                subtitle="Upload employee files, certificates and important records"
                action={
                  <button onClick={() => setShowUpload(true)} className="btn-primary">
                    <Upload size={14} /> Upload First Document
                  </button>
                }
              />
            </div>
          )}
        </div>
      )}

      <Modal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="Upload Document"
        footer={
          <>
            <button onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleUpload} disabled={uploading} className="btn-primary">
              {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={14} />}
              Upload
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label mb-1.5 block">Document Name <span className="text-red-400">*</span></label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-base"
              placeholder="e.g. John's ID Proof"
              required
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Document Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="input-base form-select"
            >
              {['id_proof', 'offer_letter', 'contract', 'certificate', 'payslip', 'appraisal', 'other'].map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          {user?.role !== 'employee' && (
            <div>
              <label className="label mb-1.5 block">Employee</label>
              <select
                value={form.employeeId}
                onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                className="input-base form-select"
              >
                <option value="">Select employee (optional)</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name} — {e.department}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label mb-1.5 block">Description</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input-base"
              placeholder="Brief description (optional)"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">File</label>
            <input
              type="file"
              onChange={e => setFile(e.target.files[0])}
              className="input-base py-2 cursor-pointer text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-400 file:text-xs file:font-medium hover:file:bg-brand-500/30 file:cursor-pointer"
            />
            <div className="text-[10px] text-slate-600 mt-1">Max 10MB. PDF, DOC, PNG, JPG accepted.</div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isConfidential}
              onChange={e => setForm(f => ({ ...f, isConfidential: e.target.checked }))}
              className="w-4 h-4 rounded accent-brand-500"
            />
            <span className="text-sm text-slate-400">Mark as confidential</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
