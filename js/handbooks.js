/* User-supplied Drive handbooks. Viewer downloads were disabled by the owner.
 * These are external reading links, not imported or downloadable local files.
 */
(function(root) {
  'use strict';
  const folderUrl='https://drive.google.com/drive/folders/1WD2s1YA5EYqnyh7qtH85QpMFbzkO5_eh';
  const entries=[
    ['pea101','15DRvCYwv5E10k0dBCwLDbFY3DUfXfqM4','CCC_PSCT_PEA101_Student_Handbook2026.pdf'],
    ['pea102','1akSNp0YQn9VEo6QUeOnhiAq8Sd2KeH9I','CCC_PEA102_Engineering_Mathematics_for_Product_Engineers_Student_Reading_Material_Complete_2026.pdf'],
    ['pea103','1qEzRqnBArUfSCdr6CVb7QPv-HdU5i7kq','CCC_PEA103_AIID_Student_Handbook2026.pdf'],
    ['pea104','1D_zLVHHBYvnvkekRgja9yZPvInprLLGv','CCC_PEA104_Problem_Solving_and_OOP_Fundamentals_Student_Reading_Material_Complete_2026.pdf'],
    ['pea105','1TULU1j1d31xwEjA_wzEPWLjMTd3g5c1R','CCC_PEA105_DSA-1_Student_Handbook2026.pdf'],
    ['pea106','1i0JwiisyVBJDMayglv92ybhqD-wqifsO','CCC_GCC_PEA106_Student_Handbook2026.pdf']
  ].map(([subjectId,driveId,fileName])=>({subjectId,driveId,fileName,viewUrl:`https://drive.google.com/file/d/${driveId}/view`,downloadAvailable:false}));
  function card(subjectId,esc) {
    const file=entries.find(item=>item.subjectId===subjectId);if(!file)return '';
    return `<aside class="card handbook-card" aria-label="Original course handbook"><div><span class="eyebrow">ORIGINAL COURSE HANDBOOK</span><h2>${esc(subjectId.toUpperCase().replace('PEA','PEA '))} · Student reading material</h2><p>Read the original PDF in Google Drive. Downloads are currently restricted by the file owner.</p></div><a class="btn secondary" href="${esc(file.viewUrl)}" target="_blank" rel="noopener noreferrer">Open original PDF ↗</a></aside>`;
  }
  root.UniPulseHandbooks={folderUrl,entries,card};
})(globalThis);
