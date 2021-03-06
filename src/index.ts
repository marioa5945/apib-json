import { resolve } from 'path';
const rimraf = require('rimraf');
const fs = require('fs');
import { toHtml } from './toHtml';
import ApiHandle from './apiHandle';

interface ifsTitleObj {
  title: string;
  child: Array<ifsDataObj>;
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
  private dataStructures: { [key: string]: Array<string> } = {};

  private requestMethod = ['get', 'post', 'put', 'delete'];

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
      const folderUrl = resolve('.', targetFolderUrl, folderName);
      rimraf.sync(folderUrl);
      fs.mkdirSync(folderUrl);

      // Get apib-file list
      const fileList = fs
        .readdirSync(resolve('.', apibFolderUrl))
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

        // set data structures to empty array
        this.dataStructures[title] = [];

        this.convert(info.toString());
      }

      // create instance of api data handling
      const apiHandle = new ApiHandle();
      const apiData: {
        [key: string]: Array<any>;
      } = apiHandle.run(this.allData, this.dataStructures);

      toHtml(this.allData, apiData);

      // Write to JSON file
      fs.writeFileSync(folderUrl + '/apiData.json', JSON.stringify(apiData));
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
    // Whether to start adding data structures
    let isDS = false;

    for (const str of list) {
      const titleListObj = this.titleList[this.titleList.length - 1];
      const listObj = this.allData[this.allData.length - 1];

      // Distinguish between content, title, configuration, and data structures
      if (str === '# Data Structures') {
        isDS = true;
      } else if (isDS && str.slice(0, 2) != '# ') {
        const keys = Object.keys(this.dataStructures);
        this.dataStructures[keys.slice(-1).toString()].push(str);
      } else if (str.slice(0, 1) === '#') {
        isDS = false;
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
   * @param titleStr
   */
  private titleAdd = (
    titleListObj: { [key: string]: any },
    listObj: { [key: string]: any },
    titleStr: string
  ): void => {
    const str = titleStr.slice(1);
    const firstC = titleStr.slice(0, 2);
    this.titleDepth++;
    if (firstC === '# ') {
      const type = this.typeGet(str);
      const title = titleStr
        .slice(2)
        .replace(/\[.+\]/, '')
        .replace(/ *$/, '');
      const titleHtml = titleStr
        .slice(2)
        .replace('[', '<span>')
        .replace(']', '</span>');
      titleListObj.child.push({
        title,
        titleHtml,
        type,
        child: [],
      });

      listObj.child.push({
        title,
        titleHtml: `<h${this.titleDepth}>${titleHtml}</h${this.titleDepth}>`,
        type,
        content: [],
        child: [],
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
  ): { name: string; url?: string } | undefined => {
    const regular = /\[(.+?)\]/;
    const arr = regular.exec(str);
    if (arr) {
      const value = arr[1];
      return this.requestMethod.includes(value.toLowerCase())
        ? { name: value.toLowerCase() }
        : { name: 'url', url: value };
    }
    return undefined;
  };

  /**
   * Tips for completed conversion
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
