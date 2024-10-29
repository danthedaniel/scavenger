create table "public"."zones" (
    "name" text not null,
    "discovered_on" timestamp with time zone not null default now()
);


alter table "public"."zones" enable row level security;

CREATE UNIQUE INDEX zones_pkey ON public.zones USING btree (name);

alter table "public"."zones" add constraint "zones_pkey" PRIMARY KEY using index "zones_pkey";

grant delete on table "public"."zones" to "service_role";

grant insert on table "public"."zones" to "service_role";

grant references on table "public"."zones" to "service_role";

grant select on table "public"."zones" to "service_role";

grant trigger on table "public"."zones" to "service_role";

grant truncate on table "public"."zones" to "service_role";

grant update on table "public"."zones" to "service_role";
