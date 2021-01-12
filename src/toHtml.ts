interface ifsObj {
  title: string;
  content?: Array<string>;
  child?: Array<ifsObj>;
  type?: { name: string; url?: string };
}

/**
 * string convert html
 */
export const toHtml = (data: Array<ifsObj>) => {
  list = data;
  for (const item of list) {
    convert(item);
  }
};

let list: Array<ifsObj> = [];

const convert = (obj: ifsObj) => {
  if (obj.content) {
    dataFormart(obj.content);
  }
  if (obj.child) {
    for (const n of obj.child) {
      convert(n);
    }
  }
};

/**
 * data formart to html
 * @param content
 */
const dataFormart = (content: Array<string>): void => {
  for (let i = 0; i < content.length; i++) {
    content[i] = toLink(content[i]);
    content[i] = toB(content[i]);
    content[i] = toEm(content[i]);
    content[i] = toPre(content[i]);
    content[i] = toBlockquote(content[i]);
    content[i] = toDiv(content[i]);
    content[i] = toCheckbox(content[i]);
  }
};

const toLink = (str: string): string => {
  let value = str;
  const regular = /\[(.+?)\]\((.+?)\)/;
  const arr = regular.exec(str);
  if (arr) {
    value = str.replace(arr[0], `<a href="${arr[2]}">${arr[1]}</a>`);
    value = toLink(value);
  }
  return value;
};

const toB = (str: string): string => {
  let value = str;
  const regular = /\*\*(.+?)\*\*/;
  const arr = regular.exec(str);
  if (arr) {
    value = str.replace(arr[0], `<b>${arr[1]}</b>`);
    value = toB(value);
  }
  return value;
};

const toEm = (str: string): string => {
  let value = str;
  const regular = /\*(.+?)\*/;
  const arr = regular.exec(str);
  if (arr) {
    value = str.replace(arr[0], `<em>${arr[1]}</em>`);
    value = toEm(value);
  }

  return value;
};

let singlePre = false;
const toPre = (str: string): string => {
  let value = str;
  const regular = /^\`\`\`(.*)/;
  const arr = regular.exec(str);
  if (arr) {
    if (singlePre) {
      value = str.replace(arr[0], '</code></pre>');
    } else {
      value = str.replace(arr[0], `<pre><code class="${arr[1]}">`);
    }
    singlePre = !singlePre;
  }

  return value;
};

const toBlockquote = (str: string): string => {
  let value = str;
  if (value.slice(0, 2) === '> ') {
    value = `<blockquote><p>${value.slice(2)}</p></blockquote>`;
  }
  return value;
};

const toDiv = (str: string): string => {
  if (str === ':::') {
    return '</div>';
  } else {
    const regular = /^\:\:\: (.*)/;
    const arr = regular.exec(str);
    if (arr) {
      return `<div css="${arr[1]}" >`;
    } else {
      return str;
    }
  }
};

const toCheckbox = (str: string): string => {
  return str
    .replace(/[^\`]\[ \][^\`]/g, '<input type="checkbox">')
    .replace(/^\[ \]/g, '<input type="checkbox">')
    .replace(/[^\`]\[x\][^\`]/g, '<input type="checkbox" checked="true">')
    .replace(/^\[x\]/g, '<input type="checkbox" checked="true">');
};
