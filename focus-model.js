/* Deterministic completion: elapsed deadlines, one history row and one learning link. */
(function(root){
 'use strict';
 function remaining(t,now=Date.now()){return t.status==='running'?Math.max(0,Math.ceil((t.deadline-now)/1000)):t.remaining}
 function elapsed(t,now){return !!t&&t.phase==='focus'&&t.deadline<=now&&(t.status==='running'||(['review','paused'].includes(t.status)&&t.remaining===0))}
 function finish(s,id,now,dateFor){const t=s.focusTimer;if(!t||t.id!==id||!elapsed(t,now))return null;
  s.focusSessions??=[];s.learning??=[];
  const existing=s.focusSessions.find(x=>x.id===id),session=existing||{id:t.id,topic:t.topic,method:t.method,date:dateFor(new Date(t.deadline)),seconds:t.seconds,finishedAt:t.deadline};
  const firstLearningDay=!s.learning.some(x=>x.date===session.date);
  if(!existing)s.focusSessions.unshift(session);
  if(!s.learning.some(x=>x.id==='focus-'+id))s.learning.push({id:'focus-'+id,date:session.date,topic:session.topic,minutes:Math.max(1,Math.round(session.seconds/60))});
  s.focusTimer=null;return {session,added:!existing,firstLearningDay};
 }
 root.MinimalFocus={remaining,finish,elapsed};
})(globalThis);
