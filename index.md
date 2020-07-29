---
---
Placeholder

{% if site.url contains 'oyo.tokyo' -%}{%- else -%}
<a href="/admin/collections/posts" target="_blank">Edit Posts</a>
{%- endif %}

* Host: {{ site.host }}
* Port: {{ site.port }}
* URL: {{ site.url }}

| Key | Contents |
| --- | --- |
{% for k in site -%}{%- if k=="html_pages" or k=="pages" or k=="excerpt_separator" or k=="github" -%}{%- else -%}
| {{ k }} | {{ site[k] }} |
{% endif -%}{%- endfor %}
