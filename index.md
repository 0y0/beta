---
---
Placeholder

{%- unless site.url contains 'oyo.tokyo' -%}
<a href="/admin/collections/posts" target="_blank">Edit Posts</a>
{%- endif -%}

* Host: {{ site.host }}
* Port: {{ site.port }}
* URL: {{ site.url }}

> {% for v in site %}
* {{ v }}
{% endfor %}
