const SalesQueenExport = (() => {
  function exportJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // PDF export stub (client-only). For full PDF, integrate a client lib later if allowed.
  function exportPDFStub() {
    alert('PDF export will be implemented with a client-side library if permitted. For now, use the browser Print to PDF.');
  }

  return { exportJSON, exportPDFStub };
})();


