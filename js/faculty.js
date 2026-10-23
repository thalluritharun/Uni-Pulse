/* Local faculty workspace. Files live in IndexedDB; metadata lives with the local profiles. */
(function (root) {
  'use strict';
  function create(api) {
    const {getUser, getDB, save, shell, esc, icon, toast, openModal, closeModal, render, subjects, core} = api;
    const kinds = {notes:'Notes', slides:'Slides / PPT', content:'Learning content', assignment:'Assignment', test:'Test / exam', notification:'Notification'};
    const kindIcons = {notes:'book', slides:'layers', content:'brain', assignment:'edit', test:'target', notification:'bell'};
    let filter = 'all', query = '', studentQuery = '', busy = false;
    const posts = () => Array.isArray(getDB().publications) ? getDB().publications : [];
    const own = post => getUser()?.role === 'faculty' && post.authorId === getUser().id;
    const subject = id => subjects.find(s => s.id === id);
    const visible = post => !!getUser() && (own(post) || (post.status === 'published' && (!post.subjectId || getUser().role === 'faculty' || subject(post.subjectId)?.semester <= getUser().currentSemester)));
    const published = () => posts().filter(p => p.status === 'published' && visible(p)).sort((a,b) => new Date(b.publishedAt)-new Date(a.publishedAt));
    const stamp = value => value ? new Date(value).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'No due date';
    const shortDate = value => value ? new Date(value).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '';
    const localDate = value => { if (!value) return ''; const d = new Date(value); return `${core.localDay(d)}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
    const size = bytes => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1,Math.ceil(bytes / 1024))} KB`;
    const title = (heading, sub, action='') => `<div class="page-title"><div><h1>${esc(heading)}</h1><p class="muted">${esc(sub)}</p></div>${action}</div>`;
    const publishButton = type => `<button class="btn" data-action="faculty-create" data-type="${type || 'notes'}">${icon('plus')}Create a post</button>`;
    const localNotice = `<p class="faculty-local-note">${icon('circle')}Local workspace · Published posts and files are available to profiles in this browser. Campus-wide sharing needs a connected backend.</p>`;

    function fileDB() {
      return new Promise((resolve,reject) => {
        if (!root.indexedDB) return reject(Error('File storage is unavailable in this browser.'));
        const request = indexedDB.open('uni-pulse-files',1);
        request.onupgradeneeded = () => request.result.createObjectStore('files',{keyPath:'id'});
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(Error('Could not open file storage. Check browser storage permissions.'));
      });
    }
    async function fileOp(action, value) {
      const db = await fileDB();
      return new Promise((resolve,reject) => {
        const tx = db.transaction('files',action === 'get' ? 'readonly' : 'readwrite');
        const request = tx.objectStore('files')[action](value);
        let result;
        request.onsuccess = () => { result=request.result; };
        tx.oncomplete = () => { db.close(); resolve(result); };
        tx.onerror = tx.onabort = () => { db.close(); reject(Error('Could not save the file. Browser storage may be full.')); };
      });
    }
    function commit(next) {
      const db = getDB(), before = db.publications;
      db.publications = next;
      if (save() === false) { db.publications = before; return false; }
      return true;
    }
    async function downloadFile(id) {
      const post = posts().find(p => p.id === id && visible(p));
      if (!post?.fileId) return toast('This post has no attachment.');
      const requestedBy = getUser().id;
      try {
        const item = await fileOp('get',post.fileId);
        if (getUser()?.id !== requestedBy || !posts().some(p => p.id === id && visible(p))) return;
        if (!item?.blob) return toast('This file is missing from this browser. Ask the faculty member to attach it again.');
        const url=URL.createObjectURL(item.blob), a=document.createElement('a');
        a.href=url;a.download=post.fileName || 'course-material';document.body.appendChild(a);a.click();a.remove();
        setTimeout(() => URL.revokeObjectURL(url),10000);
      } catch (error) { toast(error.message); }
    }
    function card(post, manage=false) {
      const s=subject(post.subjectId);
      return `<article class="card faculty-post"><div class="row between"><span class="tile-icon ${post.type==='notification'?'peach':post.type==='test'?'lavender':'mint'}">${icon(kindIcons[post.type] || 'book')}</span><span class="pill ${post.status==='draft'?'orange':'green'}">${post.status==='draft'?'Draft':esc(kinds[post.type] || post.type)}</span></div><div><p class="eyebrow">${esc(s?.code || 'All subjects')}</p><h3><a href="#material/${esc(post.id)}">${esc(post.title)}</a></h3><p class="muted faculty-post-preview">${esc(post.body || 'Open this post to view the attached material.')}</p></div><div class="faculty-post-meta"><span>${esc(post.authorName)}</span>${post.dueAt?`<span>${icon('calendar')}Due ${esc(shortDate(post.dueAt))}</span>`:`<span>${post.status==='draft'?'Unpublished':esc(shortDate(post.publishedAt))}</span>`}</div>${post.fileName?`<p class="faculty-attachment">${icon('download')}<span>${esc(post.fileName)} <small>${size(post.fileSize || 0)}</small></span></p>`:''}<div class="faculty-post-actions">${manage?`<button class="btn secondary" data-action="faculty-edit" data-id="${esc(post.id)}">${icon('edit')}Edit</button>${post.status==='draft'?`<button class="btn soft" data-action="faculty-publish" data-id="${esc(post.id)}">Publish</button>`:''}<button class="icon-btn" data-action="faculty-delete" data-id="${esc(post.id)}" aria-label="Delete ${esc(post.title)}">${icon('trash')}</button>`:`<a class="btn secondary" href="#material/${esc(post.id)}">Open ${icon('arrow')}</a>${post.fileId?`<button class="icon-btn" data-action="faculty-download" data-id="${esc(post.id)}" aria-label="Download ${esc(post.fileName)}">${icon('download')}</button>`:''}`}</div></article>`;
    }
    function listPosts() {
      const rows=posts().filter(own).filter(p => filter==='all' || (filter==='draft'?p.status==='draft':p.type===filter)).filter(p => `${p.title} ${p.body} ${subject(p.subjectId)?.code || ''}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => new Date(b.updatedAt || b.createdAt)-new Date(a.updatedAt || a.createdAt));
      return rows.length ? `<div class="faculty-post-grid">${rows.map(p => card(p,true)).join('')}</div>` : `<div class="empty">${icon('book')}<h3>${query?'No matching posts':'Your teaching library starts here'}</h3><p>${query?'Try another title, keyword, or subject code.':'Add notes, attach slides, set an assignment, or share a class update.'}</p>${publishButton()}</div>`;
    }
    function materialsView() {
      shell(title('Your teaching library.','Create, organise, and publish resources for your classes.',publishButton())+localNotice+`<div class="toolbar"><label class="faculty-search">${icon('search')}<input id="faculty-search" type="search" value="${esc(query)}" placeholder="Search your posts" aria-label="Search your posts"></label><label class="faculty-filter">Show<select id="faculty-filter"><option value="all">All posts</option><option value="draft" ${filter==='draft'?'selected':''}>Drafts</option>${Object.entries(kinds).map(([v,l])=>`<option value="${v}" ${filter===v?'selected':''}>${l}</option>`).join('')}</select></label></div><div id="faculty-post-list">${listPosts()}</div>`,'faculty-materials','Teaching library');
    }
    function homeView() {
      const mine=posts().filter(own), publishedCount=mine.filter(p=>p.status==='published').length;
      shell(title(`Hello, ${getUser().name.trim()}.`,'A little preparation. A lasting impact.',publishButton())+`<section class="welcome faculty-welcome"><div><div class="eyebrow">YOUR TEACHING STUDIO</div><h2>Give your next class a head start.</h2><p>Share a reading, set a challenge, and see how your students are progressing.</p><a class="btn" href="#faculty-materials">Open teaching library ${icon('arrow')}</a></div><div class="faculty-hero-mark" aria-hidden="true">${icon('cap')}</div></section>${localNotice}<div class="report-stats"><div class="stat"><span class="label">Published posts</span><strong>${publishedCount}</strong><small>Ready for student profiles</small></div><div class="stat"><span class="label">Drafts in progress</span><strong>${mine.length-publishedCount}</strong><small>Pick up where you left off</small></div><div class="stat"><span class="label">Student profiles</span><strong>${getDB().users.filter(u=>u.role==='student'&&!u.demo).length}</strong><small>Saved in this browser</small></div></div><div class="section-title"><h2>What would you like to share?</h2></div><div class="faculty-action-grid">${Object.entries(kinds).map(([kind,label])=>`<button class="feature faculty-type-action" data-action="faculty-create" data-type="${kind}"><span class="tile-icon ${kind==='test'?'peach':'lavender'}">${icon(kindIcons[kind])}</span><h3>${label}</h3><p>${{notes:'Everyday notes, ready to download.',slides:'Bring your class presentations together.',content:'A full explanation, in your own words.',assignment:'A clear brief and a due date.',test:'Exam instructions and test papers.',notification:'Keep your class in the loop.'}[kind]}</p></button>`).join('')}</div><div class="section-title"><h2>Keep an eye on progress</h2><a href="#faculty-students">View student reports ${icon('arrow')}</a></div><div class="card"><div class="row between wrap"><div><h3>Meet students where they are.</h3><p class="muted small">Review lesson progress, quiz attempts, and recorded marks for local student profiles.</p></div><a class="btn secondary" href="#faculty-students">Explore reports ${icon('chart')}</a></div></div>`,'home','Faculty overview');
    }
    function composer(id, type='notes') {
      if(getUser()?.role!=='faculty') return;
      const post=id?posts().find(p=>p.id===id && own(p)):null;
      if(id&&!post)return;
      type=post?.type || (kinds[type]?type:'notes');
      openModal(post?'Edit your post':'Create something useful',`<p class="muted small faculty-form-intro">Publish to student profiles in this browser, or save a draft for later. Text is kept in full.</p><form id="faculty-post-form"><input type="hidden" name="id" value="${esc(post?.id || '')}"><div class="form-grid"><label>Post type<select name="type" id="faculty-post-type">${Object.entries(kinds).map(([v,l])=>`<option value="${v}" ${type===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Subject<select name="subjectId"><option value="">All subjects / general</option>${subjects.map(s=>`<option value="${esc(s.id)}" ${post?.subjectId===s.id?'selected':''}>${esc(s.code)} · ${esc(s.name)}</option>`).join('')}</select></label><label class="full">Title<input name="title" required maxlength="160" placeholder="Give this post a clear title" value="${esc(post?.title || '')}"></label><label class="full">Content or instructions<textarea name="body" rows="8" maxlength="200000" placeholder="Paste the full notes, assignment brief, or class update here.">${esc(post?.body || '')}</textarea></label><label class="full">Due date / exam time (optional)<input name="dueAt" type="datetime-local" value="${esc(localDate(post?.dueAt))}"></label><label class="full faculty-file-field">Attach a file<input type="file" name="attachment" accept=".pdf,.ppt,.pptx,.txt,.doc,.docx"><span class="muted small">PDF, PPT, PPTX, TXT, DOC or DOCX · up to 20 MB · stored on this device</span></label>${post?.fileId?`<label class="full faculty-file-remove"><input type="checkbox" name="removeFile">Remove ${esc(post.fileName)} (or choose a replacement above)</label>`:''}</div><p class="form-error" id="faculty-post-error" role="alert"></p><div class="form-actions faculty-composer-actions"><button type="button" class="btn secondary" data-action="close-modal">Cancel</button><button type="submit" class="btn secondary" name="status" value="draft">Save draft</button><button type="submit" class="btn" name="status" value="published">${post?.status==='published'?'Update post':'Publish post'} ${icon('arrow')}</button></div></form>`);
    }
    function studentMaterials(subjectId) {
      const list=published().filter(p=>p.type!=='notification' && (!subjectId || !p.subjectId || p.subjectId===subjectId));
      return `<section class="faculty-student-materials"><div class="section-title"><div><div class="eyebrow">FROM YOUR FACULTY</div><h2>Classroom resources</h2></div><span class="pill">${list.length} ${list.length===1?'post':'posts'}</span></div>${list.length?`<div class="faculty-post-grid">${list.map(p=>card(p)).join('')}</div>`:`<div class="card faculty-resource-empty"><span class="tile-icon mint">${icon('download')}</span><div><h3>A place for every class handout.</h3><p class="muted small">Published faculty notes, slides, assignments, and tests will appear here, ready to read or download.</p></div></div>`}</section>`;
    }
    function materialView(id) {
      const post=posts().find(p=>p.id===id&&visible(p));
      if(!post){shell(title('Post unavailable','This post may be a draft, removed, or outside your semester.')+`<a href="#${getUser()?.role==='faculty'?'faculty-materials':'learning'}" class="btn secondary">Return to your library</a>`,'learning','Classroom resource');return;}
      const s=subject(post.subjectId);
      shell(`<a class="text-btn faculty-back" href="#${getUser().role==='faculty'?'faculty-materials':'learning'}">${icon('back')}Back to ${getUser().role==='faculty'?'teaching library':'learning'}</a>`+title(post.title,`${s?s.code+' · '+s.name:'All subjects'} · ${post.authorName}`,own(post)?`<button class="btn secondary" data-action="faculty-edit" data-id="${esc(post.id)}">${icon('edit')}Edit post</button>`:'')+`<article class="card faculty-reading"><div class="row wrap"><span class="pill">${esc(kinds[post.type])}</span><span class="pill ${post.status==='draft'?'orange':'green'}">${post.status==='draft'?'Private draft':'Published '+esc(stamp(post.publishedAt))}</span></div>${post.dueAt?`<div class="faculty-due">${icon('calendar')}<div><strong>${post.type==='test'?'Test / exam time':'Due date'}</strong><p>${esc(stamp(post.dueAt))}</p></div></div>`:''}${post.body?`<div class="faculty-full-content">${esc(post.body)}</div>`:''}${post.fileId?`<div class="faculty-download"><span class="tile-icon lavender">${icon('book')}</span><div><strong>${esc(post.fileName)}</strong><p class="muted small">${size(post.fileSize || 0)} · Original attachment</p></div><button class="btn" data-action="faculty-download" data-id="${esc(post.id)}">${icon('download')}Download</button></div>`:''}</article>`,getUser().role==='faculty'?'faculty-materials':'learning','Classroom resource');
    }
    // Samples are held outside the profile database so they never become actual student records.
    const sampleSpecs=[['sample-arya','Arya Menon',84,8],['sample-kabir','Kabir Shah',62,7],['sample-meera','Meera Iyer',93,9]];
    function studentRecords() {
      const local=getDB().users.filter(u=>u.role==='student'&&!u.demo).map(u=>({profile:u,sample:false}));
      const samples=sampleSpecs.map(([id,name,progress,gradeBase],index)=>({sample:true,progress,profile:{id,name,currentSemester:2,attempts:[{percent:88-index*9,passed:88-index*9>=80},{percent:76+index*8,passed:76+index*8>=80}],results:subjects.flatMap((s,i)=>[{semester:1,subject:`${s.code} · ${s.name}`,title:'Previous semester final',type:'endsem',points:Math.min(10,gradeBase+(i%3)*.5),credits:[3,4,3,4,4,2][i] || 3,sample:true},{semester:2,subject:`${s.code} · ${s.name}`,title:'CLA 1',type:'test',score:20+((i+index)%5),max:30,sample:true},{semester:2,subject:`${s.code} · ${s.name}`,title:'Assignment 1',type:'assignment',score:8+((i+index)%3),max:10,sample:true}]),progress:{},activity:[]}}));
      return [...local,...samples];
    }
    function statsFor(row) {
      const p=row.profile, courses=subjects.filter(s=>s.semester<=p.currentSemester);
      const progress=row.sample?row.progress:courses.length?Math.round(courses.reduce((n,s)=>n+core.subjectProgress(p,s),0)/courses.length):0;
      const attempts=p.attempts || [], mean=attempts.length?Math.round(attempts.reduce((n,a)=>n+a.percent,0)/attempts.length):null;
      return {progress,mean,attempts,gpa:core.gpa(p.results || [])};
    }
    function studentCards() {
      const rows=studentRecords().filter(r=>r.profile.name.toLowerCase().includes(studentQuery.toLowerCase()));
      return rows.length?`<div class="faculty-post-grid">${rows.map(row=>{const p=row.profile,s=statsFor(row);return `<a class="card faculty-student-card" href="#faculty-students/${esc(p.id)}"><div class="row between"><span class="avatar">${esc(p.name.split(/\s+/).map(w=>w[0]).slice(0,2).join(''))}</span><span class="pill ${row.sample?'orange':'green'}">${row.sample?'Sample student':'Local profile'}</span></div><div><h3>${esc(p.name)}</h3><p class="muted small">Semester ${p.currentSemester}</p></div><div><div class="row between small"><span>Learning progress</span><strong>${s.progress}%</strong></div><div class="progress" role="progressbar" aria-label="${esc(p.name)} learning progress" aria-valuenow="${s.progress}" aria-valuemin="0" aria-valuemax="100"><span style="width:${s.progress}%"></span></div></div><div class="faculty-student-metrics"><span><b>${s.mean===null?'—':s.mean+'%'}</b>Quiz average</span><span><b>${s.gpa || '—'}</b>Recorded CGPA</span></div><span class="text-btn">Open progress report ${icon('arrow')}</span></a>`;}).join('')}</div>`:`<div class="empty"><h3>No matching students</h3><p>Try a different name.</p></div>`;
    }
    function studentsView(id) {
      if(id)return studentReport(id);
      shell(title('See the person behind the progress.','Explore learning activity and academic records across student profiles.')+`<div class="notice">Local profiles show data saved in this browser. The three sample students are fictional previews; their marks and activity are illustrative.</div><div class="toolbar"><label class="faculty-search">${icon('search')}<input id="faculty-student-search" type="search" value="${esc(studentQuery)}" placeholder="Find a student by name" aria-label="Find a student by name"></label></div><div id="faculty-student-list">${studentCards()}</div>`,'faculty-students','Student progress');
    }
    function studentReport(id) {
      const row=studentRecords().find(r=>r.profile.id===id);
      if(!row)return studentsView();
      const p=row.profile, st=statsFor(row), courses=row.sample?subjects:subjects.filter(s=>s.semester===p.currentSemester);
      shell(`<a href="#faculty-students" class="text-btn faculty-back">${icon('back')}All students</a>`+title(p.name,`Semester ${p.currentSemester} · ${row.sample?'Fictional sample student':'Local student profile'}`)+`<div class="notice">${row.sample?'Sample report: illustrative marks and progress, not an official student record.':'These are student-entered academic records and local learning activity, not verified institutional results.'}</div><div class="report-stats"><div class="stat"><span class="label">Learning progress</span><strong>${st.progress}%</strong><small>Across accessible subjects</small></div><div class="stat"><span class="label">Quiz average</span><strong>${st.mean===null?'—':st.mean+'%'}</strong><small>${st.attempts.length} completed attempts</small></div><div class="stat"><span class="label">Recorded CGPA</span><strong>${st.gpa || '—'}</strong><small>${row.sample?'Illustrative previous semester result':'From recorded end-semester credits'}</small></div></div><div class="section-title"><h2>Subject progress</h2><span class="pill">Semester ${p.currentSemester}</span></div><div class="card stack">${courses.map((s,i)=>{const value=row.sample?Math.min(100,Math.max(0,st.progress+i*3-6)):core.subjectProgress(p,s);return `<div class="faculty-progress-row"><div><strong>${esc(s.code)}</strong><p class="muted small">${esc(s.name)}</p></div><div><div class="row between small"><span>Learning completion</span><b>${value}%</b></div><div class="progress" role="progressbar" aria-label="${esc(s.code)} completion" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"><span style="width:${value}%"></span></div></div></div>`;}).join('') || '<p class="muted">No course content is available for this semester yet.</p>'}</div><div class="section-title"><h2>Academic record</h2></div><div class="card">${p.results?.length?`<div class="table-scroll"><table><thead><tr><th>Subject / assessment</th><th>Semester</th><th>Type</th><th>Result</th></tr></thead><tbody>${p.results.map(r=>`<tr><td><strong>${esc(r.subject)}</strong><small>${esc(r.title)}</small></td><td>${r.semester}</td><td>${r.type==='endsem'?'End semester':r.type==='assignment'?'Assignment':'Test'}</td><td><strong>${r.type==='endsem'?`${Number(r.points).toFixed(2)} / 10`:`${r.score} / ${r.max}`}</strong></td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">This student has not recorded academic results yet.</p>'}</div>`,'faculty-students','Student report');
    }
    async function submitPost(event) {
      const form=event.target;
      if((form.getAttribute?.('id') || form.id)!=='faculty-post-form')return;
      event.preventDefault();
      if(getUser()?.role!=='faculty'||busy)return;
      const author = {id:getUser().id,name:getUser().name};
      const data=new FormData(form), id=String(data.get('id') || ''), old=posts().find(p=>p.id===id && own(p));
      if(id&&!old)return;
      const error=document.getElementById('faculty-post-error');
      const fail=message=>{if(error)error.textContent=message;};
      const type=String(data.get('type')),subjectId=String(data.get('subjectId')),heading=String(data.get('title')).trim(),body=String(data.get('body')),due=String(data.get('dueAt'));
      if(!kinds[type] || !heading || (subjectId&&!subject(subjectId)))return fail('Choose a valid type, subject, and title.');
      if(due&&!Number.isFinite(new Date(due).getTime()))return fail('Enter a valid due date and time.');
      const file=data.get('attachment'), hasFile=file&&file.size>0;
      if(hasFile&&!/\.(pdf|ppt|pptx|txt|doc|docx)$/i.test(file.name))return fail('Choose a PDF, PowerPoint, text, or Word document.');
      if(hasFile&&file.size>20*1024*1024)return fail('Please choose a file smaller than 20 MB.');
      if(!body.trim()&&!hasFile&&(!old?.fileId || data.get('removeFile')))return fail('Add content or attach a file before saving.');
      busy=true;form.querySelectorAll('button').forEach(b=>b.disabled=true);
      let fileId=old?.fileId || null, fileName=old?.fileName || '',fileSize=old?.fileSize || 0,newFile=null;
      try {
        if(data.get('removeFile')){fileId=null;fileName='';fileSize=0;}
        if(hasFile){newFile=core.uid();await fileOp('put',{id:newFile,blob:file,name:file.name});fileId=newFile;fileName=file.name;fileSize=file.size;}
        if (getUser()?.id !== author.id || getUser()?.role !== 'faculty') throw Error('Your profile changed before the upload finished. Sign in again to publish.');
        if (old && !posts().some(p => p.id === old.id && own(p))) throw Error('This post was removed while you were editing it. Create a new post instead.');
        const status=event.submitter?.value==='draft'?'draft':'published', now=new Date().toISOString();
        const record={id:old?.id || core.uid(),authorId:author.id,authorName:author.name,subjectId,type,title:heading,body,dueAt:due?new Date(due).toISOString():null,status,createdAt:old?.createdAt || now,updatedAt:now,publishedAt:status==='published'?(old?.publishedAt || now):null,fileId,fileName,fileSize};
        const next=old?posts().map(p=>p.id===old.id?record:p):[...posts(),record];
        if(!commit(next)){if(newFile)await fileOp('delete',newFile);fail('Your post could not be saved. Free browser storage and try again.');return;}
        if(old?.fileId&&old.fileId!==fileId)fileOp('delete',old.fileId).catch(()=>{});
        closeModal();location.hash='faculty-materials';render();toast(status==='draft'?'Draft saved.':'Published to the local student workspace.');
      } catch(e){if(newFile)await fileOp('delete',newFile).catch(()=>{});if(form.isConnected)fail(e.message);else toast(e.message);} finally {busy=false;if(form.isConnected)form.querySelectorAll('button').forEach(b=>b.disabled=false);}
    }
    document.addEventListener('submit',submitPost);
    document.addEventListener('input',e=>{if(e.target.id==='faculty-search'){query=e.target.value;document.getElementById('faculty-post-list').innerHTML=listPosts();}if(e.target.id==='faculty-student-search'){studentQuery=e.target.value;document.getElementById('faculty-student-list').innerHTML=studentCards();}});
    document.addEventListener('change',e=>{if(e.target.id==='faculty-filter'){filter=e.target.value;document.getElementById('faculty-post-list').innerHTML=listPosts();}});
    document.addEventListener('click',async e=>{
      const button=e.target.closest('[data-action^="faculty-"]');if(!button||button.disabled)return;
      e.preventDefault();const action=button.dataset.action,id=button.dataset.id;
      if(action==='faculty-download'){await downloadFile(id);return;}
      if(getUser()?.role!=='faculty')return;
      if(action==='faculty-create')composer(null,button.dataset.type);
      if(action==='faculty-edit')composer(id);
      if(action==='faculty-publish'){const post=posts().find(p=>p.id===id&&own(p));if(post&&commit(posts().map(p=>p===post?{...p,status:'published',publishedAt:new Date().toISOString()}:p))){render();toast('Published to the local student workspace.');}}
      if(action==='faculty-delete'){const post=posts().find(p=>p.id===id&&own(p));if(post)openModal('Delete this post?',`<p class="muted">${esc(post.title)} and its attachment will be removed from this browser.</p><div class="form-actions"><button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn danger" data-action="faculty-delete-confirm" data-id="${esc(id)}">Delete post</button></div>`);}
      if(action==='faculty-delete-confirm'){const post=posts().find(p=>p.id===id&&own(p));if(post&&commit(posts().filter(p=>p.id!==id))){if(post.fileId)fileOp('delete',post.fileId).catch(()=>{});closeModal();render();toast('Post deleted.');}}
    });
    return {
      view(route){if(getUser()?.role!=='faculty')return false;if(route==='home')homeView();else if(route==='faculty-materials')materialsView();else if(route.startsWith('faculty-students'))studentsView(route.split('/')[1]);else return false;return true;},
      studentMaterials,materialView,
      notifications:()=>published().filter(p=>p.type==='notification'),
      scheduleEvents:()=>published().filter(p=>p.dueAt&&(p.type==='assignment'||p.type==='test')).map(p=>({id:'publication-'+p.id,title:p.title,type:p.type==='test'?'exam':'assignment',date:p.dueAt,subject:subject(p.subjectId)?.code || 'General',details:p.body,done:false,publicationId:p.id,readOnly:true}))
    };
  }
  root.UniPulseFaculty={create};
})(globalThis);
