/* Local administration prototype. This module does not grant server privileges. */
'use strict';
window.CreateControlAdmin = ({hero, cardHead, icon, esc, button, go, badge, read, toast, open}) => {
  const key = 'ControlAdminWorkspace.v1';
  const ticketKey = 'ControlSupportTickets.v1';
  const empty = () => ({profile:null, feedback:[], promos:[], logs:[]});
  const state = () => ({...empty(), ...read(key, {})});
  const tabs = {Admin:'Dashboard', AdminFeedback:'Feedback', AdminSupport:'Support', AdminLogs:'Logs', AdminPromos:'Promo codes'};
  const date = value => new Date(value).toLocaleString();
  function save(data, event) {
    data.logs = [{id:crypto.randomUUID(), at:Date.now(), event}, ...data.logs].slice(0, 200);
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch { toast('Could not save on this device. Free some browser storage and try again.'); return false; }
  }
  const notice = () => `<div class="CSCallout">${icon('lock')}<p><strong>Local administration preview.</strong> Anyone using this browser can access this space. No secure admin authentication or server permissions are configured.</p></div>`;
  const blank = (title, copy) => `<div class="CSEmpty"><span class="CSIcon">${icon('spark')}</span><h3>${title}</h3><p>${copy}</p></div>`;
  function setup() {
    return hero('CONTROL ADMINISTRATION', 'Setup your <em>admin account</em>', 'A thoughtful space to look after your community.') + `<div class="CSAdminSetup"><article class="CSCard"><span class="CSAdminSeal">${icon('shield')}</span><h2>Your workspace starts here</h2><p>Create a local administrator profile to explore the tools.</p>${notice()}<form id="CSAdminSetupForm" class="CSForm"><label>Display name<input name="name" autocomplete="name" maxlength="60" required placeholder="Your name"/></label><label>Email<input name="email" type="email" autocomplete="email" maxlength="160" required placeholder="you@example.com"/></label><p class="CSFine">Stored only in this browser. Do not enter a password or secret.</p><button type="submit" class="CSButton CSPrimary">Create local profile ${icon('arrow')}</button></form></article><article class="CSCard CSAdminRoadmap">${cardHead('A secure foundation', 'Before opening real administration to a team', 'lock')}<ol><li><strong>Verified sign-in</strong><p>Connect a server-backed identity provider.</p></li><li><strong>Two-step verification</strong><p>Require a passkey or a second factor.</p></li><li><strong>Access you can trust</strong><p>Enforce roles and permissions on the server.</p></li><li><strong>Accountability</strong><p>Keep protected audit logs and recovery controls.</p></li></ol><p class="CSFine">These safeguards are planned, not active in this preview.</p></article></div>`;
  }
  function render(route) {
    const data = state();
    if (!data.profile) return setup();
    const tickets = read(ticketKey, []);
    const head = hero('CONTROL ADMINISTRATION', tabs[route], `Welcome, ${esc(data.profile.name)}. Your local workspace, at a glance.`) + notice() + `<nav class="CSAdminTabs" aria-label="Administration">${Object.entries(tabs).map(([r,l])=>`<button type="button" class="CSButton ${r===route?'CSPrimary':''}" data-cs-route="${r}" ${r===route?'aria-current="page"':''}>${l}</button>`).join('')}</nav>`;
    if (route === 'Admin') return head + `<div class="CSAdminStats">${[['Feedback drafts',data.feedback.length,'AdminFeedback','mail'],['Open support tickets',tickets.filter(t=>t.status!=='resolved').length,'AdminSupport','heart'],['Promo drafts',data.promos.length,'AdminPromos','spark'],['Local events',data.logs.length,'AdminLogs','chart']].map(([label,count,r,i])=>`<article class="CSCard"><span class="CSIcon">${icon(i)}</span><strong class="CSAdminNumber">${count}</strong><h2>${label}</h2>${go('View details',r)}</article>`).join('')}</div><div class="CSColumns"><article class="CSCard">${cardHead('Your administrator profile','Local preview profile','user')}<h3>${esc(data.profile.name)}</h3><p>${esc(data.profile.email)}</p><p class="CSFine">No account has been created on a server.</p></article><article class="CSCard">${cardHead('A place for every conversation','Feedback and support stay on this device','heart')}<p>Save feedback drafts from Contact us, or manage tickets already created in your local support desk.</p>${go('Contact us','Contact')}${go('View local support','AdminSupport')}</article></div>`;
    if (route === 'AdminFeedback') return head + `<article class="CSCard">${cardHead('Feedback inbox','Drafts from Contact us · nothing has been sent','mail')}${data.feedback.length?data.feedback.map(item=>`<article class="CSAdminEntry"><header><h3>${esc(item.subject)}</h3>${badge(item.status)}</header><p class="CSPreWrap">${esc(item.message)}</p><small>${esc(date(item.at))}</small><button class="CSButton" type="button" data-admin-feedback="${esc(item.id)}">${item.status==='reviewed'?'Mark as new':'Mark reviewed'}</button></article>`).join(''):blank('A little room for feedback','Feedback drafts saved on this browser will appear here.')}</article>`;
    if (route === 'AdminSupport') return head + `<article class="CSCard">${cardHead('Support desk','Existing tickets on this device · no remote inbox','heart',button('Open local desk','support'))}${tickets.length?tickets.map(t=>`<article class="CSAdminEntry"><header><h3>${esc(t.subject)}</h3>${badge(t.status)}</header><p class="CSPreWrap">${esc(t.message)}</p><small>${esc(t.category)} · ${esc(t.priority)}</small><label class="CSForm">Ticket status<select data-admin-ticket="${esc(t.id)}" aria-label="Status for ${esc(t.subject)}">${['open','progress','resolved'].map(s=>`<option value="${s}" ${t.status===s?'selected':''}>${s==='progress'?'In progress':s}</option>`).join('')}</select></label></article>`).join(''):blank('All quiet here','Create a ticket in the local support desk to try this workflow.')}</article>`;
    if (route === 'AdminLogs') return head + `<article class="CSCard">${cardHead('Workspace events','Last 200 local administration events · editable browser data, not a security audit','chart')}${data.logs.map(item=>`<div class="CSAdminLog"><span class="CSIcon">${icon('check')}</span><div><strong>${esc(item.event)}</strong><small>${esc(date(item.at))}</small></div></div>`).join('')||blank('No events yet','Local administration actions appear here.')}</article>`;
    return head + `<div class="CSColumns"><article class="CSCard">${cardHead('Create a promo draft','For planning only · cannot be redeemed','spark')}<form id="CSAdminPromoForm" class="CSForm"><label>Code<input name="code" maxlength="32" pattern="(?:[A-Za-z0-9_]|-){3,32}" placeholder="WELCOME20" required/></label><label>Discount (%)<input name="discount" type="number" min="1" max="100" step="1" value="20" required/></label><label>Expiry date<input name="expiry" type="date" min="${GetLocalDateKey()}" required/></label><button class="CSButton CSPrimary" type="submit">Save draft ${icon('plus')}</button><p class="CSFine">Control protections remain free. These drafts have no effect on payments or access.</p></form></article><article class="CSCard">${cardHead('Your promo drafts','Stored only on this browser','spark')}${data.promos.map(p=>`<article class="CSAdminEntry"><header><h3>${esc(p.code)}</h3>${badge(p.expiry<GetLocalDateKey()?'Expired':p.archived?'Archived':'Draft')}</header><p>${p.discount}% · Expires ${esc(p.expiry)}</p><button type="button" class="CSButton" data-admin-promo="${esc(p.id)}">${p.archived?'Restore draft':'Archive draft'}</button></article>`).join('')||blank('No codes yet','Create a draft to plan a future campaign.')}</article></div>`;
  }
  function contact() {
    return hero('WE’RE HERE TO HELP', 'Contact <em>us.</em>', 'Questions, ideas, or a little feedback. Make yourself heard.') + `<div class="CSColumns"><article class="CSCard">${cardHead('Start a conversation','Contact details are being prepared','mail')}<p>Email address</p><p class="CSPlaceholder">[CONTACT_EMAIL]</p><p>This is a placeholder. Email sending is not active.</p>${go('Administration','Admin')}${button('Open local support desk','support')}</article><article class="CSCard">${cardHead('Keep a feedback draft','Saved in this browser, visible in local Administration','heart')}<form id="CSFeedbackForm" class="CSForm"><label>Subject<input name="subject" maxlength="100" placeholder="What’s on your mind?" required/></label><label>Your message<textarea name="message" rows="5" maxlength="3000" placeholder="Tell us a little more…" required></textarea></label><p class="CSFine">Nothing is sent. Avoid including passwords or sensitive personal information.</p><button type="submit" class="CSButton CSPrimary">Save local draft ${icon('check')}</button></form></article></div>`;
  }
  function donation() {
    return hero('A LITTLE GENEROSITY', 'More focus.<br /><em>For everyone.</em>', 'Help keep Control a calm, accessible space.') + `<article class="CSCard CSDonation"><span class="CSAdminSeal">${icon('heart')}</span><h2>Support the idea behind Control</h2><p>Thoughtful tools. Fewer distractions. Your support could help improve accessibility, maintain protection tools, and make the experience better for everyone.</p><div class="CSPlaceholder">[DONATION_LINK]</div><button class="CSButton CSPrimary" type="button" disabled>Donations coming soon ${icon('heart')}</button><p class="CSFine">Placeholder only. No payment provider or checkout is connected.</p>${go('Share your feedback','Contact')}</article>`;
  }
  function submit(event) {
    const form = event.target;
    if (!['CSAdminSetupForm','CSAdminPromoForm','CSFeedbackForm'].includes(form.id)) return;
    event.preventDefault();
    const f = new FormData(form), data = state();
    if (form.id === 'CSAdminSetupForm') {
      const name = f.get('name').trim();
      if (!name) { toast('Please enter a display name.'); return; }
      data.profile = {name, email:f.get('email').trim()};
      if(save(data, 'Local administrator profile created')) {open('Admin');toast('Local profile saved');}
    } else if (form.id === 'CSFeedbackForm') {
      const subject=f.get('subject').trim(), message=f.get('message').trim();
      if(!subject||!message) {toast('Add a subject and a message.');return;}
      data.feedback.unshift({id:crypto.randomUUID(), at:Date.now(), subject, message, status:'new'});
      if(save(data, 'Feedback draft saved')) {form.reset();toast('Draft saved on this device · nothing sent');}
    } else if (data.profile) {
      const code=f.get('code').trim().toUpperCase(), discount=Number(f.get('discount')), expiry=f.get('expiry');
      if(data.promos.some(p=>p.code===code)) {toast('This code already exists. Choose another code.');return;}
      if(!/^[A-Z0-9_-]{3,32}$/.test(code)||!Number.isInteger(discount)||discount<1||discount>100||expiry<GetLocalDateKey()) {toast('Check the code, discount, and expiry date.');return;}
      data.promos.unshift({id:crypto.randomUUID(), code, discount, expiry, archived:false});
      if(save(data, 'Promo draft created')) {open('AdminPromos');toast('Promo draft saved · not redeemable');}
    }
  }
  function click(b) {
    const data=state();
    if(b.dataset.adminFeedback) {
      const item=data.feedback.find(i=>i.id===b.dataset.adminFeedback);
      if(item) {item.status=item.status==='reviewed'?'new':'reviewed';if(save(data,'Feedback review status changed'))open('AdminFeedback');}
      return true;
    }
    if(b.dataset.adminPromo) {
      const item=data.promos.find(i=>i.id===b.dataset.adminPromo);
      if(item) {item.archived=!item.archived;if(save(data,'Promo draft status changed'))open('AdminPromos');}
      return true;
    }
    return false;
  }
  function change(event) {
    const select=event.target;
    if(!select.dataset.adminTicket) return;
    const tickets=read(ticketKey,[]), ticket=tickets.find(t=>t.id===select.dataset.adminTicket);
    if(!ticket||!['open','progress','resolved'].includes(select.value))return;
    ticket.status=select.value;
    try { localStorage.setItem(ticketKey,JSON.stringify(tickets)); }
    catch {toast('Could not save the ticket on this device.');return;}
    save(state(),'Local support ticket status changed');open('AdminSupport');toast('Local ticket updated');
  }
  return {render, contact, donation, submit, click, change};
};
