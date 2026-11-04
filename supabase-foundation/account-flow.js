/* Staged account flow. No record access, SDK loading or automatic cloud upload. */
(function(root){
 'use strict';
 const modes=new Set(['signin','signup','reset','resend','recover','change']);
 function create(auth,onChange=()=>{}){
  let state={mode:'signin',busy:false,message:'',error:'',account:null,needsSignOut:false},disposed=false;
  const snapshot=()=>({...state,account:state.account?{...state.account}:null});
  function notify(){if(!disposed)onChange(snapshot());}
  function select(mode){if(disposed||state.busy||state.needsSignOut||!modes.has(mode))return false;state={...state,mode,message:'',error:''};notify();return true;}
  async function submit(input={}){
   if(disposed||state.busy||state.needsSignOut)return false;
   const mode=state.mode;state={...state,busy:true,message:'',error:''};notify();
   try{
    let result;
    if(mode==='signup'||mode==='recover'||mode==='change'){
     if(typeof input.password!=='string'||input.password!==input.confirm)throw Error('Passwords do not match.');
    }
    if(mode==='signin'){
     const user=await auth.signIn(input.email,input.password,input.captchaToken);
     result={message:'You are signed in. Cloud saving is not connected yet.'};
     state={...state,account:{id:user.id,email:user.email||''}};
    }else if(mode==='signup')result=await auth.signUp(input.email,input.password,input.captchaToken);
    else if(mode==='reset')result=await auth.requestReset(input.email,input.captchaToken);
    else if(mode==='resend')result=await auth.resendConfirmation(input.email,input.captchaToken);
    else{
     if(mode==='recover'&&!await auth.canRecover())throw Error('Recovery link is not valid.');
     result=await auth.updatePassword(input.password,mode==='change'?input.current:undefined);
     state={...state,needsSignOut:result.signedOut===false};
     if(result.signedOut)state={...state,mode:'signin',account:null};
    }
    state={...state,message:result.message};return true;
   }catch{
    const mismatch=(mode==='signup'||mode==='recover'||mode==='change')&&input.password!==input.confirm;
    state={...state,error:mismatch?'The two passwords must match.':mode==='recover'?'This reset could not be completed. Request a fresh link and open it in the same browser tab.':mode==='signin'?'Sign-in failed. Check your email, password and confirmation email.':'This request could not be completed. Check your details, wait a moment and try again.'};return false;
   }finally{state={...state,busy:false};notify();}
  }
  async function signOut(){
   if(disposed||state.busy)return false;
   state={...state,busy:true,error:'',message:''};notify();
   try{await auth.signOut();state={mode:'signin',busy:false,account:null,needsSignOut:false,error:'',message:'You have signed out.'};return true;}
   catch{state={...state,error:'Sign-out could not be confirmed. Stay on this device and try again.'};return false;}
   finally{state={...state,busy:false};notify();}
  }
  return {snapshot,select,submit,signOut,dispose(){disposed=true;state={mode:'signin',busy:false,message:'',error:'',account:null};}};
 }
 root.MinimalAccountFlow={create};
})(globalThis);
