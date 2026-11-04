/* Staged UI: mounted explicitly only after delivery and account-isolation checks. */
(function(root){
 'use strict';let sequence=0;
 const labels={signin:['Welcome back.','Sign in'],signup:['Make space for your day.','Create account'],reset:['Let’s get you back in.','Send reset link'],resend:['Confirm your email.','Resend confirmation'],recover:['A fresh start.','Save new password'],change:['Change your password.','Save new password']};
 function mount(container,auth,{mode='signin'}={}){
  if(!container||!auth||!root.MinimalAccountFlow)throw Error('Account screen is unavailable.');
  const document=container.ownerDocument,id='minimal-account-'+(++sequence);
  let disposed=false,emailDraft='';
  container.classList.add('minimal-account');
  const flow=root.MinimalAccountFlow.create(auth,render);
  function button(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',action);return b;}
  function render(state){
   if(disposed)return;
   const [title,submitLabel]=labels[state.mode];
   container.replaceChildren();
   const kicker=document.createElement('p');kicker.className='account-kicker';kicker.textContent='YOUR MINIMAL ACCOUNT';container.append(kicker);
   const heading=document.createElement('h1');heading.tabIndex=-1;heading.textContent=state.account&&state.mode==='signin'?'Your account.':title;container.append(heading);
   const notice=document.createElement('p');notice.id=id+'-notice';notice.textContent='Signing in does not upload your device records. Cloud saving will have a separate setup.';container.append(notice);
   const feedback=document.createElement('p');feedback.className='account-feedback';feedback.setAttribute('role',state.error?'alert':'status');feedback.setAttribute('aria-live','polite');feedback.textContent=state.error||state.message;container.append(feedback);
   if(state.needsSignOut){
    container.append(button('Retry sign-out on all devices',()=>void flow.signOut()));
   }else if(state.account&&state.mode==='signin'){
    const email=document.createElement('p');email.className='account-email';email.textContent=state.account.email;container.append(email);
    const actions=document.createElement('div');actions.className='account-actions';
    actions.append(button('Change password',()=>flow.select('change')),button('Sign out on all devices',()=>void flow.signOut()));container.append(actions);
   }else{
    const form=document.createElement('form');form.method='post';form.setAttribute('aria-describedby',notice.id);form.setAttribute('aria-busy',String(state.busy));
    const fields=document.createElement('fieldset');fields.disabled=state.busy;const legend=document.createElement('legend');legend.className='account-sr-only';legend.textContent=submitLabel;fields.append(legend);
    const inputs={};
    function field(name,label,type,autocomplete,min){
     const wrap=document.createElement('div');wrap.className='account-field';
     const l=document.createElement('label');l.htmlFor=id+'-'+name;l.textContent=label;
     const input=document.createElement('input');input.id=l.htmlFor;input.name=name;input.type=type;input.required=true;input.autocomplete=autocomplete;input.maxLength=type==='email'?254:1024;if(min)input.minLength=min;
     input.setAttribute('autocapitalize','none');input.spellcheck=false;if(name==='email')input.value=emailDraft;wrap.append(l,input);fields.append(wrap);inputs[name]=input;
    }
    if(['signin','signup','reset','resend'].includes(state.mode))field('email','Email address','email','email');
    if(state.mode==='change')field('current','Current password','password','current-password');
    if(['signin','signup','recover','change'].includes(state.mode)){
     const fresh=state.mode!=='signin';field('password',fresh?'New password':'Password','password',fresh?'new-password':'current-password',fresh?12:undefined);
     if(fresh)field('confirm','Repeat new password','password','new-password',12);
     const toggle=button('Show passwords',()=>{const show=inputs.password.type==='password';for(const input of Object.values(inputs))if(input.autocomplete.includes('password'))input.type=show?'text':'password';toggle.textContent=show?'Hide passwords':'Show passwords';toggle.setAttribute('aria-pressed',String(show));});toggle.className='account-text-button';toggle.setAttribute('aria-pressed','false');fields.append(toggle);
     if(fresh){const hint=document.createElement('p');hint.className='account-hint';hint.textContent='Use at least 12 characters. This is separate from your private-storage passphrase.';fields.append(hint);}
    }
    if(['signup','reset','resend'].includes(state.mode)){
     const hint=document.createElement('p');hint.className='account-hint';hint.textContent='Open the email link in this same browser tab. If the link expires, request a new one.';fields.append(hint);
    }
    const submit=document.createElement('button');submit.type='submit';submit.className='account-primary';submit.textContent=state.busy?'Please wait…':submitLabel;fields.append(submit);form.append(fields);
    form.addEventListener('submit',event=>{
     event.preventDefault();if(state.busy||!form.reportValidity())return;
     const input=Object.fromEntries(Object.entries(inputs).map(([name,element])=>[name,element.value]));
     if(inputs.email)emailDraft=inputs.email.value;
     // Remove password fields immediately; neither flow state nor browser storage receives them.
     for(const element of Object.values(inputs))if(element.autocomplete.includes('password'))element.value='';
     void flow.submit(input);
    });container.append(form);
    const nav=document.createElement('nav');nav.className='account-actions';nav.setAttribute('aria-label','Account options');
    const options=state.mode==='signin'?[['signup','Create an account'],['reset','Forgot password?'],['resend','Resend confirmation']]:[['signin','Back to sign in']];
    if(state.mode==='recover')options.unshift(['reset','Request a fresh reset link']);
    for(const [next,text] of options)nav.append(button(text,()=>{if(flow.select(next))container.querySelector('h1').focus();}));container.append(nav);
   }
   for(const b of container.querySelectorAll('button'))b.disabled=state.busy;
   const footer=document.createElement('p');footer.className='account-hint';footer.append('Your account password does not unlock encrypted backups. ');const link=document.createElement('a');link.href='/';link.textContent='Return to Minimal';footer.append(link);container.append(footer);
  }
  flow.select(mode);render(flow.snapshot());
  return {dispose(){disposed=true;flow.dispose();container.replaceChildren();},flow};
 }
 root.MinimalAccountUI={mount};
})(globalThis);
