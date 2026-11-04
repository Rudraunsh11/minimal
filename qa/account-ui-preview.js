// No SDK, network, storage or real users. This file is never copied to the public app.
MinimalAccountUI.mount(document.getElementById('account'),{
 signIn:async()=>({id:'synthetic-preview',email:'preview@example.invalid'}),
 signUp:async()=>({message:'Preview: confirmation email would be sent. No account was created.'}),
 requestReset:async()=>({message:'Preview: a reset link would be requested. No email was sent.'}),
 resendConfirmation:async()=>({message:'Preview: confirmation would be resent. No email was sent.'}),
 canRecover:async()=>false,
 updatePassword:async()=>({message:'Preview: password change simulated. Nothing was saved.',signedOut:true}),
 signOut:async()=>{}
});
