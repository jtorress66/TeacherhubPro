import { useRef, useEffect } from "react";
import { FileText, Download } from "lucide-react";

const AssignmentFiles = ({ attachments, apiUrl }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !attachments || attachments.length === 0) return;
    
    const listEl = containerRef.current.querySelector('.file-list-container');
    if (!listEl) return;
    listEl.innerHTML = '';

    attachments.forEach((file, idx) => {
      const fileUrl = `${apiUrl}${file.file_url}`;
      const isPdf = file.filename?.toLowerCase().endsWith('.pdf') || file.content_type === 'application/pdf';

      const wrapper = document.createElement('div');
      wrapper.className = 'mb-3';
      wrapper.setAttribute('data-testid', `student-file-${idx}`);
      wrapper.innerHTML = `
        <div 
          onclick="window.open('${fileUrl}', '_blank')"
          style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: #eff6ff; border-radius: 0.5rem; border: 2px solid #bfdbfe; cursor: pointer; transition: background 0.2s;"
          onmouseover="this.style.background='#dbeafe'"
          onmouseout="this.style.background='#eff6ff'"
        >
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="padding: 0.5rem; border-radius: 0.5rem; background: ${isPdf ? '#fee2e2' : '#dbeafe'};">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${isPdf ? '#dc2626' : '#2563eb'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
            </div>
            <div>
              <p style="font-size: 0.875rem; font-weight: 600; color: #1e293b;">${file.filename}</p>
              <p style="font-size: 0.75rem; color: #64748b;">${isPdf ? 'PDF Document' : 'File'} ${file.file_size ? `· ${(file.file_size / 1024).toFixed(1)} KB` : ''} · Click to open</p>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        </div>
      `;
      listEl.appendChild(wrapper);
    });
  }, [attachments, apiUrl]);

  if (!attachments || attachments.length === 0) return null;

  return (
    <div ref={containerRef} className="mb-6 bg-white rounded-xl border shadow p-6" data-testid="student-files-section">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-slate-500" />
        Assignment Files
      </h3>
      <div className="file-list-container"></div>
    </div>
  );
};

export default AssignmentFiles;
