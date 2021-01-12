import { resolve } from 'path';
const rimraf = require('rimraf');
const fs = require('fs');
import { toHtml } from './toHtml';

interface ifsTitleObj {
  title: string;
  child?: Array<ifsDataObj>;
  type?: { name: string; url?: string };
}

interface ifsDataObj extends ifsTitleObj {
  content?: Array<string>;
}

interface ifsConfigObj {
  title: string;
  info: {
    [key: string]: any;
  };
}

export default class ApibJson {
  private titleList: Array<ifsTitleObj> = [];
  private allData: Array<ifsDataObj> = [];
  private config: Array<ifsConfigObj> = [];

  private requestMethod = ['GET', 'POST', 'PUT', 'DELETE'];

  /**
   * The depth of the current title in the object
   */
  private titleDepth = 0;

  /**
   * Convert start
   * @param apibFolderUrl
   * @param targetFolderUrl
   */
  public run = (apibFolderUrl: string, targetFolderUrl: string) => {
    const folderName = apibFolderUrl.split('/').pop();
    if (folderName) {
      const folderUrl = resolve(targetFolderUrl, folderName);
      rimraf.sync(folderUrl);
      fs.mkdirSync(folderUrl);

      // Get apib-file list
      const fileList = fs
        .readdirSync(apibFolderUrl)
        .filter((n: string) => n.split('.').pop() === 'apib');

      // Data init
      this.titleList = [];
      this.allData = [];

      // Convert-data write file
      for (const fileName of fileList) {
        const title = fileName.slice(0, fileName.lastIndexOf('.'));
        this.titleList.push({ title, child: [] });
        this.allData.push({
          title,
          child: [],
        });
        this.config.push({ title, info: [] });
        const info = fs.readFileSync(apibFolderUrl + '/' + fileName);
        this.convert(info.toString());
      }

      toHtml(this.allData);

      // Write to JSON file
      fs.writeFileSync(
        folderUrl + '/config.json',
        JSON.stringify(this.config).replace(/\,\"child\"\:\[\]/g, '')
      );
      fs.writeFileSync(
        folderUrl + '/titleList.json',
        JSON.stringify(this.titleList).replace(/\,\"child\"\:\[\]/g, '')
      );
      fs.writeFileSync(
        folderUrl + '/data.json',
        JSON.stringify(this.allData).replace(/\,\"child\"\:\[\]/g, '')
      );

      // console.log tips
      this.completedTips(folderUrl);
    }
  };

  private convert = (apib: string) => {
    const list = apib.split('\n');

    // Whether to start adding content
    let isContentAdd = false;

    for (const str of list) {
      const titleListObj = this.titleList[this.titleList.length - 1];
      const listObj = this.allData[this.allData.length - 1];

      // Distinguish between content, title and configuration
      if (str.slice(0, 1) === '#') {
        isContentAdd = true;
        this.titleDepth = 0;
        this.titleAdd(titleListObj, listObj, str);
      } else if (isContentAdd) {
        this.contentAdd(listObj, str);
      } else {
        this.configInfoAdd(str);
      }
    }
  };

  /**
   * Add the config info
   * @param str
   */
  private configInfoAdd = (str: string): void => {
    const arry = str.split(': ');
    if (arry.length === 2) {
      this.config[this.config.length - 1].info.push({ [arry[0]]: arry[1] });
    }
  };

  /**
   * Add the string into the last content attribute
   * @param obj
   * @param str
   */
  private contentAdd = (listObj: { [key: string]: any }, str: string): void => {
    if (listObj.child.length > 0) {
      this.contentAdd(listObj.child[listObj.child.length - 1], str);
    } else {
      listObj.content.push(str);
    }
  };

  /**
   * Add the string into the last title attribute
   * @param obj
   * @param title
   */
  private titleAdd = (
    titleListObj: { [key: string]: any },
    listObj: { [key: string]: any },
    title: string
  ): void => {
    const str = title.slice(1);
    const firstC = title.slice(0, 2);
    this.titleDepth++;
    if (firstC === '# ') {
      const type = this.typeGet(str);
      const titleHtml = title
        .slice(2)
        .replace('[', '<span>')
        .replace(']', '</span>');
      titleListObj.child.push({
        title: titleHtml,
        child: [],
        type,
      });

      listObj.child.push({
        title: titleHtml,
        content: [`<h${this.titleDepth}>${titleHtml}</h${this.titleDepth}>`],
        child: [],
        type,
      });
      return;
    } else if (firstC === '##') {
      if (listObj) {
        this.titleAdd(
          titleListObj.child[listObj.child.length - 1],
          listObj.child[listObj.child.length - 1],
          str
        );
      }
      return;
    }
    console.log('wrong apib-format!');
  };

  /**
   * Extract type from string
   * @param str
   */
  private typeGet = (
    str: string
  ):
    | {
        name: string;
        url?: string;
      }
    | undefined => {
    const regular = /\[(.+?)\]/;
    const arr = regular.exec(str);
    if (arr) {
      const value = arr[1];
      return this.requestMethod.includes(value)
        ? { name: value }
        : { name: 'url', url: value };
    }
    return undefined;
  };

  /**Zips for completed conversion
   * @param folderUrl
   */
  private completedTips = (folderUrl: string) => {
    console.log('');
    console.log('==========================================');
    console.log('=');
    console.log('= Conversion completed: ');
    console.log(`= ${folderUrl}`);
    console.log('=');
    console.log('==========================================');
    console.log('');
    console.log('');
  };
}
