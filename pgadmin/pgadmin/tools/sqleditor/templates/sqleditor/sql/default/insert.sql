{# Insert the new row with primary keys (specified in primary_keys) #}
INSERT INTO {{ conn|qtIdent(nsp_name, object_name) }} (
{% for col in data_to_be_saved %}
{% if not loop.first %}, {% endif %}{{ conn|qtIdent(col) }}{% endfor %}
) VALUES (
{% for col in data_to_be_saved %}
{% if not loop.first %}, {% endif %}%({{ col }})s::{{ data_type[col] }}{% endfor %}
)
{% if pk_names %} returning {{pk_names}}{% endif %}
{% if has_oids %} returning oid{% endif %};
