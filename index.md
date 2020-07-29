---
---
Placeholder

* Host: {{ site.host }}
* URL: {{ page.url }}

{%- if site.host=="127.0.0.1" -%}
<a href="/admin/collections/posts" target="_blank">Edit Posts</a>
{%- endif -%}
