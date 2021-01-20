import { resolve } from 'path';
const template = require('art-template');

interface ifsObj {
  title: string;
  content?: Array<string>;
  child?: Array<ifsObj>;
  type?: { name: string; url?: string };
}

/**
 * string convert html
 */
export const toHtml = (
  data: Array<ifsObj>,
  apiData: { [key: string]: Array<any> }
) => {
  apiList = apiData;

  for (const item of data) {
    apiObj = apiList[item.title];
    convert(item);
  }
};

let apiList: { [key: string]: Array<any> } = {};
let apiObj: { [key: string]: any } = {};
let url = '';

const convert = (obj: ifsObj) => {
  let type = '';
  let apiContent: { [key: string]: any } = {};

  if (obj.type) {
    // record type
    type = obj.type.name;
    // record url
    if (obj.type.url) {
      url = obj.type.url;
    }
    apiContent = apiObj.find((n: any) => n.url === url);
    apiContent = apiContent?.content.find((n: any) => n.type === type);
  }

  apiFormat(obj, url, apiContent);
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
 * api data formart to html
 * @param obj
 * @param url
 * @param apiObj
 */
const apiFormat = (
  obj: ifsObj,
  url: string,
  apiObj: { [key: string]: any }
): void => {
  if (obj.content) {
    for (let i = 0; i < obj.content.length; i++) {
      if (
        obj.content[i].indexOf('+ Response') !== -1 ||
        obj.content[i].indexOf('+ Request') !== -1 ||
        obj.content[i].indexOf('+ Parameters') !== -1
      ) {
        obj.content = obj.content.splice(0, i);

        if (apiObj) {
          template.defaults.imports.isArray = Array.isArray;
          const arrStr = template(resolve(__dirname, 'tpl.art'), {
            url,
            ...apiObj,
          })
            .split('\n')
            .filter((n: string) => n.replace(/ */g, '') !== '');
          obj.content = [...obj.content, ...arrStr];
        }
        return;
      }
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
    content[i] = toList(content[i]);
  }
};

const toLink = (str: string): string => {
  let value = str;
  const arr = /\[(.+?)\]\((.+?)\)/.exec(str);
  if (arr) {
    value = str.replace(arr[0], `<a href="${arr[2]}">${arr[1]}</a>`);
    value = toLink(value);
  }
  return value;
};

const toB = (str: string): string => {
  let value = str;
  const arr = /\*\*(.+?)\*\*/.exec(str);
  if (arr) {
    value = str.replace(arr[0], `<b>${arr[1]}</b>`);
    value = toB(value);
  }
  return value;
};

const toEm = (str: string): string => {
  let value = str;
  const arr = /\*(.+?)\*/.exec(str);
  if (arr) {
    value = str.replace(arr[0], `<em>${arr[1]}</em>`);
    value = toEm(value);
  }

  return value;
};

let singlePre = false;
const toPre = (str: string): string => {
  let value = str;
  const arr = /^\`\`\`(.*)/.exec(str);
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

let listStart = false;
const toList = (str: string): string => {
  if (str === '' && listStart) {
    listStart = false;
    return '</ol>';
  }

  const arr = / *\+ (.+)/.exec(str);
  let value = str;
  if (arr) {
    if (listStart) {
      value = `<li>${arr[1]}</li>`;
    } else {
      listStart = true;
      value = `<ol><li>${arr[1]}</li>`;
    }
  }
  return value;
};
