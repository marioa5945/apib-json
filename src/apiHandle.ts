interface ifsDs {
  name: string;
  body: any;
  schema: any;
}

interface ifsDataObj {
  title: string;
  child: Array<ifsDataObj>;
  type?: { name: string; url?: string };
  content?: Array<string>;
}

interface ifsApiData {
  url: string;
  content?: Array<{
    type: string;
    parameters?: Array<{
      key: string;
      value: string;
      type?: Array<string>;
      description?: string;
    }>;
    list?: Array<{
      type: string;
      headers?: Array<{ key: string; value: string }>;
      body?: { [key: string]: string };
      code?: string;
      title?: string;
    }>;
  }>;
}

/**
 * data structures
 */
class DataStructures {
  protected dsData: { [key: string]: Array<ifsDs> } = {};

  /**
   * Get array of data structures object
   * @param arr - Array of data structures string
   */
  protected dsGet = (arr: { [key: string]: Array<string> }): void => {
    const keys = Object.keys(arr);
    for (const key of keys) {
      this.dsData[key] = [];
      for (const n of arr[key]) {
        this.dsAdd(n, key);
      }
      this.dsArrAdd(key);
    }
  };

  /**
   * add data structures object
   * @param str
   * @param key
   */
  private dsAdd = (str: string, key: string) => {
    // Object name acquisition
    const arr = /^\#+ (.+)/.exec(str);

    if (arr) {
      const name = arr[1].replace('(array)', '').replace(/(\s*$)/g, '');

      this.dsData[key].push({
        name,
        body: arr[1].indexOf('(array)') === -1 ? {} : [{}],
        schema:
          arr[1].indexOf('(array)') === -1
            ? {
                type: 'object',
                properties: {},
                required: [],
                $schema: 'http://json-schema.org/draft-04/schema#',
              }
            : [
                {
                  type: 'array',
                  items: {},
                  $schema: 'http://json-schema.org/draft-04/schema#',
                },
              ],
      });
    } else {
      const obj = this.dsData[key][this.dsData[key].length - 1];
      if (obj) {
        const attrRegular = /^\+ (?:(.+)(?:\: ?([^\(\-]+)))?(?:\((.+?)\))?(?: ?\- (.+))?/;
        const attrArr = attrRegular.exec(str);
        if (attrArr) {
          // add array attribute
          if (Array.isArray(obj.body)) {
            obj.body[0].rel = attrArr[3];
            return;
          }

          // object attribute acquisition
          const body = obj.body;
          const schema = obj.schema;

          if (attrArr[1] && attrArr[2]) {
            body[attrArr[1]] = attrArr[2].replace(/ *$/, '');
          }

          if (attrArr[1]) {
            schema.properties[attrArr[1]] = {};
            if (attrArr[4]) {
              schema.properties[attrArr[1]] = { description: attrArr[4] };
            }

            if (attrArr[3]) {
              const keywords = attrArr[3].replace(/ /g, '').split(',');
              if (keywords.includes('required')) {
                schema.required.push(attrArr[1]);
              }

              const arr = ['number', 'bool', 'array', 'string'].filter((n) =>
                keywords.includes(n)
              );
              schema.properties[attrArr[1]].type = arr[0] ?? 'string';
            } else {
              schema.properties[attrArr[1]].type = 'string';
            }
          }
        }
      }
    }
  };

  /**
   * add array
   * @param str
   * @param key
   */
  private dsArrAdd = (key: string) => {
    for (const n of this.dsData[key]) {
      if (Array.isArray(n.body) && n.body[0].rel) {
        const rel = n.body[0].rel;
        const obj = this.dsData[key].filter((n) => n.name === rel)[0];
        if (obj) {
          n.body[0] = obj.body;
          n.schema[0].items = obj.schema;

          delete n.body[0].rel;
          delete n.schema[0].$schema;
        }
      }
    }
  };
}

/**
 * api
 */
export default class ApiHandle extends DataStructures {
  private requestMethod = ['get', 'post', 'put', 'delete'];
  private apiData: { [key: string]: Array<ifsApiData> } = {};
  private folderTitle: string = '';

  /**
   * api handle
   * @param dataArr - array string of the all data
   * @param dsArr - array string of the data structures
   */
  public run = (
    dataArr: Array<ifsDataObj>,
    dsArr: { [key: string]: Array<string> }
  ): { [key: string]: Array<ifsApiData> } => {
    this.dsGet(dsArr);

    // Extract data to apiData
    for (const n of dataArr) {
      this.folderTitle = n.title;
      this.apiData[this.folderTitle] = [];
      this.extractData(n);
    }

    // Get tidy
    this.clearEmptyData([this.apiData]);

    return this.apiData;
  };

  /**
   * Clear empty array
   */
  private clearEmptyData(arr: Array<any>) {
    for (const n of arr) {
      const keys = Object.keys(n);
      for (const key of keys) {
        if (typeof n[key] === 'object') {
          if (Array.isArray(n[key])) {
            if (n[key].length === 0) {
              delete n[key];
            } else {
              this.clearEmptyData(n[key]);
            }
          } else {
            if (JSON.stringify(n[key]) === '{}') {
              delete n[key];
            }
          }
        }
      }
    }
  }

  private publicParameters: Array<any> | undefined;

  /**
   * extract data to variable of apiData
   * @param obj
   */
  private extractData = (obj: ifsDataObj) => {
    // Add url object when it exists
    if (obj.type) {
      if (obj.type.url) {
        // public parameters
        if (obj.content) {
          this.publicParameters = this.publicParametersGet(obj.content);
        }

        this.apiData[this.folderTitle].push({
          url: obj.type?.url,
        });
      } else if (this.requestMethod.includes(obj.type.name) && obj.content) {
        const { parameters, list } = this.apiInfoGet(obj.content);
        const last = this.apiData[this.folderTitle][
          this.apiData[this.folderTitle].length - 1
        ];

        last.content = last.content ?? [];
        last.content.push({
          type: obj.type.name,
          parameters: this.publicParameters
            ? [...this.publicParameters, ...parameters]
            : parameters,
          list,
        });
      }
    }

    if (obj.child.length > 0) {
      for (const n of obj.child) {
        this.extractData(n);
      }
    }
  };

  /**
   * Get parameters of the public
   * @param strArr
   */
  private publicParametersGet = (
    strArr: Array<string>
  ): Array<any> | undefined => {
    let isParameters = false;
    const parameters: Array<any> = [];
    for (const str of strArr) {
      if (isParameters) {
        const parameterRegular = / *\+ (.+): (?:`(.+)`)?.* \((.+)\) - (.+)/;
        const parameterArr = parameterRegular.exec(str);
        if (parameterArr) {
          const parameterTypeArr = parameterArr[3].replace(/ /g, '').split(',');
          const required = parameterTypeArr.includes('required') ?? undefined;

          parameters.push({
            key: parameterArr[1],
            value: parameterArr[2],
            type:
              parameterTypeArr.filter((n) => n !== 'required')[0] ?? 'string',
            required,
            description: parameterArr[4],
          });
        }
      } else if (str === '+ Parameters') {
        isParameters = true;
      }
    }
    return parameters.length > 0 ? parameters : undefined;
  };

  /**
   * api infomation
   * @param arr
   */
  private apiInfoGet = (
    arr: Array<string>
  ): { parameters: Array<any>; list: Array<any> } => {
    const parameters: Array<any> = [];
    const list: Array<any> = [];
    let type = '';
    let isParameters = false;
    for (const str of arr) {
      const arr = /.*?\+ (\w+)? ?(\d+)?([\w ]+)?(\(application\/json\))?/.exec(
        str
      );

      if (arr) {
        if (arr[1] === 'Request' || arr[1] === 'Response') {
          // The list of request object contains multiple response objects
          const obj: {
            [key: string]: any;
          } = {
            type: arr[1].toLowerCase(),
            headers: arr[4]
              ? [
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                  },
                ]
              : [],
            body: {},
          };
          if (arr[1] === 'Response') {
            // add a request object
            if (list.length === 0) {
              list.push({
                type: 'request',
                title: 'Default',
                headers: arr[4]
                  ? [
                      {
                        key: 'Content-Type',
                        value: 'application/json',
                      },
                    ]
                  : [],
                list: [],
              });
            }
            // The response object is added to the request object
            obj.code = arr[2];
            obj.schema = [];
            list[list.length - 1].list.push(obj);
          } else {
            obj.list = [];
            obj.title = arr[3] ? arr[3].replace(/ *$/, '') : 'Default';
            list.push(obj);
          }

          isParameters = false;
        } else if (isParameters && str !== '') {
          const parameterArr = / *\+ (.+): (?:`(.+)`)?.* \((.+)\) - (.+)/.exec(
            str
          );
          if (parameterArr) {
            const parameterTypeArr = parameterArr[3]
              .replace(/ /g, '')
              .split(',');
            const required = parameterTypeArr.includes('required') ?? undefined;

            parameters.push({
              key: parameterArr[1],
              value: parameterArr[2],
              type:
                parameterTypeArr.filter((n) => n !== 'required')[0] ?? 'string',
              required,
              description: parameterArr[4],
            });
          }
        } else {
          type = arr[1].toLowerCase();
          if (type === 'parameters') {
            isParameters = true;
          }
          if (type === 'attributes') {
            const attributesArr = /\((.+)\)/.exec(str);
            if (attributesArr) {
              const name = attributesArr[1];

              const dsObj = this.dsData[this.folderTitle].find(
                (n) => n.name === name
              );

              let last = list[list.length - 1];
              last =
                last.list.length > 0 ? last.list[last.list.length - 1] : last;
              last.body = dsObj?.body;
              last.schema = dsObj?.schema;
            }
          }
        }
      } else if (str.replace(/ *[{}]/g, '') !== '') {
        const attrArr = / *(.+): (.+)/.exec(str);
        if (attrArr) {
          let last = list[list.length - 1];
          last = last.list.length > 0 ? last.list[last.list.length - 1] : last;
          if (type === 'headers') {
            last.headers.push({
              key: attrArr[1].replace(/(^")|("$)/g, ''),
              value: attrArr[2].replace(/(^")|("$)/g, ''),
            });
          } else {
            last[type][
              attrArr[1].replace(/(^")|("$)/g, '')
            ] = attrArr[2].replace(/(^")|("$)|(",$)/g, '');
          }
        }
      }
    }
    return {
      parameters,
      list,
    };
  };
}
