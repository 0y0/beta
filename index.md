---
---
Placeholder

{% if site.url contains 'oyo.tokyo' -%}{%- else -%}
<a href="/admin/collections/posts" target="_blank">Edit Posts</a>
{%- endif -%}

* Host: {{ site.host }}
* Port: {{ site.port }}
* URL: {{ site.url }}

| Table |
| --- |
{% for v in site %}
| {{ v }} |
{% endfor %}
