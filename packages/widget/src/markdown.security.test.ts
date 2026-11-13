import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('untrusted announcement Markdown', () => {
  it.each([
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '[Open](javascript:alert(1))',
    '[Open](data:text/html,<script>alert(1)</script>)',
    '[Open](https://example.com/"onmouseover="alert(1))',
    '[<img src=x onerror=alert(1)>](https://example.com)',
    '**<script>alert(1)</script>**',
    '&lt;img src=x onerror=alert(1)&gt;'
  ])('keeps executable content inert: %s', (input) => {
    const host = document.createElement('div');
    host.innerHTML = renderMarkdown(input);
    expect(host.querySelector('script,img,svg,iframe,object,style')).toBeNull();
    for (const element of host.querySelectorAll('*')) {
      expect([...element.attributes].some((attribute) => /^on/i.test(attribute.name))).toBe(false);
    }
    for (const link of host.querySelectorAll('a')) {
      expect(['http:', 'https:']).toContain(link.protocol);
      expect(link.rel.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
    }
  });
});
