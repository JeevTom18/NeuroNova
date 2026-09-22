/** JSON syntax highlighter — regex-based, zero deps */
export function highlightJson(json) {
  const escaped = json.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    match => {
      let color = '#60a5fa';
      if (/^"/.test(match)) color = /:$/.test(match) ? '#7dd3fc' : '#a5b4fc';
      else if (/true|false/.test(match)) color = '#f472b6';
      else if (/null/.test(match)) color = '#64748b';
      return `<span style="color:${color}">${match}</span>`;
    },
  );
}
