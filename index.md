---
layout: home
---

<script src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML" type="text/javascript"></script>

{% if site.url contains 'oyo.tokyo' -%}{%- else %}
<a class="local-link" href="/admin/collections/posts" target="admin">Edit Posts</a>
{% endif %}

## Site Info

* Host: {{ site.host }}
* Port: {{ site.port }}
* URL: {{ site.url }}

## Two-Column Layout

{% include figure src="/kitten.jpg" alt="kitten" %}
1. Don't forget to feed me.
1. Don't ignore me.
1. All your keyboards are belong to me.
1. Don't annoy me with cameras.
{% include endfigure %}

## MathJax

$$
\begin{aligned}
  \phi(x,y) & = \phi \left(\sum_{i=1}^n x_ie_i, \sum_{j=1}^n y_je_j \right) \\
  & = \sum_{i=1}^n \sum_{j=1}^n x_i y_j \phi(e_i, e_j) \\
  & = (x_1, \ldots, x_n) \left( \begin{array}{ccc}
      \phi(e_1, e_1) & \cdots & \phi(e_1, e_n) \\
      \vdots & \ddots & \vdots \\
      \phi(e_n, e_1) & \cdots & \phi(e_n, e_n)
    \end{array} \right)
  \left( \begin{array}{c}
      y_1 \\
      \vdots \\
      y_n
    \end{array} \right)
\end{aligned}
$$

## Java Code

~~~ java
import java.io.File;

public class Clay implements Deformable
{
  public final static ST = "ST982567";
  String desc;
  Color pantone;
  Date expiry;
}
~~~

## Jekyll Site Variables

| Key | Contents |
| --- | --- |
{% for k in site -%}{%- if k=="html_pages" or k=="pages" or k=="excerpt_separator" or k=="github" -%}{%- else -%}
{%- assign v = site[k] -%}
| {%- if v.first -%}*{{ k }}*{: style="color: orange"}{%- else -%}{{ k }}{%- endif -%} 
| {%- if v.first -%}{%- if v.first.first -%}{%- for c in v -%}{{ c | join: " = " }}<br/>{%- endfor -%}{%- else -%}{{ v | join: "<br/>" }}{%- endif -%}{%- else -%}{{ v }}{%- endif -%} |
{% endif -%}{%- endfor %}

## GitHub Variables (site.github)

| Key | Contents |
| --- | --- |
{% for k in site.github -%}{%- if k=="html_pages" or k=="pages" or k=="excerpt_separator" or k=="github" -%}{%- else -%}
{%- assign v = site.github[k] -%}
| {%- if v.first -%}*{{ k }}*{: style="color: orange"}{%- else -%}{{ k }}{%- endif -%} 
| {%- if v.first -%}{%- if v.first.first -%}{%- for c in v -%}{{ c | join: " = " }}<br/>{%- endfor -%}{%- else -%}{{ v | join: "<br/>" }}{%- endif -%}{%- else -%}{{ v }}{%- endif -%} |
{% endif -%}{%- endfor %}
