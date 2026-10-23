-- Supabase account storage foundation. Public API receives encrypted envelopes only.
-- This reviewed source is applied with Supabase's migration tool, not a fabricated timestamp.
create schema if not exists minimal_private;
revoke all on schema minimal_private from public, anon;
grant usage on schema minimal_private to authenticated;

-- Privilege is needed only to check the caller's live Auth session. No user data is returned.
create function minimal_private.active_minimal_session() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists (
  select 1 from auth.sessions s join auth.users u on u.id=s.user_id
  where s.id = nullif(auth.jwt()->>'session_id','')::uuid
   and s.user_id = auth.uid()
   and (s.not_after is null or s.not_after > now())
   and u.email_confirmed_at is not null
   and not coalesce(u.is_anonymous,false)
   and (u.banned_until is null or u.banned_until < now())
   and u.deleted_at is null
 );
$$;
revoke all on function minimal_private.active_minimal_session() from public, anon;
grant execute on function minimal_private.active_minimal_session() to authenticated;

create function minimal_private.valid_minimal_envelope(value jsonb) returns boolean
language sql immutable security invoker set search_path = '' as $$
 select coalesce(
  jsonb_typeof(value)='object'
  and value->>'format'='minimal-encrypted-state'
  and value->>'version'='1'
  and value->>'kdf'='PBKDF2-SHA256'
  and value->>'iterations'='600000'
  and jsonb_typeof(value->'salt')='string' and value->>'salt' ~ '^[A-Za-z0-9+/]{22}==$'
  and jsonb_typeof(value->'iv')='string' and value->>'iv' ~ '^[A-Za-z0-9+/]{16}$'
  and jsonb_typeof(value->'ciphertext')='string'
  and length(value->>'ciphertext') between 24 and 26666712
  and value->>'ciphertext' ~ '^[A-Za-z0-9+/]+={0,2}$'
  and (value - array['format','version','kdf','iterations','salt','iv','ciphertext'])='{}'::jsonb
  and octet_length(value::text)<=28000000,false);
$$;
revoke all on function minimal_private.valid_minimal_envelope(jsonb) from public,anon;
grant execute on function minimal_private.valid_minimal_envelope(jsonb) to authenticated;

create table public.minimal_cloud_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 1 check (revision between 1 and 9007199254740990),
 payload jsonb,
 previous_payload jsonb,
 deleted boolean not null default false,
 updated_at timestamptz not null default now(),
 constraint encrypted_current check ((deleted and payload is null and previous_payload is null) or (not deleted and minimal_private.valid_minimal_envelope(payload))),
 constraint encrypted_previous check (previous_payload is null or minimal_private.valid_minimal_envelope(previous_payload))
);
alter table public.minimal_cloud_state enable row level security;
alter table public.minimal_cloud_state force row level security;
revoke all on public.minimal_cloud_state from public,anon,authenticated;
grant select,insert,update on public.minimal_cloud_state to authenticated;
create policy minimal_read_own on public.minimal_cloud_state for select to authenticated
 using ((select auth.uid())=user_id and (select minimal_private.active_minimal_session()));
create policy minimal_insert_own on public.minimal_cloud_state for insert to authenticated
 with check ((select auth.uid())=user_id and (select minimal_private.active_minimal_session()));
create policy minimal_update_own on public.minimal_cloud_state for update to authenticated
 using ((select auth.uid())=user_id and (select minimal_private.active_minimal_session()))
 with check ((select auth.uid())=user_id and (select minimal_private.active_minimal_session()));

create function minimal_private.version_minimal_state() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 if tg_op='INSERT' then
  new.revision:=1;new.previous_payload:=null;
 else
  if new.user_id<>old.user_id then raise exception 'Account owner cannot change' using errcode='42501';end if;
  new.revision:=old.revision+1;
  new.previous_payload:=case when new.deleted then null else old.payload end;
 end if;
 new.updated_at:=clock_timestamp();
 return new;
end;
$$;
revoke all on function minimal_private.version_minimal_state() from public,anon,authenticated;
create trigger minimal_state_version before insert or update on public.minimal_cloud_state
 for each row execute function minimal_private.version_minimal_state();

create function public.minimal_put_state(p_expected bigint,p_payload jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_row public.minimal_cloud_state;
begin
 if not minimal_private.active_minimal_session() then raise exception 'Sign in with a verified account' using errcode='42501';end if;
 if p_expected is null or p_expected<0 or not minimal_private.valid_minimal_envelope(p_payload) then raise exception 'Invalid revision or encrypted backup' using errcode='22023';end if;
 if p_expected=0 then
  insert into public.minimal_cloud_state(user_id,payload) values (auth.uid(),p_payload)
   on conflict(user_id) do nothing returning * into v_row;
 else
  update public.minimal_cloud_state set payload=p_payload,deleted=false
   where user_id=auth.uid() and revision=p_expected returning * into v_row;
 end if;
 if v_row.user_id is null then raise exception 'Cloud records changed. Review them before overwriting.' using errcode='40001';end if;
 return jsonb_build_object('revision',v_row.revision,'updated_at',v_row.updated_at);
end;
$$;
revoke all on function public.minimal_put_state(bigint,jsonb) from public,anon;
grant execute on function public.minimal_put_state(bigint,jsonb) to authenticated;

create function public.minimal_clear_state(p_expected bigint) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_row public.minimal_cloud_state;
begin
 if not minimal_private.active_minimal_session() then raise exception 'Sign in with a verified account' using errcode='42501';end if;
 update public.minimal_cloud_state set payload=null,previous_payload=null,deleted=true
  where user_id=auth.uid() and revision=p_expected returning * into v_row;
 if v_row.user_id is null then raise exception 'Cloud records changed. Refresh before deleting.' using errcode='40001';end if;
 return jsonb_build_object('revision',v_row.revision,'deleted',true,'updated_at',v_row.updated_at);
end;
$$;
revoke all on function public.minimal_clear_state(bigint) from public,anon;
grant execute on function public.minimal_clear_state(bigint) to authenticated;
