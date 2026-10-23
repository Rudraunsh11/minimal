-- Synthetic accounts only. Entire transaction rolls back, including auth users/sessions.
begin;
create temporary table minimal_test_context(a uuid,b uuid,sa uuid,sb uuid,box jsonb);
insert into minimal_test_context values(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),jsonb_build_object('format','minimal-encrypted-state','version',1,'kdf','PBKDF2-SHA256','iterations',600000,'salt','AAAAAAAAAAAAAAAAAAAAAA==','iv','AAAAAAAAAAAAAAAA','ciphertext','AAAAAAAAAAAAAAAAAAAAAAAA'));
grant select on minimal_test_context to authenticated,anon;
insert into auth.users(id,aud,role,email,email_confirmed_at,is_anonymous)
 select a,'authenticated','authenticated',a::text||'@example.invalid',now(),false from minimal_test_context
 union all select b,'authenticated','authenticated',b::text||'@example.invalid',now(),false from minimal_test_context;
insert into auth.sessions(id,user_id,created_at,updated_at) select sa,a,now(),now() from minimal_test_context union all select sb,b,now(),now() from minimal_test_context;
set local role authenticated;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',a,'session_id',sa,'role','authenticated')::text from minimal_test_context),true);
do $$declare n int;r jsonb;begin
 select public.minimal_put_state(0,box) into r from minimal_test_context;
 if r->>'revision'<>'1' then raise exception 'Initial revision failed';end if;
 select public.minimal_put_state(1,box) into r from minimal_test_context;
 if r->>'revision'<>'2' then raise exception 'Version increment failed';end if;
 select count(*) into n from public.minimal_cloud_state where previous_payload is not null;
 if n<>1 then raise exception 'Previous encrypted save missing';end if;
 begin
  perform public.minimal_put_state(1,box) from minimal_test_context;
  raise exception 'Stale revision was accepted';
 exception when serialization_failure then null;end;
 begin
  insert into public.minimal_cloud_state(user_id,payload) select b,box from minimal_test_context;
  raise exception 'Another owner was accepted';
 exception when insufficient_privilege then null;end;
 begin
  perform public.minimal_put_state(2,'{"notes":"plaintext"}'::jsonb);
  raise exception 'Plaintext payload was accepted';
 exception when invalid_parameter_value then null;end;
 begin
  update public.minimal_cloud_state set user_id=(select b from minimal_test_context);
  raise exception 'Owner reassignment was accepted';
 exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',b,'session_id',sb,'role','authenticated')::text from minimal_test_context),true);
do $$declare n int;begin
 select count(*) into n from public.minimal_cloud_state;
 if n<>0 then raise exception 'Account B can read A';end if;
 update public.minimal_cloud_state set deleted=true,payload=null where user_id=(select a from minimal_test_context);
 get diagnostics n=row_count;if n<>0 then raise exception 'Account B can change A';end if;
 perform public.minimal_put_state(0,box) from minimal_test_context;
 if (select count(*) from public.minimal_cloud_state)<>1 then raise exception 'Account B own write failed';end if;
 perform public.minimal_clear_state(1);
 if not exists(select 1 from public.minimal_cloud_state where deleted and revision=2 and payload is null and previous_payload is null) then raise exception 'Cloud deletion tombstone failed';end if;
 begin perform public.minimal_put_state(0,box) from minimal_test_context;raise exception 'Stale device resurrected deleted records';exception when serialization_failure then null;end;
 perform public.minimal_put_state(2,box) from minimal_test_context;
end$$;
reset role;
delete from auth.sessions where id=(select sa from minimal_test_context);
set local role authenticated;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',a,'session_id',sa,'role','authenticated')::text from minimal_test_context),true);
do $$begin
 if exists(select 1 from public.minimal_cloud_state) then raise exception 'Revoked session can read';end if;
 begin
  perform public.minimal_put_state(2,box) from minimal_test_context;
  raise exception 'Revoked session can write';
 exception when insufficient_privilege then null;end;
end$$;
reset role;
update auth.users set email_confirmed_at=null where id=(select b from minimal_test_context);
set local role authenticated;
select set_config('request.jwt.claims',(select jsonb_build_object('sub',b,'session_id',sb,'role','authenticated')::text from minimal_test_context),true);
do $$begin if exists(select 1 from public.minimal_cloud_state) then raise exception 'Unverified account can read';end if;end$$;
reset role;
set local role anon;
select set_config('request.jwt.claims','{}',true);
do $$begin
 begin perform 1 from public.minimal_cloud_state;raise exception 'Anonymous read accepted';exception when insufficient_privilege then null;end;
 begin perform public.minimal_put_state(0,'{}'::jsonb);raise exception 'Anonymous RPC accepted';exception when insufficient_privilege then null;end;
end$$;
reset role;
select 'PASS: own access; cross-account read/write/owner reassignment denied; stale revision rejected; encrypted previous snapshot; plaintext rejected; revoked/unverified/anonymous blocked' as verification;
rollback;
