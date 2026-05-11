const URL = 'https://dwadhzabswoexsmmyyqq.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3YWRoemFic3dvZXhzbW15eXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDkzNjYsImV4cCI6MjA5NDAyNTM2Nn0.DOB3JYQccI15pCjMx33oGLgefG9BoR5QoxbzXp207cA';
const H = {'Content-Type':'application/json','apikey':KEY,'Authorization':'Bearer '+KEY};
const q = (t,s='*')=>fetch(`${URL}/${t}?select=${s}`,{headers:H}).then(r=>r.json()).then(d=>({data:d,error:null}));
const qo = (t,c,a)=>fetch(`${URL}/${t}?select=*&order=${c}.${a?'asc':'desc'}`,{headers:H}).then(r=>r.json()).then(d=>({data:d,error:null}));
export const supabase={from:t=>({select:(s='*')=>({order:(c,o)=>qo(t,c,o?.ascending),then:(f)=>q(t,s).then(f)}),upsert:b=>fetch(`${URL}/${t}`,{method:'POST',headers:{...H,'Prefer':'resolution=merge-duplicates'},body:JSON.stringify(b)}).then(r=>({error:r.ok?null:r.status})),insert:b=>fetch(`${URL}/${t}`,{method:'POST',headers:H,body:JSON.stringify(b)}).then(r=>({error:r.ok?null:r.status})),update:b=>({eq:(c,v)=>fetch(`${URL}/${t}?${c}=eq.${v}`,{method:'PATCH',headers:H,body:JSON.stringify(b)}).then(r=>({error:r.ok?null:r.status}))})})};
